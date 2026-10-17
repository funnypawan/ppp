#!/usr/bin/env python3
"""Build the final edited video: VO-synced rough cut of 89 scenes + Hindi narration.

Pipeline:
 1. Build master narration WAV (15 VO clips + 0.3s breaths between sections,
    1.0s lead silence, 4.0s tail silence).
 2. Allocate each of the 89 scenes inside its VO chunk window, weighted by the
    storyboard's estimated screen times; quantize to whole 24fps frames.
 3. Re-render every scene with its assigned camera move (from video/prompts.json)
    at the exact target duration; bake fades (intro fade-in, outro fade-out,
    dip-to-black at 3 chapter boundaries: 016->017, 065->066, 074->075).
 4. Concat segments (stream copy), loudness-normalize narration to -14 LUFS /
    -1 dBTP @48kHz, mux to H.264/AAC MP4.
Outputs: build/final/jab-mann-na-kare-final-1080p.mp4 + build/final/timeline.json
"""
import json, os, re, subprocess, sys, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "video"))
import make_clips as mc

FIN = os.path.join(ROOT, "build", "final")
SEG = os.path.join(FIN, "segments")
FPS = 24
GAP = 0.3          # breath between VO chunks
LEAD = 1.0         # silence before narration
TAIL = 4.0         # silence after narration (holds on scene 089)
# scene -> chunk (1-based) mapping, from audio/README.md analysis
CHUNK_SCENES = {
    1: range(1, 8), 2: range(8, 17), 3: range(17, 22), 4: range(22, 28),
    5: range(28, 34), 6: range(34, 40), 7: range(40, 48), 8: range(48, 55),
    9: range(55, 62), 10: range(62, 66), 11: range(66, 71), 12: range(71, 75),
    13: range(75, 80), 14: range(80, 85), 15: range(85, 90),
}
SCENE_CHUNK = {s: c for c, r in CHUNK_SCENES.items() for s in r}
DIP_AFTER = {16, 65, 74}   # dip-to-black chapter boundaries
X264 = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", "24", "-bf", "0", "-g", "24",
        "-sc_threshold", "0", "-movflags", "+faststart", "-an"]

def ff():
    return mc.ffmpeg_exe()

def storyboard_weights():
    txt = open(os.path.join(ROOT, "storyboard", "jab-mann-na-kare-storyboard.md"),
               encoding="utf-8").read()
    w = {}
    for n, body in re.findall(r"\nSCENE (\d{3})\n(.*?)(?=\nSCENE \d{3}|\n# |\Z)", txt, re.S):
        m = re.search(r"\*\*Estimated Screen Time:\*\*\s*(\d+)(?:–(\d+))?", body)
        a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else a
        w[int(n)] = (a + b) / 2
    return w

def wav_frames(path):
    w = wave.open(path); n = w.getnframes(); w.close(); return n

def build_master_audio():
    vos = [os.path.join(ROOT, "audio", f"vo-{i:02d}.wav") for i in range(1, 16)]
    params = None; chunks = []
    for v in vos:
        w = wave.open(v)
        p = w.getparams()
        if params is None:
            params = p
        assert p[:3] == params[:3], f"format mismatch in {v}"
        chunks.append(w.readframes(w.getnframes())); w.close()
    sr, nch, sw = params.framerate, params.nchannels, params.sampwidth
    silence = lambda sec: b"\x00" * int(sec * sr) * nch * sw
    out = [silence(LEAD)]
    bounds = []          # (start_sec, end_sec) of each chunk in master timeline
    t = LEAD
    for i, c in enumerate(chunks):
        dur = len(c) / (sr * nch * sw)
        bounds.append((t, t + dur))
        out.append(c)
        t += dur
        if i < len(chunks) - 1:
            out.append(silence(GAP)); t += GAP
    out.append(silence(TAIL)); t += TAIL
    master = os.path.join(FIN, "narration-master.wav")
    w = wave.open(master, "wb"); w.setnchannels(nch); w.setsampwidth(sw)
    w.setframerate(sr); w.writeframes(b"".join(out)); w.close()
    return master, bounds, t, (sr, nch, sw)

