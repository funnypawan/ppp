#!/usr/bin/env python3
"""
15-second FAST PUNCH-IN BUMPER
Existing videos se 4 energetic moments uthata hai, unpe tez punch-in zoom lagata hai,
aur music + sub-bass impacts ke saath ek punchy bumper banata hai.
Run: python3 build_bumper.py both
"""
import subprocess, os, sys
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
BASE = "/home/user/ppp/mini-dj-intro"
OUT  = f"{BASE}/out"
WB   = f"{BASE}/bumper_build"
MUSIC = f"{BASE}/video_build/music.wav"
os.makedirs(WB, exist_ok=True)

INTRO = f"{OUT}/mini-dj-intro-hindi-voice-bass-16x9.mp4"  # truck hero @13.70, monkey @24.89, logo @35.09
STORY = f"{OUT}/mini-dj-story-birthday-16x9.mp4"         # monkey dance @31.85

# (source video, start time, duration)
CLIPS = [
    (INTRO, 13.70, 3.60),   # truck hero shot
    (STORY, 31.85, 3.60),   # monkey dance + cake
    (INTRO, 24.89, 3.60),   # monkey bhai DJ console
    (INTRO, 35.09, 3.50),   # MINI DJ logo reveal
]
TOTAL = sum(c[2] for c in CLIPS)


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print("FAILED:", " ".join(cmd)[:400]); print(p.stderr[-2500:]); sys.exit(1)


def punch(speed, w, h):
    m = 1 + speed * 1000
    return (f"zoompan=z='min(1+{speed}*on,{m:.2f})':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':"
            f"d=1:s={w}x{h}:fps=30")

def segment(src, t0, dur, i, layout):
    seg = f"{WB}/{layout}_{i}.mp4"
    if layout == "wide":
        vf = (f"scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,"
              f"{punch(0.0036, 1920, 1080)},format=yuv420p")
        run([FF, "-y", "-ss", str(t0), "-t", str(dur), "-i", src,
             "-vf", vf, "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19", seg])
    else:
        bg = (f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
              f"boxblur=30:2,eq=brightness=-0.15,{punch(0.0018, 1080, 1920)}[bg]")
        fg = f"scale=1080:-2,{punch(0.0036, 1080, 608)}[fg]"
        run([FF, "-y", "-ss", str(t0), "-t", str(dur), "-i", src,
             "-filter_complex", f"[0:v]{bg};[0:v]{fg};[bg][fg]overlay=0:656:format=auto,"
                                f"vignette=PI/5,format=yuv420p[v]",
             "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "19", seg])
    return seg


def build(layout, out_name):
    segs = [segment(src, t0, d, i, layout) for i, (src, t0, d) in enumerate(CLIPS, 1)]
    lst = f"{WB}/{layout}_list.txt"
    open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
    vcat = f"{WB}/{layout}_video.mp4"
    run([FF, "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vcat])

    # ---- audio: music + impacts + riser on logo ----
    boom, riser = f"{WB}/boom.wav", f"{WB}/riser.wav"
    run([FF, "-y", "-f", "lavfi", "-i",
         "aevalsrc='0.95*exp(-5*t)*sin(2*PI*(72-28*t)*t)':d=1.0:s=44100", "-ac", "2", boom])
    run([FF, "-y", "-f", "lavfi", "-i",
         "aevalsrc='0.32*sin(2*PI*(200+700*t)*t)*(t/1.6)':d=1.6:s=44100",
         "-af", "afade=t=out:st=1.35:d=0.25", "-ac", "2", riser])

    cuts = [0.0]
    t = 0.0
    for _, _, d in CLIPS:
        t += d; cuts.append(t)
    logo_t = cuts[-2]

    cmd = [FF, "-y", "-i", vcat, "-stream_loop", "3", "-i", MUSIC, "-i", boom, "-i", riser]
    fc, mix = [], ["[m]"]
    fc.append(f"[1:a]volume=0.15,atrim=0:{TOTAL:.2f},afade=t=out:st={TOTAL-0.6:.2f}:d=0.6[m]")
    n = 1
    for k, st in enumerate(cuts[:-1]):
        ms = int(st * 1000)
        vol = 0.34 if abs(st - logo_t) < 1e-6 else 0.22
        fc.append(f"[2:a]volume={vol},adelay={ms}|{ms}[b{k}]"); mix.append(f"[b{k}]"); n += 1
    rms = int(max(logo_t - 1.5, 0) * 1000)
    fc.append(f"[3:a]volume=0.26,adelay={rms}|{rms}[r0]"); mix.append("[r0]"); n += 1
    fc.append(f"{''.join(mix)}amix=inputs={n}:duration=first:normalize=0[mx];"
              f"[mx]afade=t=in:st=0:d=0.2,afade=t=out:st={TOTAL-0.6:.2f}:d=0.6,"
              f"loudnorm=I=-14:TP=-1.5:LRA=9[a]")
    pre = "scale=1920:1080," if layout == "wide" else ""   # vertical apne size me hi rahe
    fc.append(f"[0:v]{pre}fade=t=in:st=0:d=0.15,"
              f"fade=t=out:st={TOTAL-0.5:.2f}:d=0.5[v]")

    out = f"{OUT}/{out_name}"
    run(cmd + ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]",
               "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", out])
    print(f"✅ {out}  ({TOTAL:.2f}s, {os.path.getsize(out)/1e6:.2f} MB)")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    if which in ("both", "wide"):
        build("wide", "mini-dj-bumper-15s-16x9.mp4")
    if which in ("both", "vertical"):
        build("vertical", "mini-dj-bumper-15s-9x16.mp4")
