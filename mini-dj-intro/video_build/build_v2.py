#!/usr/bin/env python3
"""
Mini DJ intro — v2 builder
  wide      : 1920x1080 (clean, no captions)  + 145 BPM music
  vertical  : 1080x1920 (blurred bg + captions) + 145 BPM music   -> Shorts/Reels
Same generated images + same Hindi voiceover.
"""
import subprocess, os, re, sys
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
BASE = "/home/user/ppp/mini-dj-intro"
KF, WB, OUT = f"{BASE}/keyframes", f"{BASE}/video_build", f"{BASE}/out"
os.makedirs(OUT, exist_ok=True)
FPS, LEAD, TAIL = 30, 0.45, 0.65
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
MUSIC = None            # WB/music.wav default
MUSIC_VOL_DIALOG = 0.055   # dialogue ke waqt music level
MUSIC_VOL_LOGO  = 0.115    # logo reveal pe music level

SHOTS = [
    ("05_workshop_build.jpg",       "vo1.mp3", "in",      "Cardboard + glue gun se shuru!"),
    ("06_scriptE_truck_lineup.jpg", "vo2.mp3", "right",   "Ab kis gaadi par lagega DJ?"),
    ("01_hero_truck.jpg",           "vo3.mp3", "in",      "4 Speaker + LED = TRUCK READY!"),
    ("07_scriptE_doggy_entry.jpg",  "vo4.mp3", "left",    "Doggy bhai laaya naya generator!"),
    ("02_monkey_dj.jpg",            "vo5.mp3", "in",      "Bajao bajao! Monkey bhai on DJ"),
    ("04_squad_endcard.jpg",        "vo6.mp3", "out",     "Poora parivaar, poora dhamal!"),
    ("03_logo_reveal.jpg",          "vo7.mp3", "in_slow", "MINI DJ - Subscribe karo!"),
]


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        print("FAILED:", " ".join(cmd)[:500]); print(p.stderr[-3000:]); sys.exit(1)
    return p.stderr


