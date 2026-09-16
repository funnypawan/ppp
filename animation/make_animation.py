#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_animation.py — cute_dog.svg se poori animated video (Hindi voiceover ke saath)

Pipeline (yehi "kaise bana" ka jawab hai):
    1. cute_dog.svg  ->  har shape ko Python me parse karo (circle/ellipse/rect/path)
    2. har frame par  har part ko transform do  (head bob, ear flop, tail wag, blink,
       mouth open, body squash)  ->  ye "rigging" kehlata hai
    3. caption/title text ko HarfBuzz se shape karo (deva_text.py) taaki हिन्दी टूटे नहीं
    4. voiceover (AI voice) + numpy se banaya hua music/SFX  ->  ek master audio
    5. frames ffmpeg ko pipe karo -> H.264 MP4 (vertical 9:16) ; phir blur-fill se 16:9

Chalane ke tarike
    python3 make_animation.py --preview 1.5,9,20,31,44      # kuch frames PNG me
    python3 make_animation.py --audio                       # sirf audio stems + mix
    python3 make_animation.py --render                      # frames -> MP4 (dheema)
    python3 make_animation.py --all                         # audio + video + 16:9
"""
from __future__ import annotations

import argparse
import math
import os
import re
import struct
import subprocess
import sys
import wave
from dataclasses import dataclass, field

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from deva_text import DevaFont  # noqa: E402

SVG_PATH = os.path.join(HERE, "..", "cute_dog.svg")
AUDIO_DIR = os.path.join(HERE, "audio")
OUT_DIR = os.path.join(HERE, "out")
FONTS = {
    "bold": os.path.join(HERE, "fonts", "Mukta_700Bold.ttf"),
    "med": os.path.join(HERE, "fonts", "Mukta_500Medium.ttf"),
    "extra": os.path.join(HERE, "fonts", "Mukta_800ExtraBold.ttf"),
    "latin": os.path.join(HERE, "fonts", "Poppins_700Bold.ttf"),
}

# palette = repo ke HTML guide se (top-100-self-improvement-books.html :root)
BG0 = (15, 17, 23)
BG1 = (26, 29, 41)
CARD = (26, 29, 41)
BORDER = (42, 45, 58)
GOLD = (255, 215, 0)
TEAL = (0, 212, 170)
CORAL = (255, 107, 107)
TEXT = (232, 232, 232)
MUTED = (156, 163, 175)

FPS = 30
VW, VH = 1080, 1920           # master canvas = vertical 9:16 (reels/shorts)
SS = 2                        # dog layer supersample (anti-aliasing)

# ---------------------------------------------------------------- scene script
SCENES = [
    dict(audio="s01.wav", title="शेरू की एनिमेशन डायरी",
         sub="एक SVG फाइल से बना कार्डून",
         cap="मिलिए शेरू से! एक छोटा सा कुत्ता, और इसी से बनेगी हमारी पहली एनिमेशन।",
         act="walkin", hl=None),
    dict(audio="s02.wav",
         cap="सिर हिलता है, कान फड़फड़ाते हैं, पूंछ मस्ती में झूमती है।",
         act="bounce", hl="Body"),
    dict(audio="s03.wav",
         cap="कान सुनते हैं दूर की आवाज़, आँखें झपकती रहती हैं।",
         act="look", hl="Left Eye"),
    dict(audio="s04.wav",
         cap="नाक सूंघती है सब कुछ, फिर खुश होकर — भौं भौं!",
         act="bark", hl="Nose"),
    dict(audio="s05.wav",
         cap="अच्छी आदतें भी शेरू जैसी: छोटी-छोटी, पर रोज़।",
         act="sit", hl=None),
    dict(audio="s06.wav", cap="दस पन्ने पढ़ो, दस मिनट चलो, फोन बंद करो।",
         act="checklist", hl=None,
         items=["10 पन्ने पढ़ो", "10 मिनट पैदल", "सोने से पहले फोन बंद"]),
    dict(audio="s07.wav", cap="छोटी आदतें, बड़ा असर। शुरूआत आज करो।",
         act="cheer", hl="Tail"),
    dict(audio="s08.wav", title="SVG + Python + ffmpeg",
         sub="अगली कड़ी में और दोस्त",
         cap="यह पूरी एनिमेशन सिर्फ एक SVG फाइल से बनी है।",
         act="outro", hl=None),
]
PAD = 0.45                     # हर clip ke baad ki khamoshi (saans lene ki jagah)


# ---------------------------------------------------------------- transforms
def T(tx, ty):
    return (1, 0, 0, 1, tx, ty)


def S(sx, sy=None):
    return (sx, 0, 0, sy if sy is not None else sx, 0, 0)


def R(deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return (c, s, -s, c, 0, 0)


def mul(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def apply(m, p):
    a, b, c, d, e, f = m
    x, y = p
    return (a * x + c * y + e, b * x + d * y + f)


def about(pivot, inner):
    return mul(mul(T(*pivot), inner), T(-pivot[0], -pivot[1]))


# ---------------------------------------------------------------- svg loader
@dataclass
class Elem:
    part: str
    kind: str                      # 'fill' | 'stroke'
    color: tuple
    pts: list = field(default_factory=list)
    width: float = 0.0


def _hex(c):
    c = (c or "#000").strip()
    if c == "none":
        return None
    if c.startswith("#"):
        c = c[1:]
        if len(c) == 3:
            c = "".join(ch * 2 for ch in c)
        return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
    m = re.match(r"rgba?\(([^)]+)\)", c)
    if m:
        v = [float(x) for x in m.group(1).split(",")]
        return tuple(int(x) for x in v[:3]) + ((int(v[3] * 255),) if len(v) > 3 else ())
    return (0, 0, 0)


def _ellipse_pts(cx, cy, rx, ry, n=44):
    return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n))
            for i in range(n)]


def _rrect_pts(x, y, w, h, r):
    r = max(0.0, min(r, w / 2, h / 2))
    pts = []
    corners = [(x + w - r, y + r, -90, 0), (x + w - r, y + h - r, 0, 90),
               (x + r, y + h - r, 90, 180), (x + r, y + r, 180, 270)]
    for cx, cy, a0, a1 in corners:
        for i in range(7):
            a = math.radians(a0 + (a1 - a0) * i / 6)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _path_pts(d):
    """Supports M/L/H/V/Q/C/Z (enough for cute_dog.svg). Flattens curves."""
    toks = re.findall(r"[MLHVQCZmlhvqc]|[+-]?\d*\.?\d+", d)
    pts, cur, cmd = [], (0.0, 0.0), None
    i = 0
    num = lambda: float(toks[i]) if i < len(toks) else 0.0
    while i < len(toks):
        t = toks[i]
        if not re.match(r"-?\d", t):
            cmd = t
            i += 1
            continue
        if cmd in ("M", "m"):
            x, y = float(toks[i]), float(toks[i + 1]); i += 2
            cur = (cur[0] + x, cur[1] + y) if cmd == "m" else (x, y)
            pts.append(cur)
        elif cmd in ("L", "l"):
            x, y = float(toks[i]), float(toks[i + 1]); i += 2
            cur = (cur[0] + x, cur[1] + y) if cmd == "l" else (x, y)
            pts.append(cur)
        elif cmd in ("H", "h"):
            x = float(toks[i]); i += 1
            cur = (cur[0] + x if cmd == "h" else x, cur[1]); pts.append(cur)
        elif cmd in ("V", "v"):
            y = float(toks[i]); i += 1
            cur = (cur[0], cur[1] + y if cmd == "v" else y); pts.append(cur)
        elif cmd in ("Q", "q"):
            cx, cy, x, y = [float(v) for v in toks[i:i + 4]]; i += 4
            if cmd == "q":
                cx += cur[0]; cy += cur[1]; x += cur[0]; y += cur[1]
            for k in range(1, 15):
                u = k / 14
                mt = 1 - u
                pts.append((mt * mt * cur[0] + 2 * mt * u * cx + u * u * x,
                            mt * mt * cur[1] + 2 * mt * u * cy + u * u * y))
            cur = (x, y)
        elif cmd in ("C", "c"):
            c1x, c1y, c2x, c2y, x, y = [float(v) for v in toks[i:i + 6]]; i += 6
            if cmd == "c":
                c1x += cur[0]; c1y += cur[1]; c2x += cur[0]; c2y += cur[1]; x += cur[0]; y += cur[1]
            for k in range(1, 17):
                u = k / 16
                mt = 1 - u
                pts.append((mt ** 3 * cur[0] + 3 * mt * mt * u * c1x + 3 * mt * u * u * c2x + u ** 3 * x,
                            mt ** 3 * cur[1] + 3 * mt * mt * u * c1y + 3 * mt * u * u * c2y + u ** 3 * y))
            cur = (x, y)
        elif cmd in ("Z", "z"):
            i += 1
        else:
            i += 1
    return pts


def load_svg(path):
    src = open(path, encoding="utf-8").read()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split()]
    part = "misc"
    els = []
    for raw in src.splitlines():
        line = raw.strip()
        cm = re.match(r"<!--\s*(.*?)\s*-->", line)
        if cm:
            part = cm.group(1)
            continue
        for mm in re.finditer(r"<(circle|ellipse|rect|path)\b([^>]*?)/?>", line):
            tag, a = mm.group(1), dict(re.findall(r'([\w:-]+)="([^"]*)"', mm.group(2)))
            fill = _hex(a.get("fill", "#000"))
            stroke = _hex(a.get("stroke"))
            sw = float(a.get("stroke-width", 0) or 0)
            if tag == "circle":
                pts = _ellipse_pts(float(a["cx"]), float(a["cy"]), float(a["r"]), float(a["r"]))
            elif tag == "ellipse":
                pts = _ellipse_pts(float(a["cx"]), float(a["cy"]), float(a["rx"]), float(a["ry"]))
            elif tag == "rect":
                pts = _rrect_pts(float(a["x"]), float(a["y"]), float(a["width"]), float(a["height"]),
                                float(a.get("rx", 0) or 0))
            else:
                pts = _path_pts(a.get("d", ""))
            if not pts:
                continue
            if stroke and sw and (fill is None or a.get("fill") == "none"):
                els.append(Elem(part, "stroke", stroke, pts, sw))
            else:
                els.append(Elem(part, "fill", fill or (0, 0, 0), pts, 0))
    return vb, els


HEAD_PARTS = {"Head", "Left Ear", "Right Ear", "Snout", "Nose", "Mouth",
              "Left Eye", "Right Eye", "Happy expression (tongue)"}


# ---------------------------------------------------------------- rig
def rig_state(t, tau, dur, act, seed=0):
    """Har frame ke liye rig parameters. t = global time, tau = scene ka local time."""
    breathe = 1.0 + 0.022 * math.sin(2 * math.pi * 0.85 * t)
    st = dict(
        body_dy=0.0, body_dx=0.0, zoom=1.0,
        body_squash=(1.0, breathe),
        head_rot=3.2 * math.sin(2 * math.pi * 0.55 * t + 0.6),
        head_dy=4.5 * math.sin(2 * math.pi * 0.85 * t + 1.2),
        earL=7 * math.sin(2 * math.pi * 0.85 * t + 2.1),
        earR=7 * math.sin(2 * math.pi * 0.85 * t + 2.6),
        tail=17 * math.sin(2 * math.pi * 1.9 * t),
        tail_speed=1.9,
        blink=0.0, mouth_open=0.0, tongue=0.0,
        pawL=0.0, pawR=0.0, look=(0.0, 0.0), shake=(0.0, 0.0),
    )
    # blink: 2-4 blinks per scene, har ek ~0.14 s
    n_b = max(2, int(dur / 2.6))
    for k in range(n_b):
        ph = (0.35 + 0.5 * ((seed * 7 + k * 37) % 100) / 100.0) * (dur / n_b) + k * (dur / n_b) * 0.42
        d = abs(tau - ph)
        if d < 0.11:
            st["blink"] = max(st["blink"], math.cos(d / 0.11 * math.pi / 2) ** 2)
    if act == "walkin":
        p = min(1.0, tau / 1.5)
        e = 1 - (1 - p) ** 3
        st["body_dx"] = -0.62 * VW * (1 - e)
        st["tail"] = 26 * math.sin(2 * math.pi * 3.4 * t)
        st["pawL"] = 26 * math.sin(2 * math.pi * 3.0 * t)
        st["pawR"] = -26 * math.sin(2 * math.pi * 3.0 * t)
        st["body_dy"] = -14 * abs(math.sin(2 * math.pi * 3.0 * t))
    elif act == "bounce":
        ph = (tau * 1.55) % 1.0
        st["body_dy"] = -70 * math.sin(math.pi * min(1.0, ph)) if ph < 0.55 else 0.0
        st["body_squash"] = (1.0 + 0.05 * math.sin(2 * math.pi * 1.55 * tau), 1.0 - 0.05 * math.sin(2 * math.pi * 1.55 * tau))
        st["tail"] = 24 * math.sin(2 * math.pi * 3.2 * t)
    elif act == "look":
        p = min(1.0, tau / 1.2)
        st["look"] = (9.0 * math.sin(2 * math.pi * 0.45 * tau) * p, 3.0 * math.cos(2 * math.pi * 0.6 * tau) * p)
        st["head_rot"] = 9 * math.sin(2 * math.pi * 0.45 * tau)
        st["earL"] = 13 * math.sin(2 * math.pi * 1.1 * tau)
        st["earR"] = 13 * math.sin(2 * math.pi * 1.1 * tau + 0.8)
        st["blink"] = max(st["blink"], 1.0 if 0.55 <= tau % 1.9 <= 0.72 else 0.0)
    elif act == "bark":
        st["mouth_open"] = max(0.0, math.sin(2 * math.pi * 1.1 * tau) ** 8)
        st["tongue"] = 0.4 + 0.6 * st["mouth_open"]
        st["head_dy"] += -16 * st["mouth_open"]
        st["body_dy"] = -26 * st["mouth_open"]
        st["shake"] = (5.0 * math.sin(2 * math.pi * 22 * tau) * st["mouth_open"],
                       5.0 * math.cos(2 * math.pi * 19 * tau) * st["mouth_open"])
        st["tail"] = 30 * math.sin(2 * math.pi * 4.2 * t)
        st["earL"] = 18 * math.sin(2 * math.pi * 2.2 * tau)
        st["earR"] = 18 * math.sin(2 * math.pi * 2.2 * tau + 0.7)
    elif act == "sit":
        st["body_squash"] = (1.04, 0.94)
        st["head_rot"] = 4 * math.sin(2 * math.pi * 0.4 * t)
        st["tail"] = 12 * math.sin(2 * math.pi * 1.3 * t)
    elif act == "checklist":
        st["head_rot"] = 6 * math.sin(2 * math.pi * 0.7 * tau)
        st["body_dy"] = -10 * abs(math.sin(2 * math.pi * 0.7 * tau))
        st["tongue"] = 0.55
        st["mouth_open"] = 0.18
    elif act == "cheer":
        p = min(1.0, tau / 0.6)
        st["body_dy"] = -95 * math.sin(math.pi * min(1.0, (tau % 1.25) / 1.25)) * p
        st["tail"] = 34 * math.sin(2 * math.pi * 5.0 * t)
        st["earL"] = 20 * math.sin(2 * math.pi * 2.6 * t)
        st["earR"] = 20 * math.sin(2 * math.pi * 2.6 * t + 0.9)
        st["mouth_open"] = 0.55
        st["tongue"] = 0.9
    elif act == "outro":
        st["body_dy"] = -18 * abs(math.sin(2 * math.pi * 0.9 * t))
        st["tail"] = 22 * math.sin(2 * math.pi * 2.6 * t)
        st["tongue"] = 0.6
        st["head_rot"] = 5 * math.sin(2 * math.pi * 0.5 * t)
    return st


def part_transform(name, st):
    mats = []
    if name in HEAD_PARTS:
        mats.append(T(0, st["head_dy"]))
        mats.append(about((100, 122), R(st["head_rot"])))
    if name == "Left Ear":
        mats.append(about((70, 18), R(st["earL"])))
    elif name == "Right Ear":
        mats.append(about((130, 18), R(st["earR"])))
    elif name == "Tail":
        mats.append(about((145, 132), R(st["tail"])))
    elif name == "Body":
        mats.append(about((100, 225), S(st["body_squash"][0], st["body_squash"][1])))
    elif name == "Belly spot":
        mats.append(about((100, 225), S(st["body_squash"][0], st["body_squash"][1])))
    elif name == "Left Front Paw":
        mats.append(about((82, 192), R(st["pawL"])))
    elif name == "Right Front Paw":
        mats.append(about((117, 192), R(st["pawR"])))
    elif name in ("Left Eye", "Right Eye"):
        cx = 85 if name.startswith("Left") else 115
        if st["blink"] > 0.02:
            mats.append(about((cx + st["look"][0] * 0.1, 70), S(1.0, max(0.06, 1 - st["blink"]))))
    elif name == "Mouth":
        mats.append(about((100, 92), S(1.0, 1.0 + 0.9 * st["mouth_open"])))
    elif name.startswith("Happy expression"):
        mats.append(about((100, 104), S(1.0 + 0.35 * st["tongue"], 1.0 + 1.9 * st["tongue"])))
        mats.append(T(0, 5.5 * st["tongue"]))
    elif name == "Nose":
        mats.append(about((100, 92), S(1.0 + 0.06 * math.sin(2 * math.pi * 1.6 * st.get("_t", 0)))))
    return mats


def dog_transforms(els, st, cx, cy, scale, canvas_wh, ss=SS):
    """Pre-compute every element's points in canvas*ss space. Returns ops + bbox."""
    G = mul(T(cx * ss + (st["body_dx"] + st["shake"][0]) * ss,
              cy * ss + (st["body_dy"] + st["shake"][1]) * ss),
             mul(S(scale * ss), T(-100, -120)))
    fills, strokes = [], []
    minx = miny = 1e9
    maxx = maxy = -1e9
    for e in els:
        M = G
        for m in part_transform(e.part, st):
            M = mul(M, m)
        pts = [apply(M, p) for p in e.pts]
        for p in pts:
            if p[0] < minx: minx = p[0]
            if p[0] > maxx: maxx = p[0]
            if p[1] < miny: miny = p[1]
            if p[1] > maxy: maxy = p[1]
        if e.kind == "stroke":
            strokes.append((pts, e.color, e.width * scale * ss))
        else:
            fills.append((pts, e.color))
    pad = 10
    box = (max(0, int(minx) - pad), max(0, int(miny) - pad),
           min(canvas_wh[0] * ss, int(maxx) + pad), min(canvas_wh[1] * ss, int(maxy) + pad))
    return fills, strokes, box


