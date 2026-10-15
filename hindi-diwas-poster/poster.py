# -*- coding: utf-8 -*-
"""हिंदी दिवस पोस्टर — Hindi Diwas poster generator (vector SVG via HarfBuzz + fontTools)."""
import math, random
from textpath import text_svg, width, glyph_bbox

# ---------------- palette ----------------
SAFFRON      = "#FF9933"
DEEP_SAFFRON = "#E4660F"
MAROON       = "#93270B"
GREEN        = "#138808"
DEEP_GREEN   = "#0A5C2B"
NAVY         = "#123A63"
CHAKRA_BLUE  = "#0B3C7A"
INK          = "#40311F"
CREAM        = "#FFF8EC"
CREAM_2      = "#FBEBD3"

# ---------------- fonts ----------------
F_REG   = "fonts/Mukta-Regular.ttf"
F_MED   = "fonts/Mukta-Medium.ttf"
F_SEMI  = "fonts/Mukta-SemiBold.ttf"
F_BOLD  = "fonts/Mukta-Bold.ttf"
F_XBOLD = "fonts/Mukta-ExtraBold.ttf"
F_TITLE = "fonts/RozhaOne-Regular.ttf"
F_ROUND = "fonts/Baloo2-ExtraBold.ttf"
F_TIRO  = "fonts/TiroDevanagariHindi-Regular.ttf"

W, H = 2480, 3508          # A4 @ 300 dpi
CX = W / 2
s = []
add = s.append

# ================= helpers =================
def laid(text, font, size, y, fill, tracking=0.0, opacity=None, midline=False, **kw):
    """optically centre text on CX (ink box, not advance); y = baseline or visual centre"""
    x0, y0, x1, y1, _ = glyph_bbox(text, font, size)
    n = max(0, len(text) - 1)
    if midline:
        y = y - (y0 + y1) / 2
    x = CX - (x0 + x1) / 2 - tracking * n / 2
    return text_svg(text, font, size, x, y, fill=fill, anchor="start",
                    tracking=tracking, opacity=opacity, **kw)

def label_row(text, font, size, cx, y, fill, gap=90, rule=150, tracking=0, thick=4.5):
    """centred label with decorative dashes + diamonds on both sides"""
    w = width(text, font, size) + tracking * max(0, len(text) - 1)
    out = [text_svg(text, font, size, cx, y, fill=fill, anchor="middle", tracking=tracking)]
    for sign in (-1, 1):
        x1 = cx + sign * (w / 2 + gap)
        x2 = x1 + sign * rule
        out.append(f'<line x1="{x1:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y:.1f}" '
                   f'stroke="{fill}" stroke-width="{thick}" stroke-linecap="round" opacity="0.9"/>')
        dx = x2 + sign * 24
        out.append(f'<rect x="{dx-7:.1f}" y="{y-7:.1f}" width="14" height="14" fill="{fill}" '
                   f'transform="rotate(45 {dx:.1f} {y:.1f})"/>')
    return "".join(out)

def chakra(cx, cy, r, color=CHAKRA_BLUE, sw=None, spokes=24, hub=0.16, opacity=1.0):
    sw = sw or max(1.4, r * 0.045)
    out = [f'<g opacity="{opacity}">',
           f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" fill="none" stroke="{color}" stroke-width="{sw*2.0:.2f}"/>',
           f'<circle cx="{cx}" cy="{cy}" r="{r*0.9:.1f}" fill="none" stroke="{color}" stroke-width="{sw*0.7:.2f}"/>']
    for i in range(spokes):
        a = math.radians(i * 360.0 / spokes)
        out.append(f'<line x1="{cx + math.cos(a)*r*hub*2.4:.1f}" y1="{cy + math.sin(a)*r*hub*2.4:.1f}" '
                   f'x2="{cx + math.cos(a)*r*0.9:.1f}" y2="{cy + math.sin(a)*r*0.9:.1f}" '
                   f'stroke="{color}" stroke-width="{sw*0.6:.2f}"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*hub:.1f}" fill="{color}"/></g>')
    return "".join(out)

def sun_rays(cx, cy, r_in, r_out, n=48, color=SAFFRON, opacity=0.18, spread=0.5):
    out = [f'<g opacity="{opacity}">']
    for i in range(n):
        a = 2 * math.pi * i / n
        wd = (2 * math.pi / n) * spread
        pts = [f"{cx + math.cos(aa)*rr:.1f},{cy + math.sin(aa)*rr:.1f}"
               for rr, aa in ((r_in, a - wd), (r_out, a - wd * 0.3), (r_out, a + wd * 0.3), (r_in, a + wd))]
        out.append(f'<polygon points="{" ".join(pts)}" fill="{color}"/>')
    out.append("</g>")
    return "".join(out)

