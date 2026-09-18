#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_intro.py — "सोच सेठ / SOCHSETH" YouTube channel intro (bumper), 5 second.

1920x1080 @ 60 fps · 300 frames · H.264 + AAC
Design + motion + sound sab program se banta hai (koi editor nahi):

    [beat sheet]
    0.00-0.55  glow rise, dust, thin light line
    0.55-1.30  letters SOCH / SETH fly in (stagger + tracking expand + scale overshoot)
    1.30       IMPACT  -> sparks burst, shake, sub-boom, glow flare
    1.34       voice sting "सोच सेठ" (AI voice) + bell shimmer
    1.50-2.60  underline bar grow · हिन्दी tagline · english kicker
    2.30-3.10  Sheru mascot pop-up (squash + tail wag) + whoosh
    3.30-3.95  shine sweep through the wordmark
    4.05-5.00  SUBSCRIBE pill pulse, slow push-in, fade to black

    python3 make_intro.py --preview 0.3,1.0,1.35,2.6,4.4     # stills
    python3 make_intro.py --render                           # MP4
    python3 make_intro.py --render --gif                     # + chhota preview.gif
"""
from __future__ import annotations

import argparse
import math
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ANIM = os.path.dirname(HERE)
sys.path.insert(0, ANIM)
from deva_text import DevaFont                      # noqa: E402
import make_animation as MA                          # noqa: E402  (SVG loader + dog rig)

bar_gradient = MA.bar_gradient

OUT_DIR = os.path.join(HERE, "out")
VOICE = os.path.join(HERE, "audio", "voice_sting.wav")

W, H = 1920, 1080
FPS = 60
DUR = 5.0
M = 80                                              # overscan margin (shake/zoom ke liye)
K = 1.0                                             # layout unit (1.0 = 1080p baseline)
VERT = False                                        # True -> 9:16 layout (mascot lockup ke neeche)


def u(px):
    """Layout pixels ko current resolution ke scale par laata hai."""
    return px * K


def configure(ratio="16x9", scale=1.0):
    """ratio: 16x9 (YouTube) | 9x16 (Shorts/Reels) | 1x1 (feed). scale: 2 -> 4K."""
    global W, H, M, K, VERT
    base = {"16x9": (1920, 1080), "9x16": (1080, 1920), "1x1": (1080, 1080), "4x5": (1080, 1350)}[ratio]
    W, H = int(base[0] * scale), int(base[1] * scale)
    M = int(80 * scale)
    K = float(scale)
    VERT = ratio in ("9x16", "1x1", "4x5")
    _grad_cache.clear()
    return f"{W}x{H}"
SS = 2                                              # wordmark supersample

GOLD = (255, 215, 0)
TEAL = (0, 212, 170)
CORAL = (255, 107, 107)
LIGHT = (236, 238, 245)
BG0, BG1 = (10, 11, 16), (22, 25, 36)

BRAND_A, BRAND_B = "SOCH", "SETH"
TAG_HI = "रोज़ की सोच, बड़ा असर"
KICKER = "SELF-IMPROVEMENT · HINDI"

FONT_DISPLAY = os.path.join(ANIM, "fonts", "Poppins_900Black.ttf")
FONT_BOLD = os.path.join(ANIM, "fonts", "Mukta_700Bold.ttf")
FONT_MED = os.path.join(ANIM, "fonts", "Mukta_500Medium.ttf")

# ---------------------------------------------------------------- easings
def clamp01(x):
    return max(0.0, min(1.0, x))


def ease_out(p):
    return 1 - (1 - p) ** 3


def ease_in_out(p):
    return p * p * (3 - 2 * p)


def back_out(p, k=1.70158):
    p -= 1
    return 1 + (k + 1) * p ** 3 + k * p ** 2


def seg(t, a, b):
    return clamp01((t - a) / max(1e-6, b - a))


# ---------------------------------------------------------------- assets
_fcache = {}


def font(kind, size):
    key = (kind, int(size))
    if key not in _fcache:
        path = {"disp": FONT_DISPLAY, "bold": FONT_BOLD, "med": FONT_MED}[kind]
        _fcache[key] = DevaFont(path, size, ss=3)
    return _fcache[key]


def gradient_strip(w, h, stops):
    """Horizontal multi-stop RGBA gradient. stops = [(pos0..1, (r,g,b)), ...]"""
    x = np.linspace(0, 1, w, dtype=np.float32)
    arr = np.zeros((h, w, 3), np.float32)
    xs = [s[0] for s in stops]
    for c in range(3):
        ys = np.array([s[1][c] for s in stops], np.float32)
        arr[:, :, c] = np.interp(x, xs, ys)[None, :]
    return arr


_grad_cache = {}


def grad_image(kind, size):
    """Cached full-canvas horizontal gradient (used as the letter fill)."""
    key = (kind, size)
    if key not in _grad_cache:
        stops = {
            "silver": [(0.0, (214, 220, 234)), (0.34, LIGHT), (0.62, (255, 255, 255)), (1.0, (186, 195, 214))],
            "gold": [(0.0, (255, 226, 120)), (0.30, GOLD), (0.62, (140, 240, 210)), (1.0, TEAL)],
        }[kind]
        y = np.linspace(0, 1, size[1], dtype=np.float32)
        col = np.zeros((size[1], 3), np.float32)
        for c in range(3):
            col[:, c] = np.interp(y, [st[0] for st in stops], [st[1][c] for st in stops])
        arr = np.repeat(col[None, :, :], size[0], axis=0).transpose(1, 0, 2)
        _grad_cache[key] = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"), "RGB")
    return _grad_cache[key]


def text_alpha_layer(size, letters, positions, scales, alphas, ss=SS):
    """Composite per-letter ink masks into one 'L' layer at 1/ss resolution."""
    lay = Image.new("L", (size[0] * ss, size[1] * ss), 0)
    for (mask, w, h), (x, y), s, a in zip(letters, positions, scales, alphas):
        if a <= 0.01 or w < 2:
            continue
        ww = max(1, int(round(w * s)))
        hh = max(1, int(round(h * s)))
        m = mask.resize((ww, hh), Image.LANCZOS) if (ww, hh) != (w, h) else mask
        if a < 0.995:
            m = m.point(lambda v, aa=a: int(v * aa))
        lay.paste(255, (int(x * ss), int(y * ss)), m)
    return lay.resize(size, Image.LANCZOS)


_glow_cache = {}


def glow_sprite(diameter, softness=2.4):
    key = (diameter, softness)
    if key not in _glow_cache:
        ax = np.linspace(-1, 1, diameter, dtype=np.float32)
        rr = (ax[None, :] ** 2 + ax[:, None] ** 2).astype(np.float32)
        g = np.exp(-rr * softness) * (1 - np.clip(rr, 0, 1)) ** 0.35
        _glow_cache[key] = np.clip(g * 255, 0, 255).astype("uint8")
    return _glow_cache[key]


def make_bg():
    v, u = np.mgrid[0:H + 2 * M, 0:W + 2 * M]
    u = u.astype(np.float32) / (W + 2 * M)
    v = v.astype(np.float32) / (H + 2 * M)
    arr = np.empty((3, H + 2 * M, W + 2 * M), np.float32)
    for i, (a, b) in enumerate(zip(BG0, BG1)):
        arr[i] = a + (b - a) * (0.55 * (1 - v))
    r2 = ((u - 0.42) * 1.35) ** 2 + ((v - 0.5) * 1.5) ** 2
    arr += (0.30 * np.exp(-r2 / 0.045))[None] * np.array(GOLD, np.float32)[:, None, None]
    arr += (0.10 * np.exp(-((u - 0.86) ** 2 + (v - 0.72) ** 2) / 0.02))[None] * np.array(TEAL, np.float32)[:, None, None]
    vg = 1 - 0.75 * np.clip(((u - 0.5) * 2.05) ** 2 + ((v - 0.5) * 1.75) ** 2, 0, 1) ** 1.5
    arr *= vg[None]
    rng = np.random.default_rng(21)
    arr += rng.normal(0, 2.6, arr.shape)
    im = Image.fromarray(np.clip(arr, 0, 255).astype("uint8").transpose(1, 2, 0), "RGB").convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    step = int(130 * max(1, K))
    for x in range(0, W + 2 * M, step):
        d.line([(x, 0), (x + 140, H + 2 * M)], fill=(255, 255, 255, 5), width=1)
    for y in range(0, H + 2 * M, step):
        d.line([(0, y), (W + 2 * M, y - 60)], fill=(255, 255, 255, 4), width=1)
    return im


_rng = np.random.default_rng(5)
DUST = [(float(_rng.uniform(0, 1)), float(_rng.uniform(0, 1)), float(_rng.uniform(0.5, 1.6)),
         float(_rng.uniform(0, 6.28)), float(_rng.uniform(2.0, 6.2))) for _ in range(38)]
SPARKS = [(float(_rng.uniform(0, 2 * math.pi)), float(_rng.uniform(0.45, 1.0)),
           float(_rng.uniform(180, 560)), int(_rng.choice([0, 0, 1])), float(_rng.uniform(0.45, 0.95)))
          for _ in range(46)]


# ---------------------------------------------------------------- frame
def render_frame(t, bg, els, wm_size=(1180, 300)):
    """Returns an RGB Image of the full 1920x1080 frame at time t."""
    cx0, cy0 = M, M                      # overscan offset
    FW, FH = W + 2 * M, H + 2 * M
    scene = bg.copy()
    d = ImageDraw.Draw(scene, "RGBA")
    CX = FW * (0.50 if VERT else 0.435)  # horizontal me mascot ke liye thoda left
    CY = FH * (0.335 if VERT else 0.520)

    em = int((FW if VERT else FH) * 0.175)
    cap_h = int(em * 0.72)
    p_glow = seg(t, 0.0, 0.75)
    imp = seg(t, 1.30, 1.32)
    imp_out = 1 - seg(t, 1.32, 2.05)

    # glow flare on the impact
    if 1.20 <= t and imp_out > 0.01:
        fr = int(u(300 + 760 * (1 - imp_out)))
        g = glow_sprite(360, 2.6)
        a = int(190 * imp_out ** 1.5)
        lay = Image.fromarray(g, "L").resize((fr, fr), Image.BILINEAR).point(lambda v, aa=a: int(v * aa / 255))
        gl = Image.new("RGBA", (fr, fr), GOLD + (0,))
        gl.putalpha(lay)
        scene.alpha_composite(gl, (int(CX - fr / 2), int(CY - fr * 0.44)))

    # dust motes
    for (fx, fy, sp, ph, sz) in DUST:
        yy = (fy * (H + 2 * M) - t * sp * u(26)) % (H + 2 * M)
        xx = fx * (W + 2 * M) + u(22) * math.sin(t * 0.7 + ph)
        a = int(70 * p_glow * (0.40 + 0.60 * math.sin(t * 1.1 + ph) ** 2))
        if a > 3:
            r = sz * K
            d.ellipse([xx - r, yy - r, xx + r, yy + r], fill=(255, 240, 200, a))

    # thin light line that draws itself before the letters land
    lp = seg(t, 0.12, 0.72)
    if lp > 0 and t < 1.6:
        lw = int(560 * ease_out(lp))
        a = int(200 * (1 - seg(t, 1.18, 1.55)))
        yline = CY + cap_h / 2 + u(40)
        bar_gradient(d, (CX - lw / 2 + cx0, yline + cy0, CX + lw / 2 + cx0, yline + u(5) + cy0),
                     GOLD + (a,), TEAL + (a,))

    # ---- wordmark: per-letter fly-in, tracking expand, two-tone
    L_IN, L_PER = 0.44, 0.070
    fA = font("disp", em)
    track = -6 + 26 * ease_out(seg(t, L_IN, 1.45))
    word_gap = 52 + track * 0.5
    letters = [fA._line_layer(ch) for ch in BRAND_A + BRAND_B]
    total = sum(l[3] for l in letters) + track * (len(letters) - 2) + word_gap
    fit_w = FW * (0.74 if VERT else 0.86)               # zoom/overscan ke liye margin chhoda rakho
    if total > fit_w:                                   # lamba naam (ya vertical canvas) ho to font chhota
        shrink = fit_w / total
        em = max(24, int(em * shrink))
        cap_h = int(em * 0.72)
        fA = font("disp", em)
        letters = [fA._line_layer(ch) for ch in BRAND_A + BRAND_B]
        track *= shrink
        word_gap *= shrink
        total = sum(l[3] for l in letters) + track * (len(letters) - 2) + word_gap
    nA = len(BRAND_A)
    pen = CX - total / 2
    ImageChops = __import__("PIL.ImageChops", fromlist=["ImageChops"])
    inkA = Image.new("L", (FW, FH), 0)
    inkB = Image.new("L", (FW, FH), 0)
    for i, ch in enumerate(BRAND_A + BRAND_B):
        m, ix, iy, adv = letters[i]
        tin = L_IN + i * L_PER
        p = seg(t, tin, tin + 0.40)
        e = back_out(p)
        a = clamp01(p * 1.25)
        if a > 0.012:
            sc = 1.32 - 0.32 * e
            w0, h0 = m.size
            ww, hh = max(1, int(w0 * sc)), max(1, int(h0 * sc))
            mm = m.resize((ww, hh), Image.LANCZOS) if (ww, hh) != (w0, h0) else m
            if a < 0.995:
                mm = mm.point(lambda v, aa=a: int(v * aa))
            cx_i = pen + ix * sc + w0 * sc / 2
            cy_i = CY + (1 - ease_out(p)) * u(92)
            (inkA if i < nA else inkB).paste(255, (int(cx_i - ww / 2), int(cy_i - hh / 2)), mm)
        pen += adv + (word_gap if i == nA - 1 else track)

    union = ImageChops.lighter(inkA, inkB)
    shadow = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    shadow.paste((4, 5, 9, 185), (int(u(6)), int(u(11))), union)
    scene.alpha_composite(shadow)
    band_h = int(em * 1.02)
    band_y = int(CY - band_h / 2)
    for alpha_layer, kind in ((inkA, "silver"), (inkB, "gold")):
        lay = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
        lay.paste(grad_image(kind, (FW, band_h)), (0, band_y))
        lay.putalpha(alpha_layer)
        scene.alpha_composite(lay)

    # shine sweep across the wordmark
    sp = seg(t, 3.30, 3.95)
    if 0 < sp < 1:
        band_cx = (CX - total / 2 - u(320)) + (total + u(640)) * sp
        band = Image.new("L", (FW, FH), 0)
        bd = ImageDraw.Draw(band)
        bw = int(u(130))
        bd.polygon([(band_cx - bw, 0), (band_cx, 0), (band_cx + bw * 2, FH), (band_cx + bw, FH)], fill=235)
        band = band.filter(ImageFilter.GaussianBlur(max(1, int(u(22)))))
        shine = Image.new("RGBA", (FW, FH), (255, 255, 252, 0))
        shine.paste((255, 255, 252, 255), (0, 0), ImageChops.multiply(band, union))
        scene.alpha_composite(shine)

    # underline bar grows from the centre, just under the caps
    bp = ease_out(seg(t, 1.50, 2.15))
    ybar = CY + cap_h / 2 + u(40)
    if bp > 0:
        lw = int(total * bp)
        bar_gradient(d, (CX - lw / 2 + cx0, ybar + cy0, CX + lw / 2 + cx0, ybar + u(9) + cy0),
                     GOLD + (int(240 * bp),), TEAL + (int(240 * bp),))
        gl = Image.new("L", (max(8, lw + int(u(60))), int(u(60))), 0)
        gd = ImageDraw.Draw(gl)
        gd.rounded_rectangle([int(u(30)), int(u(22)), int(u(30)) + lw, int(u(38))], radius=int(u(8)), fill=int(140 * bp))
        gl = gl.filter(ImageFilter.GaussianBlur(max(1, int(u(11)))))
        g = Image.new("RGBA", gl.size, GOLD + (0,))
        g.putalpha(gl)
        scene.alpha_composite(g, (int(CX - lw / 2 + cx0 - u(30)), int(ybar - u(22) + cy0)))

    # tagline (हिन्दी) + english kicker
    tp = ease_out(seg(t, 1.62, 2.35))
    if tp > 0.01:
        ft = font("bold", int(FH * 0.040) if not VERT else int(FW * 0.040))
        ft.text_centered(scene, CX + cx0, ybar + u(92) + (1 - tp) * u(26) + cy0, TAG_HI,
                         fill=(226, 228, 236, int(255 * tp)))
    kp = ease_out(seg(t, 1.95, 2.6))
    if kp > 0.01:
        fk = font("disp", int((FH if not VERT else FW) * 0.018))
        fk.text_centered(scene, CX + cx0, ybar + u(158) + (1 - kp) * u(18) + cy0, " ".join(list(KICKER)),
                         fill=(TEAL + (int(225 * kp),)))

    # ---- mascot: Sheru pop-up beside the lockup
    mp = seg(t, 2.30, 3.05)
    if mp > 0.01:
        st = dict(body_dy=0.0, body_dx=0.0, body_squash=(1.0, 1.0), head_rot=4 * math.sin(t * 2.2),
                  head_dy=5 * math.sin(t * 3.0), earL=13 * math.sin(t * 4.2), earR=13 * math.sin(t * 4.2 + .8),
                  tail=26 * math.sin(t * 11.0), blink=1.0 if (t % 3.1) < 0.12 else 0.0,
                  mouth_open=0.0, tongue=0.75, pawL=0, pawR=0, look=(0, 0), shake=(0, 0), _t=t)
        e = back_out(mp)
        st["body_dy"] = (1 - e) * 520
        st["body_squash"] = (1 + 0.10 * (1 - e), 1 - 0.12 * (1 - e))
        if 2.30 < t < 2.55:
            st["mouth_open"] = math.sin((t - 2.30) / 0.25 * math.pi)
        mscx = FW * (0.50 if VERT else 0.855)
        mscy = FH * (0.615 if VERT else 0.585)
        MA.draw_dog(scene, els, st, mscx, mscy + cy0, 1.95 * K, alpha=int(255 * clamp01(mp * 1.6)),
                    open_mouth=st["mouth_open"])

    # ---- subscribe pill
    spp = ease_out(seg(t, 4.05, 4.45))
    if spp > 0.01:
        pill_w, pill_h = int(u(300)), int(u(74))
        px, py = CX - pill_w / 2 + cx0, (H + 2 * M) * 0.815
        pulse = 1 + 0.05 * math.sin((t - 4.05) * 6.0) * (1 if t > 4.05 else 0)
        lay = Image.new("RGBA", (int(pill_w * 1.4), int(pill_h * 2.2)), (0, 0, 0, 0))
        ld = ImageDraw.Draw(lay)
        ld.rounded_rectangle([int(pill_w * 0.2), int(pill_h * 0.6), int(pill_w * 0.2 + pill_w * pulse),
                             int(pill_h * 0.6 + pill_h * pulse)], radius=int(pill_h * 0.5 * pulse),
                             fill=CORAL + (int(245 * spp),), outline=(255, 255, 255, int(90 * spp)), width=2)
        scene.alpha_composite(lay, (int(px - pill_w * 0.2), int(py - pill_h * 0.6)))
        fsub = font("disp", int(u(30)))
        fsub.text_centered(scene, px + pill_w / 2, py + pill_h / 2 + 2, "SUBSCRIBE",
                           fill=(255, 255, 255, int(255 * spp)))
        # bell
        bx, by = px + pill_w + int(u(44)), py + pill_h / 2
        ring = math.sin((t - 4.15) * 9.0) * (10 if 4.15 < t < 4.9 else 0)
        d2 = ImageDraw.Draw(scene, "RGBA")
        br = u(17)
        d2.pieslice([bx - br + ring * 0.2, by - u(20), bx + br + ring * 0.2, by + u(14)], 180, 360, fill=GOLD + (int(240 * spp),))
        d2.rectangle([bx - br + ring * 0.2, by - u(4), bx + br + ring * 0.2, by + u(10)], fill=GOLD + (int(240 * spp),))
        d2.ellipse([bx - u(5), by + u(8), bx + u(5), by + u(18)], fill=GOLD + (int(240 * spp),))

    # ---- sparks burst on impact
    if 1.30 <= t <= 1.30 + 1.1:
        pt = (t - 1.30)
        for (ang, spd, dist, col_i, life) in SPARKS:
            if pt > life:
                continue
            k = pt / life
            rr = dist * K * ease_out(k) * spd * 1.6
            x0 = CX + math.cos(ang) * rr * 1.25 + cx0
            y0 = CY + math.sin(ang) * rr * 0.8 + cy0
            a = int(255 * (1 - k) ** 1.6)
            col = (GOLD, LIGHT, TEAL)[col_i] + (a,)
            ln = u(26 + 46 * spd) * (1 - k) + u(6)
            wd = max(2, int(u(5 * (1 - k) + 1.6)))
            d.line([x0, y0, x0 - math.cos(ang) * ln, y0 - math.sin(ang) * ln * 0.85], fill=col, width=wd)

    # ---- fade in / out
    fade = min(seg(t, 0.0, 0.22), 1 - seg(t, DUR - 0.30, DUR - 0.02))
    if fade < 0.999:
        blk = Image.new("RGBA", scene.size, (0, 0, 0, int(255 * (1 - fade))))
        scene.alpha_composite(blk)

    # ---- impact zoom + shake (crop inside the overscan)
    zoom = 1.055 - 0.055 * ease_out(seg(t, 1.30, 1.72))
    zoom += 0.004 * seg(t, 3.0, DUR)                 # slow push-in
    sh = math.sin(2 * math.pi * 26 * t) * u(7) * (1 - seg(t, 1.30, 1.60)) * imp
    sh2 = math.cos(2 * math.pi * 21 * t) * u(6) * (1 - seg(t, 1.30, 1.60)) * imp
    vw, vh = (W + 2 * M) / zoom, (H + 2 * M) / zoom
    vx = (W + 2 * M - vw) / 2 + sh
    vy = (H + 2 * M - vh) / 2 + sh2
    frame = scene.crop((int(vx), int(vy), int(vx + vw), int(vy + vh))).resize((W, H), Image.LANCZOS).convert("RGB")

    # grain (subtle, animated) + final vignette
    rng = np.random.default_rng(int(t * FPS) + 3)
    g = rng.normal(128, 7, (H // 2, W // 2)).astype("uint8")
    gm = Image.fromarray(g, "L").resize((W, H), Image.BILINEAR)
    grain = Image.new("RGB", (W, H), (128, 128, 128))
    grain.paste(gm, (0, 0))
    frame = Image.blend(frame, grain.convert("RGB"), 0.035)
    return frame


# ---------------------------------------------------------------- audio
def read_wav_mono(path, sr_target=44100):
    with wave.open(path, "rb") as w:
        n, sr, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(1)
    if sr != sr_target:
        m = int(round(len(x) * sr_target / sr))
        x = np.interp(np.linspace(0, len(x) - 1, m), np.arange(len(x)), x).astype(np.float32)
    return x


def place(buf, x, at, sr, gain=1.0):
    i = int(at * sr)
    if i >= len(buf):
        return
    seg_len = min(len(x), len(buf) - i)
    g = np.linspace(0.02, 1, min(seg_len, int(0.008 * sr)))
    env = np.ones(seg_len, np.float32)
    env[:len(g)] = g
    buf[i:i + seg_len] += x[:seg_len] * env * gain


def build_audio(sr=44100, dur=DUR):
    n = int(dur * sr)
    t = np.arange(n) / sr
    out = np.zeros(n, np.float32)
    rng = np.random.default_rng(9)

    def win(a, b):
        i0, i1 = int(a * sr), min(n, int(b * sr))
        return i0, i1

    # 1) riser: rising sine + swept noise, 0.35 -> 1.30
    i0, i1 = win(0.35, 1.30)
    tt = (t[i0:i1] - 0.35) / 0.95
    tt = np.clip(tt, 0, None)
    f = 160 * (1 + 5.2 * tt ** 1.7)
    ris = np.sin(2 * np.pi * np.cumsum(f) / sr) * (0.16 + 0.5 * tt ** 2)
    nz = np.diff(rng.standard_normal(i1 - i0), prepend=0)
    nz = nz * np.linspace(0.1, 1.0, i1 - i0)
    out[i0:i1] += (ris * 0.5 + nz * 0.22).astype(np.float32)

    # 2) impact: sub boom + crack + body
    i0, i1 = win(1.30, 2.25)
    tt = t[i0:i1] - 1.30
    sub = np.sin(2 * np.pi * np.cumsum(78 * np.exp(-tt * 7) + 30) / sr) * np.exp(-tt * 3.1)
    crack = np.diff(rng.standard_normal(i1 - i0), prepend=0) * np.exp(-tt * 22)
    body = np.sin(2 * np.pi * 168 * tt) * np.exp(-tt * 9)
    out[i0:i1] += (sub * 0.62 + crack * 0.20 + body * 0.18).astype(np.float32)

    # 3) voice sting (AI voice) with a short slap-back reverb
    if os.path.exists(VOICE):
        v = read_wav_mono(VOICE, sr)
        v *= 0.94 / (float(np.abs(v).max()) + 1e-9)
        rms = math.sqrt(float((v ** 2).mean()))
        v *= 10 ** (-12.5 / 20) / (rms + 1e-9)
        place(out, v, 1.34, sr, 1.0)
        place(out, v, 1.34 + 0.185, sr, 0.22)
        place(out, v, 1.34 + 0.37, sr, 0.08)

    # 4) bell shimmer arpeggio (pentatonic), 1.35 -> 3.4
    step, f0 = 0.16, 880.0
    scale = [0, 2, 4, 7, 9, 12, 9, 7]
    for k in range(int(2.0 / step)):
        a = 1.35 + k * step
        if a > 3.4:
            break
        i0 = int(a * sr)
        L = int(0.42 * sr)
        if i0 + L > n:
            break
        fr = f0 * (2 ** (scale[k % len(scale)] / 12.0)) * (0.5 if k > 11 else 1.0)
        tt = np.arange(L) / sr
        tone = (np.sin(2 * np.pi * fr * tt) + 0.30 * np.sin(2 * np.pi * fr * 2.76 * tt) * np.exp(-tt * 16)
                + 0.12 * np.sin(2 * np.pi * fr * 5.1 * tt) * np.exp(-tt * 26))
        out[i0:i0 + L] += (tone * np.exp(-tt * 6.5) * 0.075 * (1 - k / 14.0)).astype(np.float32)

    # 5) whoosh for the mascot + cute "boing"
    i0, i1 = win(2.28, 2.62)
    tt = t[i0:i1] - 2.28
    e = np.clip(np.sin(np.pi * tt / 0.34), 0, None) ** 1.5
    out[i0:i1] += (np.diff(rng.standard_normal(i1 - i0), prepend=0) * 0.28 * e).astype(np.float32)
    i0 = int(2.34 * sr)
    L = int(0.22 * sr)
    tt = np.arange(L) / sr
    fb = 280 * np.exp(-tt * 2.2) + 520 * np.sin(2 * np.pi * 5.5 * tt) * 0.25
    out[i0:i0 + L] += (np.sin(2 * np.pi * np.cumsum(fb) / sr) * np.exp(-tt * 13) * 0.085).astype(np.float32)

    # 6) subscribe ticks + air pad under everything
    for at in (4.05, 4.45, 4.85):
        i0 = int(at * sr)
        L = int(0.09 * sr)
        if i0 + L > n:
            continue
        tt = np.arange(L) / sr
        out[i0:i0 + L] += (np.sin(2 * np.pi * 1250 * tt) * np.exp(-tt * 44) * 0.055).astype(np.float32)
    padf = 110 * (1 + 0.02 * np.sin(2 * np.pi * 0.3 * t))
    out += (np.sin(2 * np.pi * np.cumsum(padf) / sr) * 0.035 * np.clip(t / 0.6, 0, 1)).astype(np.float32)

    # 7) one-pole low-pass (warmth) + gentle saturation + fades
    a = math.exp(-2 * np.pi * 9000 / sr)
    y = np.zeros_like(out)
    prev = 0.0
    for i in range(n):
        prev += (1 - a) * (out[i] - prev)
        y[i] = prev
    y = np.nan_to_num(np.tanh(y * 1.35) * 0.86, nan=0.0, posinf=0.9, neginf=-0.9)
    fi, fo = int(0.10 * sr), int(0.30 * sr)
    y[:fi] *= np.linspace(0, 1, fi)
    y[-fo:] *= np.linspace(1, 0, fo)
    rms = math.sqrt(float((y ** 2).mean()))
    y *= 10 ** (-16.0 / 20) / (rms + 1e-9)
    y *= 0.95 / (float(np.abs(y).max()) + 1e-9)
    return y


def write_wav_stereo(path, x, sr=44100):
    d = int(0.009 * sr)
    side = np.concatenate([np.zeros(d, np.float32), x[:-d]])
    st = np.stack([x, side * 0.92 + x * 0.08], axis=1)
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- render / encode
def ffmpeg_bin():
    return MA.ffmpeg_bin()


def render(gif=False, tag=""):
    os.makedirs(OUT_DIR, exist_ok=True)
    vb, els = MA.load_svg(os.path.abspath(os.path.join(ANIM, "..", "cute_dog.svg")))
    bg = make_bg()
    n = int(DUR * FPS)
    audio = os.path.join(OUT_DIR, "intro_audio.wav")
    write_wav_stereo(audio, build_audio())
    mp4 = os.path.join(HERE, f"sochseth_intro{tag}.mp4")
    print(f"rendering {n} frames @ {FPS} fps ({W}x{H}) ...", flush=True)
    MA.encode((render_frame(i / FPS, bg, els) for i in range(n)), n, audio, mp4, W, H, fps=FPS, progress=True)
    print("done:", mp4, os.path.getsize(mp4) // 1024, "KB")
    # poster = last clean frame
    render_frame(DUR - 0.42, bg, els).save(os.path.join(OUT_DIR, "poster.png"))
    if gif:
        ff = ffmpeg_bin()
        subprocess.run([ff, "-y", "-i", mp4, "-vf", "fps=24,scale=560:-1:flags=lanczos,"
                        "split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
                        "-loglevel", "error", os.path.join(HERE, f"sochseth_intro{tag}_preview.gif")], check=False)
        print("done:", os.path.join(HERE, f"sochseth_intro{tag}_preview.gif"))
    return mp4


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", default="")
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--gif", action="store_true")
    ap.add_argument("--audio", action="store_true")
    ap.add_argument("--ratio", default="16x9", help="16x9 | 9x16 | 1x1 | 4x5")
    ap.add_argument("--scale", type=float, default=1.0, help="2 = 4K")
    ap.add_argument("--name", default="", help="optional: 'Soch,Seth' jaisa channel name")
    a = ap.parse_args()
    if a.name:
        parts = [p.strip() for p in a.name.split(",")]
        globals()["BRAND_A"], globals()["BRAND_B"] = (parts + [""])[:2]
    global W, H, M
    tag = "_%s%s" % (a.ratio, "k" if a.scale >= 2 else "")
    configure(a.ratio, a.scale)
    print("canvas:", f"{W}x{H}", "unit K=%.2f" % K, "VERT" if VERT else "")
    os.makedirs(OUT_DIR, exist_ok=True)
    if a.audio:
        write_wav_stereo(os.path.join(OUT_DIR, "intro_audio.wav"), build_audio())
        print("wrote out/intro_audio.wav")
        return
    vb, els = MA.load_svg(os.path.abspath(os.path.join(ANIM, "..", "cute_dog.svg")))
    bg = make_bg()
    if a.preview:
        for s in [v for v in a.preview.split(",") if v.strip()]:
            t = float(s)
            out = os.path.join(OUT_DIR, f"intro_{a.ratio}_{t:04.1f}.png")
            render_frame(t, bg, els).save(out)
            print("wrote", out)
        return
    if a.render:
        render(gif=a.gif, tag=tag)


if __name__ == "__main__":
    main()