def draw_dog(img, els, st, cx, cy, scale, alpha=255, open_mouth=0.0, rig=False):
    """Render the rigged dog into a bbox-sized layer (fast) and paste it."""
    fills, strokes, box = dog_transforms(els, st, cx, cy, scale, img.size)
    x0, y0, x1, y1 = box
    if x1 - x0 < 4 or y1 - y0 < 4:
        return (x0 / SS, y0 / SS, x1 / SS, y1 / SS)
    lw, lh = x1 - x0, y1 - y0
    layer = Image.new("RGBA", (lw, lh), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    sh = -x0, -y0
    for pts, col, w in strokes:
        p = [(a + sh[0], b + sh[1]) for a, b in pts]
        d.line(p, fill=tuple(col[:3]) + (alpha,), width=max(1, int(round(w))), joint="curve")
        r = max(1, int(round(w / 2)))
        for q in (p[0], p[-1]):
            d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], fill=tuple(col[:3]) + (alpha,))
    if open_mouth > 0.18:
        mw = 15 * scale * SS * (0.7 + 0.5 * open_mouth)
        mh = 15 * scale * SS * (0.35 + 1.15 * open_mouth)
        mp = apply(mul(T(cx * SS + (st["body_dx"] + st["shake"][0]) * SS,
                         cy * SS + (st["body_dy"] + st["shake"][1]) * SS),
                       mul(S(scale * SS), T(-100, -120))), (100, 104 + 4 * open_mouth))
        mp = (mp[0] + sh[0], mp[1] + sh[1])
        d.ellipse([mp[0] - mw, mp[1] - mh, mp[0] + mw, mp[1] + mh], fill=(59, 30, 38, alpha))
    for pts, col in fills:
        d.polygon([(a + sh[0], b + sh[1]) for a, b in pts], fill=tuple(col[:3]) + (alpha,))
    if rig:
        G = mul(T(cx * SS + st["body_dx"] * SS, cy * SS + st["body_dy"] * SS), mul(S(scale * SS), T(-100, -120)))
        for pv in [(100, 122), (70, 18), (130, 18), (145, 132), (100, 225), (82, 192), (117, 192)]:
            q = apply(G, pv)
            q = (q[0] + sh[0], q[1] + sh[1])
            r = max(3, int(4.2 * scale * SS))
            d.ellipse([q[0] - r, q[1] - r, q[0] + r, q[1] + r], outline=(0, 212, 170, 220), width=3)
            d.line([(q[0] - r * 2.1, q[1]), (q[0] + r * 2.1, q[1])], fill=(0, 212, 170, 150), width=2)
            d.line([(q[0], q[1] - r * 2.1), (q[0], q[1] + r * 2.1)], fill=(0, 212, 170, 150), width=2)
    layer = layer.resize((max(1, int(round(lw / SS))), max(1, int(round(lh / SS)))), Image.LANCZOS)
    img.alpha_composite(layer, (int(round(x0 / SS)), int(round(y0 / SS))))
    return (x0 / SS, y0 / SS, x1 / SS, y1 / SS)