def mandala_ring(cx, cy, r, n, sz, color, opacity=0.55, shape_="dot"):
    out = [f'<g opacity="{opacity}" fill="{color}">']
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
        if shape_ == "dot":
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{sz:.1f}"/>')
        elif shape_ == "diamond":
            out.append(f'<rect x="{x-sz/2:.1f}" y="{y-sz/2:.1f}" width="{sz}" height="{sz}" '
                       f'transform="rotate(45 {x:.1f} {y:.1f})"/>')
        else:
            a2 = a + math.pi / 2
            dx, dy = math.cos(a) * sz, math.sin(a) * sz
            px, py = math.cos(a2) * sz * 0.5, math.sin(a2) * sz * 0.5
            out.append(f'<path d="M {x:.1f} {y:.1f} Q {x+px+dx*0.5:.1f} {y+py+dy*0.5:.1f} {x+dx:.1f} {y+dy:.1f} '
                       f'Q {x-px+dx*0.5:.1f} {y-py+dy*0.5:.1f} {x:.1f} {y:.1f} Z"/>')
    out.append("</g>")
    return "".join(out)

def corner_flourish(cx, cy, r, rot, color, opacity=0.45):
    out = [f'<g transform="translate({cx} {cy}) rotate({rot})" opacity="{opacity}">']
    for i, rr in enumerate((r, r * 0.76, r * 0.52)):
        out.append(f'<path d="M {rr} 0 A {rr} {rr} 0 0 1 0 {rr}" fill="none" stroke="{color}" '
                   f'stroke-width="{2.6 - i*0.5:.1f}" stroke-linecap="round"/>')
    for i in range(4):
        a = math.pi / 2 * (i / 3)
        out.append(f'<circle cx="{math.cos(a)*r*0.88:.1f}" cy="{math.sin(a)*r*0.88:.1f}" r="3.6" fill="{color}"/>')
    out.append("</g>")
    return "".join(out)

# ================= background =================
add(f'<rect width="{W}" height="{H}" fill="{CREAM}"/>')
add(f'''<defs>
  <radialGradient id="bg" cx="50%" cy="40%" r="76%">
    <stop offset="0%" stop-color="#FFFDF8"/>
    <stop offset="60%" stop-color="{CREAM}"/>
    <stop offset="100%" stop-color="{CREAM_2}"/>
  </radialGradient>
  <linearGradient id="goldline" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="{SAFFRON}" stop-opacity="0"/>
    <stop offset="20%" stop-color="{SAFFRON}"/>
    <stop offset="50%" stop-color="{DEEP_SAFFRON}"/>
    <stop offset="80%" stop-color="{GREEN}"/>
    <stop offset="100%" stop-color="{GREEN}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="saffgrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFB25E"/>
    <stop offset="42%" stop-color="{SAFFRON}"/>
    <stop offset="100%" stop-color="{DEEP_SAFFRON}"/>
  </linearGradient>
  <linearGradient id="greengrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2BA24A"/>
    <stop offset="55%" stop-color="{GREEN}"/>
    <stop offset="100%" stop-color="{DEEP_GREEN}"/>
  </linearGradient>
  <linearGradient id="bandgreen" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0F7A2E"/>
    <stop offset="100%" stop-color="#085222"/>
  </linearGradient>
</defs>''')
add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')

# soft mandala wash at the bottom
add(mandala_ring(CX, 3260, 1180, 72, 7, DEEP_SAFFRON, 0.07))
add(mandala_ring(CX, 3260, 1030, 48, 14, GREEN, 0.055, "petal"))
add(mandala_ring(CX, 300, 1120, 40, 8, DEEP_SAFFRON, 0.05))

# soft scatter of letters in the outer margins
random.seed(11)
grid = []
for r in range(9):
    for c in range(8):
        x = 120 + c * 336 + (r % 2) * 44
        if 560 < x < W - 560:      # keep the middle column clear
            continue
        grid.append(text_svg(random.choice("अआईईकगचजटडतदनपबमयरलवशसह"), F_REG, 76, x, 430 + r * 400,
                             fill=INK, opacity=0.035))
add("".join(grid))

# ================= frame =================
add(f'<rect x="86" y="150" width="{W-172}" height="3208" fill="none" stroke="{SAFFRON}" stroke-width="6" rx="6"/>')
add(f'<rect x="110" y="174" width="{W-220}" height="3160" fill="none" stroke="{GREEN}" stroke-width="2.5" rx="4" opacity="0.8"/>')
for (x, y, rot) in ((162, 226, 180), (W-162, 226, 270), (W-162, 3300, 0), (162, 3300, 90)):
    add(corner_flourish(x, y, 64, rot, DEEP_SAFFRON))