def scene_durations(bounds, total_audio, weights):
    """frames per scene; chunk windows follow audio bounds; chunk1 gets LEAD,
    chunk15 gets TAIL; remainder frames go to the chunk's heaviest scene."""
    total_frames = round(total_audio * FPS)
    windows = []
    for i, (s, e) in enumerate(bounds):
        if i == 0: s -= LEAD
        if i == len(bounds) - 1: e += TAIL
        windows.append((s, e))
    plan = {}
    used = 0
    for ci, (s, e) in enumerate(windows, 1):
        sc = list(CHUNK_SCENES[ci])
        wf = round((e - s) * FPS)
        wsum = sum(weights[x] for x in sc)
        fr = {x: max(int(wf * weights[x] / wsum), 72) for x in sc}  # >=3s each
        diff = wf - sum(fr.values())
        heavy = max(sc, key=lambda x: weights[x])
        fr[heavy] += diff
        for x in sc:
            plan[x] = dict(frames=fr[x], dur=fr[x] / FPS,
                           t_in=used / FPS, chunk=ci)
            used += fr[x]
    fix = total_frames - used
    if fix:
        plan[89]["frames"] += fix
        plan[89]["dur"] = plan[89]["frames"] / FPS
    # recompute absolute in-times
    t = 0.0
    for x in sorted(plan):
        plan[x]["t_in"] = round(t, 3); t += plan[x]["dur"]
    return plan, total_frames

def render_scene(n, frames, pdata, out):
    kind = mc.classify(pdata["camera"], pdata["motion"])
    zmax = mc.zmax_for(pdata["motion"], kind)
    vf = mc.build_vf(kind, zmax, frames)
    fades = []
    dur = frames / FPS
    if n == 1:
        fades.append("fade=t=in:st=0:d=1.2")
    if n in DIP_AFTER:
        fades.append(f"fade=t=out:st={dur-0.4:.3f}:d=0.4")
    if n - 1 in DIP_AFTER:
        fades.append("fade=t=in:st=0:d=0.4")
    if n == 89:
        fades.append(f"fade=t=out:st={dur-2.5:.3f}:d=2.5")
    if fades:
        vf += "," + ",".join(fades)
    src = os.path.join(ROOT, "images", f"scene-{n:03d}.jpg")
    cmd = [ff(), "-y", "-i", src, "-vf", vf, "-frames:v", str(frames)] + X264 + [out]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode == 0 and os.path.getsize(out) > 20_000

def main():
    os.makedirs(SEG, exist_ok=True)
    print("== audio master ==", flush=True)
    master, bounds, total_audio, _ = build_master_audio()
    print(f"narration master: {total_audio:.2f}s", flush=True)
    weights = storyboard_weights()
    pdata = json.load(open(os.path.join(ROOT, "video", "prompts.json"), encoding="utf-8"))
    plan, total_frames = scene_durations(bounds, total_audio, weights)
    print(f"video frames: {total_frames} ({total_frames/FPS:.2f}s)", flush=True)

    print("== segments ==", flush=True)
    segs = []
    for n in sorted(plan):
        out = os.path.join(SEG, f"scene-{n:03d}.mp4")
        segs.append(out)
        if os.path.exists(out) and abs(os.path.getsize(out)) > 20_000 and os.environ.get("FORCE") != "1":
            continue
        ok = render_scene(n, plan[n]["frames"], pdata[f"{n:03d}"], out)
        print(f"[{n:03d}] chunk{plan[n]['chunk']:02d} {plan[n]['dur']:.2f}s -> {'OK' if ok else 'FAIL'}", flush=True)
        if not ok:
            sys.exit(1)

    print("== concat (stream copy) ==", flush=True)
    lst = os.path.join(FIN, "concat.txt")
    open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
    vid = os.path.join(FIN, "video-silent.mp4")
    r = subprocess.run([ff(), "-y", "-f", "concat", "-safe", "0", "-i", lst,
                        "-c", "copy", vid], capture_output=True, text=True)
    if r.returncode != 0:
        print("concat copy failed, re-encoding:", r.stderr[-300:], flush=True)
        r = subprocess.run([ff(), "-y", "-f", "concat", "-safe", "0", "-i", lst,
                            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                            "-pix_fmt", "yuv420p", "-r", "24", "-an", vid],
                           capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(1)

    print("== audio loudnorm ==", flush=True)
    aud = os.path.join(FIN, "narration-final.wav")
    fade_out_st = total_audio - 3.0
    r = subprocess.run([ff(), "-y", "-i", master, "-af",
                        f"afade=t=in:st=0:d=0.5,afade=t=out:st={fade_out_st:.2f}:d=3,"
                        "loudnorm=I=-14:TP=-1:LRA=11",
                        "-ar", "48000", aud], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr[-500:])

    print("== final mux ==", flush=True)
    final = os.path.join(FIN, "jab-mann-na-kare-final-1080p.mp4")
    r = subprocess.run([ff(), "-y", "-i", vid, "-i", aud,
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                        "-shortest", "-movflags", "+faststart", final],
                       capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr[-500:])

    json.dump({str(k): v for k, v in plan.items()},
              open(os.path.join(FIN, "timeline.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    size = os.path.getsize(final) / 1048576
    print(f"DONE {final} {size:.1f} MB", flush=True)

if __name__ == "__main__":
    main()