# ---------------------------------------------------------------- backgrounds
def make_bg(w, h):
    """Static background: dark gradient (repo HTML jaisa) + glow + vignette + grain."""
    v, u = np.mgrid[0:h, 0:w]
    u = u.astype(np.float32) / max(1, w - 1)
    v = v.astype(np.float32) / max(1, h - 1)
    arr = np.empty((3, h, w), np.float32)
    for i, (a, b) in enumerate(zip(BG0, BG1)):
        arr[i] = a + (b - a) * (0.35 * u + 0.65 * v)
    gold = np.array(GOLD, dtype=np.float32)[:, None, None]
    teal = np.array(TEAL, dtype=np.float32)[:, None, None]
    diag = (u + v) * 0.5
    arr += 0.045 * diag[None] * gold + 0.030 * (1 - diag)[None] * teal
    rr = (u - 0.5) ** 2 + ((v - 0.42) * (h / w)) ** 2
    arr += (0.30 * np.exp(-rr / 0.035))[None] * gold
    vg = 1 - 0.55 * np.clip(((u - 0.5) * 1.9) ** 2 + ((v - 0.5) * 1.55) ** 2, 0, 1) ** 1.6
    arr *= vg[None]
    rng = np.random.default_rng(7)
    arr += rng.normal(0, 3.2, arr.shape)
    im = Image.fromarray(np.clip(arr, 0, 255).astype("uint8").transpose(1, 2, 0), "RGB").convert("RGBA")
    d = ImageDraw.Draw(im, "RGBA")
    for gx in range(-h, w + h, 92):
        d.line([(gx, 0), (gx + int(h * 0.35), h)], fill=(255, 255, 255, 5), width=1)
    for gy in range(0, h, 92):
        d.line([(0, gy), (w, gy - int(w * 0.05))], fill=(255, 255, 255, 4), width=1)
    return im