# ================= top / bottom tricolor bands =================
bh = 34
add(f'<rect x="0" y="0" width="{W}" height="{bh}" fill="{SAFFRON}"/>')
add(f'<rect x="0" y="{bh}" width="{W}" height="{bh}" fill="#FFFFFF"/>')
add(f'<rect x="0" y="{2*bh}" width="{W}" height="{bh}" fill="{GREEN}"/>')
add(f'<rect x="0" y="{3*bh}" width="{W}" height="7" fill="{NAVY}" opacity="0.85"/>')

# ================= kicker : 14 September =================
add(label_row("१४ सितंबर", F_BOLD, 76, CX, 350, DEEP_SAFFRON, gap=86, rule=140, tracking=6))
add(laid("H I N D I   D I W A S", F_MED, 40, 442, NAVY, opacity=0.7))

# ================= title : हिंदी दिवस =================
TY, TS = 812, 415
w1 = width("हिंदी", F_TITLE, TS)
w2 = width("दिवस", F_TITLE, TS)
a_x0 = glyph_bbox("हिंदी", F_TITLE, TS)[0]
b_x1 = glyph_bbox("दिवस", F_TITLE, TS)[2]
gap = 112
total = w1 + gap + w2
x1 = CX - (a_x0 + w1 + gap + b_x1) / 2
add(f'<g opacity="0.22">{text_svg("हिंदी", F_TITLE, TS, x1 + 9, TY + 13, fill="#E0C39B")}</g>')
add(f'<g opacity="0.22">{text_svg("दिवस", F_TITLE, TS, x1 + w1 + gap + 9, TY + 13, fill="#C3CCB1")}</g>')
add(text_svg("हिंदी", F_TITLE, TS, x1, TY, fill="url(#saffgrad)"))
add(text_svg("दिवस", F_TITLE, TS, x1 + w1 + gap, TY, fill="url(#greengrad)"))

_, tby0, _, tby1, _ = glyph_bbox("हिंदी", F_TITLE, TS)
uy = TY + tby1 + 46
add(f'<rect x="{x1}" y="{uy:.1f}" width="{total}" height="9" fill="url(#goldline)" rx="4"/>')
add(f'<rect x="{x1}" y="{uy+22:.1f}" width="{total}" height="3" fill="{NAVY}" opacity="0.3" rx="2"/>')
add(laid("हार्दिक शुभकामनाएँ", F_MED, 68, uy + 152, INK, tracking=12, opacity=0.92))

# ================= medallion : अ in tricolor rings =================
MCY, MR = 1560, 236
add(sun_rays(CX, MCY, MR + 44, MR + 250, 40, SAFFRON, 0.14, 0.42))
add(f'<circle cx="{CX}" cy="{MCY}" r="{MR+46}" fill="none" stroke="{SAFFRON}" stroke-width="3" '
    f'opacity="0.5" stroke-dasharray="2 16" stroke-linecap="round"/>')
add(f'<circle cx="{CX}" cy="{MCY}" r="{MR}" fill="#FFFDF6" stroke="{SAFFRON}" stroke-width="14"/>')
add(f'<circle cx="{CX}" cy="{MCY}" r="{MR-18}" fill="none" stroke="{GREEN}" stroke-width="6"/>')
add(f'<circle cx="{CX}" cy="{MCY}" r="{MR-35}" fill="none" stroke="{NAVY}" stroke-width="2.5" opacity="0.45"/>')
add(mandala_ring(CX, MCY, MR - 48, 44, 4.6, DEEP_SAFFRON, 0.5))
bx0, by0, bx1, by1, _ = glyph_bbox("अ", F_XBOLD, 296)
add(text_svg("अ", F_XBOLD, 296, CX - (bx0 + bx1) / 2, MCY - (by0 + by1) / 2 - 14, fill="url(#saffgrad)"))
add(laid("हिंदी", F_SEMI, 52, MCY + 128, DEEP_GREEN, tracking=10, midline=True))
add(f'<rect x="{CX-46}" y="{MCY+170}" width="92" height="4" rx="2" fill="{DEEP_SAFFRON}" opacity="0.75"/>')

# ================= headline =================
add(laid("हिंदी हमारी पहचान,", F_XBOLD, 120, 2092, MAROON, midline=True))
add(laid("हमारा स्वाभिमान।", F_XBOLD, 120, 2237, DEEP_GREEN, midline=True))

# chakra divider
add(chakra(CX, 2330, 38, CHAKRA_BLUE, opacity=0.9))
for sign in (-1, 1):
    add(f'<line x1="{CX + sign*86}" y1="2330" x2="{CX + sign*330}" y2="2330" stroke="{SAFFRON}" '
        f'stroke-width="3" stroke-linecap="round" opacity="0.85"/>')

