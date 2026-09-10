#!/usr/bin/env python3
"""
Mini DJ Intro builder
- 7 keyframe images -> Ken Burns animation (per-shot camera move)
- Hindi voiceover har shot ke saath sync
- Cut points pe sub-bass impact + logo se pehle riser
Output: out/mini-dj-intro-hindi-voice.mp4
"""
import subprocess, os, re, sys
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
BASE = "/home/user/ppp/mini-dj-intro"
KF = os.path.join(BASE, "keyframes")
WB = os.path.join(BASE, "video_build")
OUT = os.path.join(BASE, "out")
os.makedirs(OUT, exist_ok=True)

FPS = 30
W, H = 1920, 1080
LEAD, TAIL = 0.45, 0.65          # voice se pehle/shaad me khaali jagah (sec)

# (image, voice file, camera move)
SHOTS = [
    ("05_workshop_build.jpg",        "vo1.mp3", "in"),
    ("06_scriptE_truck_lineup.jpg",  "vo2.mp3", "right"),
    ("01_hero_truck.jpg",            "vo3.mp3", "in"),
    ("07_scriptE_doggy_entry.jpg",   "vo4.mp3", "left"),
    ("02_monkey_dj.jpg",             "vo5.mp3", "in"),
    ("04_squad_endcard.jpg",         "vo6.mp3", "out"),
    ("03_logo_reveal.jpg",           "vo7.mp3", "in_slow"),
]


def run(cmd, quiet=True):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print("CMD FAILED:", " ".join(cmd)[:400])
        print(p.stderr[-3000:])
        sys.exit(1)
    return p.stderr


def duration(path):
    err = run([FF, "-i", path, "-f", "null", "-"])
    m = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err)
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def motion_expr(kind, frames):
    cx, cy = "(iw-iw/zoom)/2", "(ih-ih/zoom)/2"
    if kind == "in":
        return f"z='min(1+0.0013*on,1.20)':x='{cx}':y='{cy}'"
    if kind == "in_slow":
        return f"z='min(1+0.0009*on,1.14)':x='{cx}':y='{cy}'"
    if kind == "out":
        return f"z='max(1.20-0.0013*on,1.00)':x='{cx}':y='{cy}'"
    if kind == "right":   # pan left -> right
        return (f"z='1.16':x='(iw-iw/zoom)*on/{frames-1}':"
                f"y='{cy}'")
    if kind == "left":    # pan right -> left
        return (f"z='1.16':x='(iw-iw/zoom)*(1-on/{frames-1})':"
                f"y='{cy}'")
    raise ValueError(kind)


# ---------- 1) per-shot segments ----------
segments, seg_durs, audio_durs = [], [], []
for i, (img, vo, kind) in enumerate(SHOTS, 1):
    voice = os.path.join(WB, vo)
    adur = duration(voice)
    audio_durs.append(adur)
    total = round(adur + LEAD + TAIL, 3)
    seg_durs.append(total)
    frames = int(total * FPS)
    seg = os.path.join(WB, f"seg{i:02d}.mp4")
    vf = (
        "scale=3840:2160:force_original_aspect_ratio=increase,"
        "crop=3840:2160,"
        f"zoompan={motion_expr(kind, frames)}:d=1:s={W}x{H}:fps={FPS},"
        "format=yuv420p"
    )
    run([
        FF, "-y",
        "-loop", "1", "-framerate", str(FPS), "-i", os.path.join(KF, img),
        "-i", voice,
        "-filter_complex", f"[0:v]{vf}[v];[1:a]adelay={int(LEAD*1000)}|{int(LEAD*1000)},apad[a]",
        "-map", "[v]", "-map", "[a]",
        "-t", str(total),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        seg,
    ])
    segments.append(seg)
    print(f"  shot {i}: {img}  voice={adur:.2f}s  clip={total:.2f}s  ({kind})")

# ---------- 2) concat ----------
lst = os.path.join(WB, "list.txt")
with open(lst, "w") as f:
    for s in segments:
        f.write(f"file '{s}'\n")
concat = os.path.join(WB, "concat.mp4")
run([FF, "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", concat])

# ---------- 3) SFX: boom + riser ----------
boom = os.path.join(WB, "boom.wav")
riser = os.path.join(WB, "riser.wav")
run([FF, "-y", "-f", "lavfi", "-i",
     "aevalsrc='0.95*exp(-5*t)*sin(2*PI*(72-28*t)*t)+0.25*exp(-45*t)*sin(2*PI*900*t)':d=1.2:s=44100",
     "-ac", "2", boom])
run([FF, "-y", "-f", "lavfi", "-i",
     "aevalsrc='0.30*sin(2*PI*(220+620*t)*t)*(t/1.6)':d=1.6:s=44100",
     "-af", "afade=t=out:st=1.35:d=0.25", "-ac", "2", riser])

# ---------- 4) mix SFX + master ----------
starts, t = [], 0.0
for d in seg_durs:
    starts.append(t)
    t += d
total_dur = t

inputs = [FF, "-y", "-i", concat, "-i", boom, "-i", riser]
fc, mix_ins = [], ["[0:a]"]
n = 0
# impact at every cut (except first shot) + one on the logo reveal (last shot)
impact_times = starts[1:]
logo_t = starts[-1]
for k, st in enumerate(impact_times):
    ms = int(st * 1000)
    vol = 0.42 if abs(st - logo_t) < 0.001 else 0.26
    fc.append(f"[1:a]volume={vol},adelay={ms}|{ms}[b{k}]")
    mix_ins.append(f"[b{k}]")
    n += 1
# riser ending exactly on the logo reveal
r_ms = int(max(logo_t - 1.5, 0) * 1000)
fc.append(f"[2:a]volume=0.30,adelay={r_ms}|{r_ms}[r0]")
mix_ins.append("[r0]")
n += 1

fade_out = max(total_dur - 0.6, 0)
fc.append(
    f"{''.join(mix_ins)}amix=inputs={n+1}:duration=first:normalize=0[mx];"
    f"[mx]afade=t=in:st=0:d=0.35,afade=t=out:st={fade_out:.2f}:d=0.6,"
    f"loudnorm=I=-16:TP=-1.5:LRA=11[a]"
)
fc.append(f"[0:v]fade=t=in:st=0:d=0.3,fade=t=out:st={fade_out:.2f}:d=0.6[v]")

final = os.path.join(OUT, "mini-dj-intro-hindi-voice.mp4")
run(inputs + ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]",
              "-c:v", "libx264", "-preset", "medium", "-crf", "19",
              "-pix_fmt", "yuv420p", "-movflags", "+faststart",
              "-c:a", "aac", "-b:a", "192k", final])

d = duration(final)
print(f"\n✅ DONE: {final}")
print(f"   duration={d:.2f}s  size={os.path.getsize(final)/1e6:.2f} MB")