def paw_print(d, cx, cy, s, col):
    d.ellipse([cx - s * 0.55, cy - s * 0.42, cx + s * 0.55, cy + s * 0.42], fill=col)
    for k, (ox, oy) in enumerate([(-0.62, -0.72), (-0.2, -0.95), (0.24, -0.95), (0.64, -0.7)]):
        r = s * 0.19
        d.ellipse([cx + ox * s - r, cy + oy * s - r, cx + ox * s + r, cy + oy * s + r], fill=col)


def bone(d, cx, cy, s, rot, col):
    d.ellipse([cx - s, cy - s * 0.32, cx + s, cy + s * 0.32], fill=col)
    for sx in (-1, 1):
        for sy in (-1, 1):
            r = s * 0.42
            d.ellipse([cx + sx * s * 0.86 - r, cy + sy * s * 0.40 - r, cx + sx * s * 0.86 + r, cy + sy * s * 0.40 + r], fill=col)


def heart(d, cx, cy, s, col):
    r = s * 0.52
    d.ellipse([cx - s * 0.86 - r * 0.55, cy - s * 0.55, cx - s * 0.30 + r * 0.55, cy + s * 0.10], fill=col)
    d.ellipse([cx + s * 0.30 - r * 0.55, cy - s * 0.55, cx + s * 0.86 + r * 0.55, cy + s * 0.10], fill=col)
    d.polygon([(cx - s * 0.80, cy - s * 0.02), (cx + s * 0.80, cy - s * 0.02), (cx, cy + s * 0.92)], fill=col)


