#!/usr/bin/env python3
"""Generate 89 cinematic animatic clips (Ken Burns camera moves) from still images.

Uses ffmpeg (via imageio-ffmpeg) to apply the camera movement specified in
video/prompts.json to each images/scene-XXX.jpg, producing build/clips/scene-XXX.mp4
(1920x1080, 24 fps, H.264).

Camera-move rules:
  - Pull-back  -> zoom eases from ZMAX down to 1.0
  - Pan/Dolly/Track/Drift -> constant zoom ZP, crop window eases left->right
  - Static/micro -> very slow push 1.0 -> 1.04
  - Push-in (default) -> zoom eases 1.0 -> ZMAX by motion intensity
Clips are session artifacts (not committed); rerun this script to regenerate.
"""
import json, math, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(ROOT, "build", "clips")
FPS = 24
W, H = 1920, 1080
SW, SH = 4800, 2700  # upscale before zoompan to reduce stepping artifacts

def ffmpeg_exe():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def parse_duration(s):
    nums = [int(x) for x in re.findall(r"\d+", s)]
    if not nums:
        return 6
    return round(sum(nums) / len(nums))

def classify(camera, intensity):
    c = camera.lower()
    if "pull" in c:
        return "pull"
    if "pan" in c or "dolly" in c or "track" in c:
        return "pan"
    if "drift" in c and "push" not in c:
        return "pan"
    if "static" in c and "push" not in c:
        return "micro"
    if "static" in c:  # e.g. "Static / very slow push-in"
        return "micro"
    return "push"

def zmax_for(intensity, kind):
    i = intensity.upper()
    if kind == "micro":
        return 1.04
    if kind == "pull":
        return 1.20 if "MEDIUM" in i else 1.12
    if "HIGH" in i:
        return 1.15
    if i.startswith("MEDIUM"):
        return 1.12
    if "MEDIUM" in i:  # LOW–MEDIUM
        return 1.09
    return 1.07  # LOW

EASE = "(0.5-0.5*cos(PI*on/{fr}))"

def build_vf(kind, zmax, frames):
    fr = max(frames - 1, 1)
    ease = EASE.format(fr=fr)
    if kind == "push" or kind == "micro":
        a = round(zmax - 1.0, 4)
        z = f"'1+{a}*{ease}'"
        x = "'iw/2-(iw/zoom)/2'"
        y = "'ih/2-(ih/zoom)/2'"
    elif kind == "pull":
        a = round(zmax - 1.0, 4)
        z = f"'{zmax}-{a}*{ease}'"
        x = "'iw/2-(iw/zoom)/2'"
        y = "'ih/2-(ih/zoom)/2'"
    else:  # pan
        zp = round(min(zmax + 0.08, 1.22), 3)
        z = f"'{zp}'"
        x = f"'(iw-iw/zoom)*{ease}'"
        y = "'ih/2-(ih/zoom)/2'"
    return (f"scale={SW}:{SH}:flags=lanczos,"
            f"zoompan=z={z}:x={x}:y={y}:d={frames}:s={W}x{H}:fps={FPS},"
            f"format=yuv420p")

def main():
    exe = ffmpeg_exe()
    data = json.load(open(os.path.join(ROOT, "video", "prompts.json"), encoding="utf-8"))
    os.makedirs(CLIPS, exist_ok=True)
    scenes = sorted(data)
    total = len(scenes)
    for idx, n in enumerate(scenes, 1):
        src = os.path.join(ROOT, data[n]["image"])
        out = os.path.join(CLIPS, f"scene-{n}.mp4")
        if os.path.exists(out) and os.path.getsize(out) > 50_000:
            print(f"[{idx}/{total}] {n} exists, skip", flush=True)
            continue
        dur = parse_duration(data[n]["duration"])
        kind = classify(data[n]["camera"], data[n]["motion"])
        zmax = zmax_for(data[n]["motion"], kind)
        frames = dur * FPS
        vf = build_vf(kind, zmax, frames)
        cmd = [exe, "-y", "-i", src, "-vf", vf, "-frames:v", str(frames),
               "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
               "-movflags", "+faststart", "-an", out]
        r = subprocess.run(cmd, capture_output=True, text=True)
        ok = r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 20_000
        print(f"[{idx}/{total}] {n} {kind} z{zmax} {dur}s -> {'OK' if ok else 'FAIL'}", flush=True)
        if not ok:
            print(r.stderr[-600:], flush=True)
    sizes = sum(os.path.getsize(os.path.join(CLIPS, f)) for f in os.listdir(CLIPS))
    print(f"DONE: {len(os.listdir(CLIPS))} clips, total {sizes/1048576:.1f} MB", flush=True)

if __name__ == "__main__":
    main()
