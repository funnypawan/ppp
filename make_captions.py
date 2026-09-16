#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bake Hindi text overlays into the final video.
Stage 1: render  -> captions/cap_*.png (1920x1080 RGBA, full frame)
Stage 2: encode  -> final_video.mp4 with burned-in captions
"""
import os, sys, json, subprocess, math
from PIL import Image, ImageDraw, ImageFilter
import imageio_ffmpeg
import hindi_text as ht

BASE = os.path.dirname(os.path.abspath(__file__))
CAPDIR = os.path.join(BASE, "captions")
W, H = 1920, 1080
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

GOLD_TOP, GOLD_BOT = (255, 240, 165), (255, 168, 42)
CREAM = (255, 250, 238)

# (start, end, position, lines)  position: B=bottom pill, H=hero center
CAPTIONS = [
    (1.2, 6.0, "B", ["'इस बार ज़रूर बदलूँगा'"]),
    (24.5, 30.0, "H", ["PROBLEM तुममें नहीं,", "तुम्हारे SYSTEM में है"]),
    (33.5, 39.0, "B", ["−4°C से −1°C तक —", "फिर भी ठोस"]),
    (47.2, 51.5, "B", ["0°C पर — पानी!", "यही है असली breakthrough"]),
    (52.4, 58.5, "B", ["हर degree बराबर लगा,", "पर आख़िरी ने तोड़ा"]),
    (62.0, 69.5, "H", ["1% बेहतर रोज़,", "37 गुना साल में"]),
    (75.0, 82.0, "B", ["Atomic Habits की", "पूरी story"]),
    (83.0, 91.0, "B", ["CUE > CRAVING >", "RESPONSE > REWARD"]),
    (99.5, 106.0, "B", ["पूरी video देखो —", "time निकालो"]),
    (111.0, 119.0, "B", ["'कल से शुरू करूँगा' —", "कल कभी नहीं आता"]),
    (121.0, 129.0, "H", ["MOTIVATION एक", "FEELING है"]),
    (132.0, 140.0, "H", ["SYSTEM > MOTIVATION"]),
    (149.5, 153.0, "B", ["Goals सबके एक जैसे होते हैं"]),
    (153.3, 160.0, "B", ["Olympics: medal या खाली हाथ?"]),
    (165.0, 172.5, "B", ["GOAL = destination", "SYSTEM = daily routine"]),
    (182.0, 188.5, "B", ["\"You do not rise to the", "level of your goals.\""]),
    (189.5, 197.0, "H", ["तुम अपने SYSTEMS", "के level तक गिरते हो"]),
    (199.5, 206.5, "B", ["2003 — British Cycling", "110 साल, सिर्फ़ 1 medal"]),
    (219.5, 227.0, "H", ["Dave Brailsford", "MARGINAL GAINS"]),
    (230.0, 238.0, "B", ["Saddle • Tires • Handlebar", "Bedsheets • Hand Gel"]),
    (244.0, 248.6, "B", ["हर change अकेले में", "'कुछ नहीं' लगता है"]),
    (248.9, 253.2, "B", ["पर मिलकर सब", "COMPOUND होते हैं"]),
    (253.6, 262.0, "H", ["48 OLYMPIC MEDALS", "सिर्फ़ 8 साल में"]),
    (267.0, 274.5, "B", ["छोटे changes =", "'atomic' changes"]),
    (276.0, 285.0, "H", ["1.01³⁶⁵ = 37.78", "0.99³⁶⁵ = 0.03"]),
    (291.5, 299.5, "B", ["Direction फर्क करती है —", "speed नहीं"]),
    (306.5, 314.0, "B", ["Plateau आता है —", "result देर से मिलता है"]),
    (318.7, 324.5, "H", ["THE PLATEAU OF", "LATENT POTENTIAL"]),
    (325.0, 331.5, "B", ["THE VALLEY OF", "DISAPPOINTMENT"]),
    (332.0, 338.5, "B", ["बर्फ़ पिघलने से पहले", "सब बेकार लगता है"]),
    (340.0, 347.5, "B", ["Rich लोग जल्दी नहीं —", "silent phase में काम करते हैं"]),
    (356.0, 364.0, "H", ["MOTIVATION नहीं,", "SYSTEM चाहिए"]),
    (365.8, 372.5, "B", ["1% better चुनो —", "identity अपने आप बदलेगी"]),
    (374.5, 380.2, "H", ["तुम्हारा 1% क्या है?"]),
]


def tight(img):
    bb = img.getbbox()
    return img.crop(bb) if bb else img


def rounded(draw, box, r, fill, outline=None, width=0):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def build_hero(lines, size):
    img = tight(ht.render_caption(lines, size_px=size, kind="black", gap=int(size * 0.34),
                                  grad=(GOLD_TOP, GOLD_BOT), glow=int(size * 0.16),
                                  stroke=(10, 8, 4), stroke_w=int(size * 0.115), shadow=True))
    # soft dark halo so text pops on busy frames
    halo = Image.new("RGBA", img.size, (0, 0, 0, 0))
    a = img.split()[3].filter(ImageFilter.GaussianBlur(size * 0.30)).point(lambda v: int(v * 0.85))
    halo.putalpha(a)
    out = Image.new("RGBA", (img.width + int(size * 0.7), img.height + int(size * 0.7)), (0, 0, 0, 0))
    out.alpha_composite(halo, (int(size * 0.35), int(size * 0.35)))
    out.alpha_composite(img, (int(size * 0.35), int(size * 0.35)))
    return tight(out)


def build_pill(lines, size):
    txt = tight(ht.render_caption(lines, size_px=size, kind="black", gap=int(size * 0.30),
                                 fill=CREAM, stroke=(0, 0, 0), stroke_w=int(size * 0.11),
                                 shadow=True))
    px, py = int(size * 0.72), int(size * 0.42)
    pw, ph = txt.width + px * 2, txt.height + py * 2
    out = Image.new("RGBA", (pw + 40, ph + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    # soft shadow under pill
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    ds = ImageDraw.Draw(sh)
    rounded(ds, (20 + 4, 20 + 7, 20 + pw - 4, 20 + ph + 3), int(size * 0.42), (0, 0, 0, 165))
    out.alpha_composite(sh.filter(ImageFilter.GaussianBlur(9)))
    # pill body
    rounded(d, (20, 20, 20 + pw, 20 + ph), int(size * 0.42), (10, 11, 16, 172),
            outline=(255, 196, 74, 110), width=3)
    out.alpha_composite(txt, (20 + px, 20 + py))
    return out


def render_all():
    os.makedirs(CAPDIR, exist_ok=True)
    for old in os.listdir(CAPDIR):
        if old.endswith(".png"):
            os.remove(os.path.join(CAPDIR, old))
    meta = []
    for i, (st, en, pos, lines) in enumerate(CAPTIONS):
        if pos == "H":
            n = len(lines)
            size = 104 if n == 1 else (94 if max(len(x) for x in lines) < 20 else 86)
            art = build_hero(lines, size)
            y = int(H * 0.615) - art.height // 2
        else:
            size = 76 if max(len(x) for x in lines) < 26 else 68
            art = build_pill(lines, size)
            y = H - 150 - art.height
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(art, ((W - art.width) // 2, y))
        p = os.path.join(CAPDIR, f"cap_{i:02d}.png")
        canvas.save(p)
        meta.append({"i": i, "file": os.path.basename(p), "start": st, "end": en,
                     "pos": pos, "lines": lines, "size": size, "y": y})
    with open(os.path.join(CAPDIR, "captions.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"rendered {len(meta)} caption PNGs -> captions/")
    return meta


def encode(meta, src="final_video_no_text.mp4", dst="final_video.mp4"):
    n = len(meta)
    inputs = ["-i", src]
    for m in meta:
        inputs += ["-i", os.path.join(CAPDIR, m["file"])]
    parts = []
    prev = "[0:v]"
    for k, m in enumerate(meta, start=1):
        a, b = m["start"], m["end"]
        yexpr = f"26*(1-min(1,(t-{a})/0.35))"
        o = f"[vx{k}]"
        parts.append(f"{prev}[{k}:v]overlay=x=0:y='{yexpr}':"
                     f"enable='between(t,{a:.2f},{b:.2f})'{o}")
        prev = o
    parts.append(f"{prev}format=yuv420p[vout]")
    fc = ";".join(parts)
    total = 380.77
    cmd = ([FFMPEG, "-y", "-loglevel", "error"] + inputs +
           ["-filter_complex", fc, "-map", "[vout]", "-map", "0:a",
            "-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-maxrate", "1900k", "-bufsize", "3800k",
            "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", dst])
    print("encoding with", n, "caption overlays ...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print("FAILED rc=", r.returncode, r.stderr[-2000:])
        sys.exit(1)
    print("OK:", dst, round(os.path.getsize(dst) / 1048576, 1), "MiB")


if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "render"
    if stage == "render":
        render_all()
    elif stage == "encode":
        with open(os.path.join(CAPDIR, "captions.json"), encoding="utf-8") as f:
            encode(json.load(f))