# ---------------------------------------------------------------- UI helpers
def rounded_card(img, box, radius=26, fill=CARD, outline=BORDER, width=2, alpha=255):
    x0, y0, x1, y1 = [int(v) for v in box]
    m = radius + width + 2
    lay = Image.new("RGBA", (x1 - x0 + 2 * m, y1 - y0 + 2 * m), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([m, m, x1 - x0 + m, y1 - y0 + m], radius=radius,
                        fill=tuple(fill) + (alpha,), outline=tuple(outline) + (min(255, alpha),), width=width)
    img.alpha_composite(lay, (x0 - m, y0 - m))


def bar_gradient(d, box, c0, c1):
    x0, y0, x1, y1 = box
    n = max(1, int(x1 - x0))
    for i in range(n):
        p = i / n
        col = tuple(int(c0[k] + (c1[k] - c0[k]) * p) for k in range(3))
        d.line([x0 + i, y0, x0 + i, y1], fill=col)


# ---------------------------------------------------------------- fonts cache
_fcache = {}


def font(kind, size):
    key = (kind, int(size))
    if key not in _fcache:
        _fcache[key] = DevaFont(FONTS[kind], size, ss=3 if size > 40 else 4)
    return _fcache[key]


# ---------------------------------------------------------------- frame render
def render_frame(fi, t, timeline, els, bg, W, H, dog_scale_base):
    img = bg.copy()
    d = ImageDraw.Draw(img, "RGBA")
    sc_i, scene, t0, dur, tau = timeline.at(t)

    # --- parallax props
    for k in range(8):
        sp = 12 + 8 * (k % 3)
        yy = ((t * sp + k * 260) % (H + 300)) - 150
        side = 1 if k % 2 else -1
        xx = W / 2 + side * (W * 0.20 + ((k * 97) % int(W * 0.22)))
        a = 26 + 12 * math.sin(t * 0.9 + k)
        if k % 3 == 0:
            paw_print(d, xx, yy, 26 + 6 * (k % 4), (255, 215, 0, int(a)))
        elif k % 3 == 1:
            bone(d, xx, yy, 20 + 5 * (k % 3), 0, (0, 212, 170, int(a * 0.8)))
        else:
            heart(d, xx, yy, 16 + 4 * (k % 3), (255, 107, 107, int(a * 0.9)))

    # --- stage floor
    floor_y = int(H * 0.760)
    bar_gradient(d, (int(W * 0.06), floor_y, W - int(W * 0.06), floor_y + 4), GOLD, TEAL)
    d.line([(int(W * 0.06), floor_y + 4), (W - int(W * 0.06), floor_y + 4)], fill=(255, 255, 255, 40), width=1)

    st = rig_state(t, tau, dur, scene.get("act", ""), seed=sc_i + 1)
    st["_t"] = t

    # --- dog
    dog_h = H * 0.34 * dog_scale_base * (1.0 + (0.10 if scene.get("act") in ("bounce", "cheer") else 0.0))
    scale = dog_h / 240.0 * 1.0
    cx = W * 0.5
    cy = floor_y - dog_h * 0.5 + 6
    # ground shadow (small local layer, blurred)
    hop = -st["body_dy"]
    sh_w = dog_h * 0.62 * (1 - min(0.35, hop / 400))
    sh_a = int(130 * (1 - min(0.6, hop / 260)))
    sw_, sh_ = int(sh_w + 60), 96
    sh = Image.new("RGBA", (sw_, sh_), (0, 0, 0, 0))
    ds = ImageDraw.Draw(sh)
    ds.ellipse([30, 30, sw_ - 30, sh_ - 30], fill=(0, 0, 0, sh_a))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)), (int(cx - sh_w / 2 - 30), floor_y - 48))

    rig_on = scene.get("act") in ("walkin", "outro")
    bbox = draw_dog(img, els, st, cx, cy, scale, alpha=255,
                    open_mouth=st["mouth_open"], rig=rig_on)

    # --- highlight ring on the part being talked about
    hl = scene.get("hl")
    if hl:
        pts = []
        G = mul(T(cx + st["body_dx"] + st["shake"][0], cy + st["body_dy"] + st["shake"][1]),
                mul(S(scale), T(-100, -120)))
        for e in els:
            if e.part == hl or (hl in ("Left Eye", "Right Eye") and e.part in ("Left Eye", "Right Eye")):
                M = G
                for m in part_transform(e.part, st):
                    M = mul(M, m)
                pts += [apply(M, p) for p in e.pts]
        if pts:
            xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
            x0, y0, x1, y1 = min(xs) - 26, min(ys) - 26, max(xs) + 26, max(ys) + 26
            for i in range(0, 360, 12):
                ang = math.radians(i + (t * 120) % 12)
                ex = (x0 + x1) / 2 + (x1 - x0) / 2 * math.cos(ang) * 1.06
                ey = (y0 + y1) / 2 + (y1 - y0) / 2 * math.sin(ang) * 1.06
                a = int(150 + 100 * math.sin(t * 4 + i * 0.2))
                d.ellipse([ex - 5, ey - 5, ex + 5, ey + 5], fill=(0, 212, 170, max(30, a)))
            pulse = 0.5 + 0.5 * math.sin(t * 5)
            d.rounded_rectangle([x0, y0, x1, y1], radius=28, outline=(0, 212, 170, int(50 + 110 * pulse)), width=3)
            lab = font("bold", 30)
            nm = {"Body": "बॉडी", "Left Eye": "आँख", "Right Eye": "आँख", "Nose": "नाक", "Tail": "पूंछ",
                  "Left Ear": "कान", "Right Ear": "कान", "Head": "सिर"}.get(hl, hl)
            lw_, lh_ = lab.size_of(nm)
            ly = max(lh_, y0 - 30)
            rounded_card(img, (int((x0 + x1) / 2 - lw_ / 2 - 16), int(ly - lh_ / 2 - 12),
                               int((x0 + x1) / 2 + lw_ / 2 + 16), int(ly + lh_ / 2 + 12)),
                         radius=14, fill=(15, 17, 23), outline=(0, 212, 170), width=2, alpha=210)
            lab.text_centered(img, (x0 + x1) / 2, ly, nm, fill=(0, 212, 170, 255))

    # --- bark burst
    if scene.get("act") == "bark" and st["mouth_open"] > 0.25:
        f = font("extra", int(58 + 70 * st["mouth_open"]))
        a = int(255 * min(1.0, st["mouth_open"] * 2))
        bx = cx + (bbox[2] - bbox[0]) * 0.18
        by = bbox[1] + 30
        f.text_centered(img, bx, by - 120 * st["mouth_open"], "भौं!", fill=(255, 255, 255, a),
                        stroke=7, stroke_fill=(255, 107, 107, a))
        for i in range(3):
            rr = 40 + 130 * st["mouth_open"] + i * 34
            d.arc([bx - rr, by - rr * 0.7, bx + rr, by + rr * 0.7], start=-58, end=58, fill=(255, 215, 0, int(150 - i * 40)), width=4)

    # --- particles: hearts rise from the muzzle while barking / cheering
    if scene.get("act") in ("cheer", "bark", "bounce"):
        for k in range(5):
            ph = (t * 0.62 + k / 5.0) % 1.0
            x0 = bbox[2] - (bbox[2] - bbox[0]) * 0.10
            px = x0 + 26 * math.sin(k * 1.7 + ph * 5.0) + ph * 42
            py = bbox[1] + 96 - ph * 210
            heart(d, px, py, 15 - 4 * ph, (255, 107, 107, int(200 * (1 - ph) * min(1.0, ph * 6))))

    # --- progress bar
    p = t / timeline.total
    bar_gradient(d, (0, 0, W * p, 9), GOLD, TEAL)

    # --- scene chip
    chip = font("bold", 26)
    label = f"{sc_i + 1:02d} / {len(timeline.scenes):02d}"
    cw = chip.size_of(label)[0]
    rounded_card(img, (W - cw - 54, 26, W - 26, 76), radius=24, alpha=190)
    chip.text_centered(img, W - 26 - cw / 2 - 14, 51, label, fill=(156, 163, 175, 255))

    # --- title card / caption
    cap = scene.get("cap", "")
    reveal = min(1.0, max(0.0, (tau - 0.25) / max(0.6, dur * 0.5)))
    ease = 1 - (1 - reveal) ** 3
    pad_in = int(W * 0.055)
    box_w = W - 2 * pad_in
    if cap:
        csize = int(W * 0.052)
        cf = font("bold", csize)
        lines = cf.wrap(cap, box_w - 84)
        while len(lines) > 2 and csize > 30:            # 2 line se zyada nahi
            csize = int(csize * 0.93)
            cf = font("bold", csize)
            lines = cf.wrap(cap, box_w - 84)
        lh = (cf.ascent + cf.descent) * 1.42
        box_h = int(lh * len(lines) + 74)
        y0 = int(H * 0.845)
        y1 = y0 + box_h
        pop = 1 + 0.03 * (1 - ease)
        rounded_card(img, (pad_in, y0, pad_in + box_w, y1), radius=30, alpha=int(225 * ease))
        d.rectangle([pad_in, y0 + 18, pad_in + 9, y1 - 18], fill=GOLD + (int(255 * ease),))
        # karaoke sweep: muted text + gold text clipped to reveal width
        for li, ln in enumerate(lines):
            ly = y0 + 34 + li * lh
            lay, ix, iy, adv = cf.render(ln, (156, 163, 175, int(255 * ease)))
            img.alpha_composite(lay, (int(pad_in + 44 - ix), int(ly)))
            wln = lay.size[0]
            shown = int(wln * min(1.0, ease * len(lines) - li))
            if shown > 2:
                hl2, _, _, _ = cf.render(ln, (255, 255, 255, 255))
                crop = hl2.crop((0, 0, max(2, min(wln, shown)), hl2.size[1]))
                img.alpha_composite(crop, (int(pad_in + 44 - ix), int(ly)))
                d.rectangle([pad_in + 44 - ix, y1 - 26, pad_in + 44 - ix + shown, y1 - 22], fill=GOLD + (int(180 * ease),))
    if scene.get("title"):
        tsize = int(W * 0.105)
        tf = font("extra", tsize)
        while tf.size_of(scene["title"])[0] > W * 0.88 and tsize > 34:
            tsize = int(tsize * 0.92)
            tf = font("extra", tsize)
        sf = font("med", int(W * 0.040))
        intro = min(1.0, tau / 0.8)
        e2 = 1 - (1 - intro) ** 4
        ty = int(H * 0.115 - (1 - e2) * 60)
        tw, th = tf.size_of(scene["title"])
        img.alpha_composite(Image.new("RGBA", img.size, (0, 0, 0, 0)))
        tf.text_centered(img, W // 2, ty, scene["title"], fill=(255, 215, 0, int(255 * e2)),
                         stroke=int(6 * e2), stroke_fill=(15, 17, 23, int(220 * e2)))
        sf.text_centered(img, W // 2, ty + th * 1.15, scene.get("sub", ""), fill=(232, 232, 232, int(230 * e2)))
        d.line([(W * 0.5 - 120 * e2, ty + th * 0.72), (W * 0.5 + 120 * e2, ty + th * 0.72)], fill=TEAL + (int(220 * e2),), width=4)

    # --- checklist items
    if scene.get("items"):
        lf = font("bold", int(W * 0.048))
        n = len(scene["items"])
        for k, item in enumerate(scene["items"]):
            t_on = 0.35 + k * (dur * 0.62 / n)
            a = min(1.0, max(0.0, (tau - t_on) / 0.5))
            if a <= 0:
                continue
            yy = int(H * 0.30 + k * 118 - (1 - a) * 40)
            x0 = int(W * 0.10)
            w = int(W * 0.80)
            rounded_card(img, (x0, yy - 42, x0 + w, yy + 42), radius=22, fill=(34, 38, 55), alpha=int(215 * a))
            tick = a > 0.55
            r = 20
            cx2 = x0 + 44
            d.ellipse([cx2 - r, yy - r, cx2 + r, yy + r], outline=(0, 212, 170, int(255 * a)), width=4)
            if tick:
                d.line([(cx2 - 10, yy), (cx2 - 2, yy + 9), (cx2 + 12, yy - 10)], fill=(0, 212, 170, 255), width=6, joint="curve")
            lay, ix, iy, adv = lf.render(item, (232, 232, 232, int(255 * a)))
            img.alpha_composite(lay, (cx2 + r + 26 - ix, yy - lay.size[1] // 2))

    # --- outro watermark
    if scene.get("act") == "outro":
        wm = font("med", int(W * 0.030))
        wm.text_centered(img, W // 2, int(H * 0.955), "ppp · cute_dog.svg · make_animation.py",
                         fill=(156, 163, 175, 200))
    return img.convert("RGB")


# ---------------------------------------------------------------- timeline
class Timeline:
    def __init__(self, scenes, clips, pad=PAD):
        self.scenes, self.clips, self.pad = scenes, clips, pad
        self.marks = []
        t = 0.0
        for c in clips:
            self.marks.append(t)
            t += c["dur"] + pad
        self.total = t
        self.ends = [m + c["dur"] + pad for m, c in zip(self.marks, clips)]

    def at(self, t):
        t = max(0.0, min(self.total - 1e-4, t))
        i = 0
        for k, m in enumerate(self.marks):
            if t >= m:
                i = k
        sc = self.scenes[i]
        tau = t - self.marks[i]
        dur = self.clips[i]["dur"] + self.pad
        return i, sc, self.marks[i], dur, tau


# ---------------------------------------------------------------- audio
def read_wav_mono(path):
    with wave.open(path, "rb") as w:
        n, sr, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if sw == 2:
        x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    elif sw == 4:
        x = np.frombuffer(raw, dtype="<i4").astype(np.float32) / 2147483648.0
    else:
        raise SystemExit("unsupported bit depth %d" % (sw * 8))
    if ch > 1:
        x = x.reshape(-1, ch).mean(1)
    return x, sr


def resample(x, sr0, sr1):
    if sr0 == sr1:
        return x
    n = int(round(len(x) * sr1 / sr0))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def highpass(x, sr, hz=80.0):
    # one-pole highpass (DC rumble / handling noise)
    a = math.exp(-2 * math.pi * hz / sr)
    y = np.empty_like(x)
    prev_in = prev_out = 0.0
    for i, v in enumerate(x):
        prev_out = a * (prev_out + v - prev_in)
        prev_in = v
        y[i] = prev_out
    return y


def normalize_rms(x, dbfs=-19.5, peak=0.95):
    rms = math.sqrt(float((x ** 2).mean()) + 1e-12)
    if rms < 1e-6:
        return x
    g = 10 ** (dbfs / 20.0) / rms
    x = x * g
    pk = float(np.abs(x).max()) + 1e-9
    if pk > peak:
        x *= peak / pk
    return x.astype(np.float32)


def synth_music(n, sr, bpm=96.0, seed=3):
    """Halka lo-fi/ukulele-jaisa bed: chord pad + marimba arpeggio + shaker + soft kick."""
    rng = np.random.default_rng(seed)
    t = np.arange(n) / sr
    out = np.zeros(n, np.float32)
    beat = 60.0 / bpm
    # A minor pentatonic-ish progression: Am - F - C - G
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 261.63, 329.63], [196.0, 246.94, 293.66]]
    bar = beat * 4
    # pad
    for k in range(int(math.ceil(n / sr / bar)) + 1):
        f = chords[k % 4]
        s0, s1 = int(k * bar * sr), int(min(n, (k + 1) * bar * sr))
        if s1 - s0 < 16:
            break
        seg_t = t[s0:s1] - k * bar
        env = np.clip(np.minimum(seg_t / 0.35, (bar - seg_t) / 0.5), 0, 1)
        p = np.zeros(s1 - s0, np.float32)
        for j, fq in enumerate(f):
            det = 1.0 + 0.0018 * (j - 1)
            w = 2 * np.pi * fq * det * (1 + 0.0012 * np.sin(2 * np.pi * 0.25 * seg_t))
            p += 0.5 * np.sin(w) + 0.18 * np.sin(2 * w) + 0.07 * np.sin(3 * w)
        out[s0:s1] += 0.030 * env * p
    # marimba arpeggio (8th notes)
    step = beat / 2
    notes = [chords[(i // 2) % len(chords)][i % 3] * (2 if i % 7 == 6 else 1) for i in range(int(math.ceil(n / sr / step)))]
    for i, fq in enumerate(notes):
        s0 = int(i * step * sr)
        L = int(0.34 * sr)
        if s0 + L > n or rng.random() < 0.18:
            continue
        tt = np.arange(L) / sr
        env = np.exp(-tt * 9.0) * np.clip(tt / 0.004, 0, 1)
        seg = (np.sin(2 * np.pi * fq * tt) + 0.35 * np.sin(2 * np.pi * fq * 3 * tt) * np.exp(-tt * 20)
               + 0.12 * np.sin(2 * np.pi * fq * 5.4 * tt) * np.exp(-tt * 34))
        out[s0:s0 + L] += 0.055 * env * seg
    # shaker
    for i in range(int(math.ceil(n / sr / step))):
        s0 = int(i * step * sr)
        L = int(0.09 * sr)
        if s0 + L > n:
            continue
        nz = rng.standard_normal(L) * np.linspace(1, 0, L) ** 2.2
        nz = np.diff(nz, prepend=0)                      # crude high-pass
        out[s0:s0 + L] += (0.010 if i % 2 else 0.006) * nz.astype(np.float32)
    # soft kick on the beat
    for i in range(int(math.ceil(n / sr / beat))):
        s0 = int(i * beat * sr)
        L = int(0.16 * sr)
        if s0 + L > n:
            continue
        tt = np.arange(L) / sr
        fq = 95 * np.exp(-tt * 22) + 44
        seg = np.sin(2 * np.pi * np.cumsum(fq) / sr) * np.exp(-tt * 16)
        out[s0:s0 + L] += 0.075 * seg.astype(np.float32)
    # warmth: one-pole low-pass
    a = math.exp(-2 * np.pi * 5200 / sr)
    y = np.zeros_like(out)
    prev = 0.0
    for i in range(len(out)):
        prev = prev + (1 - a) * (out[i] - prev)
        y[i] = prev
    # duck while speaking is done by caller; here just normalise
    y *= 0.9 / (float(np.abs(y).max()) + 1e-9)
    return y.astype(np.float32)


def build_mix(timeline, sr=44100, music_level=0.20):
    n = int(math.ceil(timeline.total * sr)) + sr // 2
    mix = np.zeros(n, np.float32)
    stems = []
    for i, clip in enumerate(timeline.clips):
        x, s0 = read_wav_mono(clip["path"])
        x = resample(x, s0, sr)
        x = highpass(x, sr)
        x = normalize_rms(x)
        a = int(timeline.marks[i] * sr)
        seg = np.zeros(n, np.float32)
        seg[a:a + len(x)] = x[: max(0, n - a)]
        mix += seg
        stems.append((i, x, sr))
    # music bed with side-chain duck following the VO envelope
    mus = synth_music(n, sr) * music_level
    vo_abs = np.abs(mix)
    win = int(0.05 * sr)
    env = np.convolve(vo_abs, np.ones(win) / win, mode="same")
    thr = float(np.percentile(env[env > 0], 60)) + 1e-6
    duck = np.clip(1.0 - 0.72 * (env / thr), 0.30, 1.0)
    duck = np.convolve(duck, np.ones(int(0.08 * sr)) / int(0.08 * sr), mode="same")
    mix += mus[:n] * duck.astype(np.float32)
    # whoosh at each scene change + a pop at caption reveal
    rng = np.random.default_rng(5)
    for k in range(1, len(timeline.marks)):
        w = int(timeline.marks[k] * sr - 0.20 * sr)
        L = int(0.30 * sr)
        if 0 < w < n - L:
            tt = np.arange(L) / sr
            e = np.sin(np.pi * tt / (L / sr)) ** 2
            nz = np.diff(rng.standard_normal(L), prepend=0) * 0.4 + rng.standard_normal(L) * 0.6
            mix[w:w + L] += (0.05 * e * nz).astype(np.float32)
    for i, clip in enumerate(timeline.clips):
        p = int((timeline.marks[i] + 0.25) * sr)
        L = int(0.14 * sr)
        if 0 < p < n - L:
            tt = np.arange(L) / sr
            f = 520 * np.exp(-tt * 9) + 120
            blip = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-tt * 26)
            mix[p:p + L] += (0.05 * blip).astype(np.float32)
    # fades
    fi = int(0.6 * sr)
    mix[:fi] *= np.linspace(0, 1, fi)
    fo = int(1.4 * sr)
    tail = min(fo, n - int(timeline.total * sr))
    if tail > 10:
        s = n - tail
        mix[s:] *= np.linspace(1, 0, tail)
    mix = normalize_rms(mix, dbfs=-14.0, peak=0.97)
    return mix, stems


def write_wav(path, x, sr=44100, mono=False):
    x = np.clip(x, -1, 1)
    if not mono:
        # gentle Haas width for the master only (stems stay mono, like 5.wav..13.wav)
        d = int(0.011 * sr)
        L = np.concatenate([np.zeros(d, np.float32), x[:-d]]) if len(x) > d else x
        st = np.stack([x, L], axis=1)
    else:
        st = x[:, None]
    pcm = (st * 32767.0).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(st.shape[1]); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- encode
def ffmpeg_bin():
    env = os.environ.get("FFMPEG")
    if env and os.path.exists(env):
        return env
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def encode(frames_iter, n_total, audio_path, out_path, W, H, fps=FPS, progress=True):
    ff = ffmpeg_bin()
    cmd = [ff, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps),
           "-i", "-", "-i", audio_path,
           "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-c:a", "aac", "-b:a", "192k",
           "-movflags", "+faststart", "-shortest", out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    assert proc.stdin
    for i, fr in enumerate(frames_iter):
        proc.stdin.write(fr.tobytes())
        if progress and i % 60 == 0:
            print(f"  frame {i + 1}/{n_total}", flush=True)
    try:
        proc.stdin.close()
    except BrokenPipeError:
        pass
    err = proc.stderr.read().decode(errors="replace")
    rc = proc.wait()
    if rc != 0:
        print(err[-3000:])
        raise SystemExit("ffmpeg failed")
    return out_path


def make_horizontal(vert_path, horiz_path, W=1920, H=1080):
    """Vertical master -> 16:9 with blurred fill (CapCut/reflow jaisa look)."""
    ff = ffmpeg_bin()
    cmd = [ff, "-y", "-i", vert_path, "-filter_complex",
           f"[0:v]split=2[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
           f"boxblur=28:3,eq=brightness=-0.12:saturation=0.7[bg];"
           f"[b]scale=-2:{H}[fg];[bg][fg]overlay=(W-w)/2:0:format=auto,format=yuv420p[v]",
           "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
           "-c:a", "copy", "-movflags", "+faststart", horiz_path]
    r = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if r.returncode != 0:
        print(r.stderr.decode()[-2000:])
        return None
    return horiz_path


# ---------------------------------------------------------------- main
def load_clips():
    clips = []
    for sc in SCENES:
        p = os.path.join(AUDIO_DIR, sc["audio"])
        if not os.path.exists(p):
            raise SystemExit(f"missing narration clip: {p}\n pehle: python3 make_animation.py --audio-check")
        x, sr = read_wav_mono(p)
        clips.append(dict(path=p, dur=len(x) / sr))
    return clips


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", default="", help="comma separated times in seconds")
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--audio", action="store_true", help="stems (44.1k mono) + master mix banao")
    ap.add_argument("--horizontal", action="store_true")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--from-sec", type=float, default=0.0)
    ap.add_argument("--to-sec", type=float, default=-1.0)
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)

    vb, els = load_svg(os.path.abspath(SVG_PATH))
    print(f"SVG parsed: {len(els)} shapes, parts = {sorted(set(e.part for e in els))}")
    clips = load_clips()
    tl = Timeline(SCENES, clips)
    print(f"timeline: {len(clips)} scenes, total {tl.total:.1f}s")
    bg = make_bg(VW, VH)

    if args.preview:
        for s in [v for v in args.preview.split(",") if v.strip()]:
            t = float(s)
            i, sc, t0, dur, tau = tl.at(t)
            fr = render_frame(0, t, tl, els, bg, VW, VH, 1.0)
            outp = os.path.join(OUT_DIR, f"preview_{t:05.1f}.png")
            fr.save(outp)
            print("wrote", outp, f"(scene {i + 1}: {sc.get('act')})")
        return

    if args.audio or args.all:
        mix, stems = build_mix(tl)
        write_wav(os.path.join(AUDIO_DIR, "master_mix.wav"), mix)
        print("wrote audio/master_mix.wav", round(len(mix) / 44100, 2), "s")
        # narration stems in the repo's own format (mono 44.1 kHz), numbered like 5.wav..13.wav
        repo_root = os.path.abspath(os.path.join(HERE, ".."))
        for k, (i, x, sr) in enumerate(stems):
            write_wav(os.path.join(repo_root, f"{14 + i}.wav"), x, sr, mono=True)
        print("wrote narration stems 14.wav..%d.wav (mono 44.1k, jaise aapke 5-13.wav hain)" % (13 + len(stems)))
        if not (args.render or args.all):
            return

    mix_path = os.path.join(AUDIO_DIR, "master_mix.wav")
    if not os.path.exists(mix_path):
        mix, _ = build_mix(tl)
        write_wav(mix_path, mix)

    n_total = int(round(tl.total * FPS))
    a = int(args.from_sec * FPS)
    b = n_total if args.to_sec < 0 else min(n_total, int(args.to_sec * FPS))

    def frames():
        for fi in range(a, b):
            t = fi / FPS
            yield render_frame(fi, t, tl, els, bg, VW, VH, 1.0)

    outv = os.path.join(HERE, "cute_dog_animation_9x16.mp4")
    print(f"rendering frames {a}..{b} -> {outv}")
    encode(frames(), b - a, mix_path, outv if a == 0 else os.path.join(OUT_DIR, f"part_{a}_{b}.mp4"), VW, VH)
    print("done:", outv)
    if args.horizontal or args.all:
        h = make_horizontal(outv, os.path.join(HERE, "cute_dog_animation_16x9.mp4"))
        if h:
            print("done:", h)


if __name__ == "__main__":
    main()