# ================= body paragraph =================
body = [
    "हिंदी केवल भाषा नहीं, हमारी संस्कृति और अस्मिता की वाहक है।",
    "यह हमारे विचारों को अभिव्यक्ति देती है और पीढ़ियों को",
    "विरासत से जोड़ती है। आइए, इस हिंदी दिवस पर संकल्प लें —",
    "हिंदी का प्रयोग, सम्मान और प्रचार हर दिन करेंगे।",
]
by0 = 2452
for i, line in enumerate(body):
    add(laid(line, F_REG, 58, by0 + i * 84, INK, midline=True, opacity=0.95))

# ================= historic badge =================
add(chakra(CX, 2560, 520, CHAKRA_BLUE, opacity=0.055, sw=3.2))
BTY = 2836
btxt = "१४ सितंबर १९४९ — हिंदी को राजभाषा का दर्जा मिला"
bw = width(btxt, F_MED, 50) + 3 * (len(btxt) - 1) + 150
add(f'<rect x="{CX - bw/2:.1f}" y="{BTY-52:.1f}" width="{bw:.1f}" height="104" rx="52" '
    f'fill="#FFFDF6" stroke="{DEEP_SAFFRON}" stroke-width="3" opacity="0.98"/>')
add(f'<rect x="{CX - bw/2 + 8:.1f}" y="{BTY-44:.1f}" width="{bw-16:.1f}" height="88" rx="44" '
    f'fill="none" stroke="{GREEN}" stroke-width="1.6" opacity="0.7"/>')
add(laid(btxt, F_MED, 50, BTY, NAVY, tracking=3, midline=True))

# ================= slogan band =================
B0, B1 = 3092, 3302
add(f'<rect x="86" y="{B0}" width="{W-172}" height="{B1-B0}" fill="url(#bandgreen)" rx="12"/>')
add(f'<rect x="86" y="{B0}" width="{W-172}" height="8" fill="{SAFFRON}"/>')
add(f'<rect x="86" y="{B1-8}" width="{W-172}" height="8" fill="{SAFFRON}"/>')
add(mandala_ring(CX, (B0+B1)/2 + 6, 112, 30, 5, "#FFFFFF", 0.14, "diamond"))
add(laid("आओ हिंदी अपनाएँ, भारत को गौरव दिलाएँ!", F_XBOLD, 86, (B0+B1)/2, "#FFFFFF", midline=True))

# ================= footer =================
FY = 2985
add(chakra(CX - 118, FY - 20, 30, CHAKRA_BLUE, opacity=0.9))
add(text_svg("जय हिंद", F_XBOLD, 64, CX + 24, FY + 22, fill=DEEP_GREEN, tracking=10))
for sign in (-1, 1):
    add(f'<line x1="{CX + sign*300}" y1="{FY-20}" x2="{CX + sign*430}" y2="{FY-20}" stroke="{SAFFRON}" '
        f'stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>')

yb = H - 106
add(f'<rect x="0" y="{yb-8}" width="{W}" height="8" fill="{NAVY}" opacity="0.85"/>')
add(f'<rect x="0" y="{yb}" width="{W}" height="34" fill="{SAFFRON}"/>')
add(f'<rect x="0" y="{yb+34}" width="{W}" height="34" fill="#FFFFFF"/>')
add(f'<rect x="0" y="{yb+68}" width="{W}" height="38" fill="{GREEN}"/>')

body = "".join(s)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
       + body + "</svg>")
open("hindi_diwas_poster.svg", "w").write(svg)

# ---- social / status variant : 1080 x 1920, poster centred on a soft canvas ----
SW, SH = 1080, 1920
pw = 1030
sc = pw / W
ph = H * sc
ox, oy = (SW - pw) / 2, (SH - ph) / 2
story = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{SW}" height="{SH}" viewBox="0 0 {SW} {SH}">',
         f'<rect width="{SW}" height="{SH}" fill="{CREAM_2}"/>',
         f'<rect width="{SW}" height="{SH}" fill="url(#bg)"/>',
         f'<g opacity="0.06">' + mandala_ring(SW / 2, SH / 2, 880, 96, 5.5, DEEP_SAFFRON, 1.0) + "</g>",
         f'<rect x="{ox-10:.1f}" y="{oy-10:.1f}" width="{pw+20}" height="{ph+20:.1f}" rx="14" '
         f'fill="#000000" opacity="0.10"/>',
         f'<g transform="translate({ox:.2f} {oy:.2f}) scale({sc:.6f})">{body}</g>',
         "</svg>"]
open("hindi_diwas_story.svg", "w").write("".join(story))
print("svg written:", len(svg), "bytes; story written")