def duration(path):
    err = run([FF, "-i", path, "-f", "null", "-"])
    h, mi, s = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", err).groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def caption_png(text, path, width=1080, fontsize=56):
    """Pillow se caption PNG banao (transparent bg) - drawtext filter na hone ki wajah se."""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype(FONT, fontsize)
    pad_x, pad_y, radius = 28, 16, 18
    tmp = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    box = tmp.textbbox((0, 0), text, font=font, stroke_width=2)
    tw, th = box[2] - box[0], box[3] - box[1]
    img = Image.new("RGBA", (tw + pad_x * 2, th + pad_y * 2 + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=radius,
                        fill=(0, 0, 0, 130))
    d.text((pad_x - box[0], pad_y - box[1]), text, font=font,
           fill=(255, 255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0, 200))
    img.save(path)
    return img.size


def zoom(kind, frames, w, h):
    cx, cy = "(iw-iw/zoom)/2", "(ih-ih/zoom)/2"
    z = {
        "in":      f"min(1+0.0013*on,1.20)",
        "in_slow": f"min(1+0.0009*on,1.14)",
        "out":     f"max(1.20-0.0013*on,1.00)",
        "right":   "1.16", "left": "1.16",
    }[kind]
    if kind == "right":
        x = f"(iw-iw/zoom)*on/{frames-1}"
    elif kind == "left":
        x = f"(iw-iw/zoom)*(1-on/{frames-1})"
    else:
        x = cx
    return f"zoompan=z='{z}':x='{x}':y='{cy}':d=1:s={w}x{h}:fps={FPS}"


def build_segments(layout):
    """video-only segments + concat; returns (concat_path, starts, durations)"""
    starts, durs, segs = [], [], []
    t = 0.0
    for i, (img, vo, kind, cap) in enumerate(SHOTS, 1):
        total = round(duration(os.path.join(WB, vo)) + LEAD + TAIL, 3)
        frames = int(total * FPS)
        seg = os.path.join(WB, f"{layout}_seg{i:02d}.mp4")
        src = os.path.join(KF, img)
        need_cap = (layout == "vertical")
        if layout == "wide":
            vf = (f"scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,"
                  f"{zoom(kind, frames, 1920, 1080)},format=yuv420p")
            extra_in = []
            filters = [f"[0:v]{vf}[v]"]
        else:
            # background: cover + blur; foreground: 1080 wide sharp card on top
            bg = (f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                  f"boxblur=28:2,eq=brightness=-0.12:saturation=1.05,"
                  f"{zoom(kind, frames, 1080, 1920)}[bg]")
            fg = (f"scale=1080:-2,{zoom(kind, frames, 1080, 608)}[fg]")
            cappng = os.path.join(WB, f"cap_{layout}_{i}.png")
            if need_cap:
                cw, _ = caption_png(cap, cappng)
                extra_in = ["-loop", "1", "-framerate", str(FPS), "-i", cappng]
                filters = [f"[0:v]{bg}", f"[0:v]{fg}",
                           "[bg][fg]overlay=0:656:format=auto[ov]",
                           f"[1:v]format=rgba[cap]",
                           f"[ov][cap]overlay=x=({1080}-{cw})/2:y=176[ovc]",
                           f"[ovc]vignette=PI/5,format=yuv420p[v]"]
            else:
                extra_in = []
                filters = [f"[0:v]{bg}", f"[0:v]{fg}",
                           "[bg][fg]overlay=0:656:format=auto[ov]",
                           "[ov]vignette=PI/5,format=yuv420p[v]"]
        run([FF, "-y", "-loop", "1", "-framerate", str(FPS), "-i", src] + extra_in + [
             "-filter_complex", ";".join(filters), "-map", "[v]", "-t", str(total),
             "-c:v", "libx264", "-preset", "medium", "-crf", "19", seg])
        segs.append(seg); starts.append(t); durs.append(total); t += total
        print(f"  [{layout}] shot {i}: {total:.2f}s frames={frames} ({kind})")
    lst = os.path.join(WB, f"{layout}_list.txt")
    open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
    concat = os.path.join(WB, f"{layout}_concat.mp4")
    run([FF, "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", concat])
    return concat, starts, durs


def final_mix(layout, concat, starts, durs, out_name):
    total = sum(durs)
    logo_t = starts[-1]
    boom = os.path.join(WB, "boom.wav"); riser = os.path.join(WB, "riser.wav")
    run([FF, "-y", "-f", "lavfi", "-i",
         "aevalsrc='0.95*exp(-5*t)*sin(2*PI*(72-28*t)*t)+0.25*exp(-45*t)*sin(2*PI*900*t)':d=1.2:s=44100",
         "-ac", "2", boom])
    run([FF, "-y", "-f", "lavfi", "-i",
         "aevalsrc='0.30*sin(2*PI*(220+620*t)*t)*(t/1.6)':d=1.6:s=44100",
         "-af", "afade=t=out:st=1.35:d=0.25", "-ac", "2", riser])

    cmd = [FF, "-y", "-i", concat]
    for i, (img, vo, kind, cap) in enumerate(SHOTS, 1):
        cmd += ["-i", os.path.join(WB, vo)]
    music_path = MUSIC or os.path.join(WB, "music.wav")
    cmd += ["-stream_loop", "6", "-i", music_path, "-i", boom, "-i", riser]

    nvoice, nmix = len(SHOTS), 0
    fc, mix = [], ["[music]"]
    # music: low during dialogue, lifts at logo reveal
    fc.append(f"[{nvoice+1}:a]volume='if(gt(t,{logo_t:.2f}),{MUSIC_VOL_LOGO},{MUSIC_VOL_DIALOG})':eval=frame,"
              f"atrim=0:{total:.2f},afade=t=out:st={total-0.8:.2f}:d=0.8[music]")
    # voice over
    for i in range(nvoice):
        ms = int((starts[i] + LEAD) * 1000)
        fc.append(f"[{i+1}:a]adelay={ms}|{ms},volume=1.0[v{i}]")
        mix.append(f"[v{i}]"); nmix += 1
    # impacts on every cut + louder on logo
    for k, st in enumerate(starts[1:]):
        ms = int(st * 1000)
        vol = 0.30 if abs(st - logo_t) < 1e-6 else 0.18
        fc.append(f"[{nvoice+2}:a]volume={vol},adelay={ms}|{ms}[b{k}]")
        mix.append(f"[b{k}]"); nmix += 1
    # riser ending on the logo reveal
    rms = int(max(logo_t - 1.5, 0) * 1000)
    fc.append(f"[{nvoice+3}:a]volume=0.26,adelay={rms}|{rms}[r0]")
    mix.append("[r0]"); nmix += 1

    fc.append(f"{''.join(mix)}amix=inputs={nmix+1}:duration=first:normalize=0[mx];"
              f"[mx]afade=t=in:st=0:d=0.35,afade=t=out:st={total-0.7:.2f}:d=0.7,"
              f"loudnorm=I=-15:TP=-1.5:LRA=11[a]")
    fc.append(f"[0:v]fade=t=in:st=0:d=0.3,fade=t=out:st={total-0.7:.2f}:d=0.7[v]")

    out = os.path.join(OUT, out_name)
    run(cmd + ["-filter_complex", ";".join(fc), "-map", "[v]", "-map", "[a]",
               "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", out])
    print(f"\n✅ {out}\n   duration={duration(out):.2f}s  size={os.path.getsize(out)/1e6:.2f} MB")
    return out


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    jobs = []
    if which in ("both", "wide"):
        jobs.append(("wide", "mini-dj-intro-hindi-voice-music.mp4"))
    if which in ("both", "vertical"):
        jobs.append(("vertical", "mini-dj-shorts-vertical-9x16.mp4"))
    for layout, name in jobs:
        print(f"\n=== {layout.upper()} ===")
        concat, starts, durs = build_segments(layout)
        final_mix(layout, concat, starts, durs, name)
