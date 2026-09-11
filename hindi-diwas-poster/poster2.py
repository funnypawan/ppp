# -*- coding: utf-8 -*-
"""हिंदी दिवस — modern-minimal competition poster (A4/A3, vector SVG via HarfBuzz + fontTools)."""
import json, math
from textpath import text_svg, width, glyph_bbox

# ---------------- palette ----------------
INK        = "#14110F"
INK_SOFT   = "#514A43"
BG         = "#FBFAF7"
SAFFRON    = "#FF9933"
SAFFRON_D  = "#E4660F"
GREEN      = "#138808"
GREEN_D    = "#0A5C2B"
NAVY       = "#0A2A6B"
WHITE      = "#FFFFFF"

# ---------------- fonts ----------------
F_DISP  = "fonts/Khand-Bold.ttf"        # display
F_DISP2 = "fonts/Khand-SemiBold.ttf"
F_DISP3 = "fonts/Khand-Medium.ttf"
F_TXT   = "fonts/Hind-Regular.ttf"      # body
F_TXTS  = "fonts/Hind-SemiBold.ttf"
F_MUKTA = "fonts/Mukta-Regular.ttf"

W, H = 2480, 3508       # A4 @ 300 dpi (same ratio as A3)
CX = W / 2
M = 200                 # side margin
s = []
add = s.append

def laid(text, font, size, y, fill, tracking=0.0, opacity=None, midline=False, script="deva", **kw):
    """optically centred text on CX (ink box, not advance width)"""
    x0, y0, x1, y1, _ = glyph_bbox(text, font, size, script=script)
    n = max(0, len(text) - 1)
    if midline:
        y = y - (y0 + y1) / 2
    x = CX - (x0 + x1) / 2 - tracking * n / 2
    return text_svg(text, font, size, x, y, fill=fill, anchor="start",
                    tracking=tracking, opacity=opacity, script=script, **kw)

def row(left_txt, right_txt, font, size, y, color, tracking=0.0):
    """two ends of a baseline row"""
    out = []
    out.append(text_svg(left_txt, font, size, M, y, fill=color, tracking=tracking, script="latn"))
    wr = width(right_txt, font, size) + tracking * max(0, len(right_txt) - 1)
    out.append(text_svg(right_txt, font, size, W - M - wr, y, fill=color, tracking=tracking))
    return "".join(out)

def chakra(cx, cy, r, color, spokes=24, sw=None, opacity=1.0):
    sw = sw or r * 0.055
    out = [f'<g opacity="{opacity}" fill="none" stroke="{color}">',
           f'<circle cx="{cx}" cy="{cy}" r="{r:.1f}" stroke-width="{sw*1.7:.2f}"/>',
           f'<circle cx="{cx}" cy="{cy}" r="{r*0.88:.1f}" stroke-width="{sw*0.6:.2f}"/>']
    for i in range(spokes):
        a = math.radians(i * 360 / spokes)
        out.append(f'<line x1="{cx + math.cos(a)*r*0.12:.1f}" y1="{cy + math.sin(a)*r*0.12:.1f}" '
                   f'x2="{cx + math.cos(a)*r*0.88:.1f}" y2="{cy + math.sin(a)*r*0.88:.1f}" '
                   f'stroke-width="{sw*0.5:.2f}"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.09:.1f}" fill="{color}" stroke="none"/></g>')
    return "".join(out)

# ================= canvas =================
add(f'''<defs>
  <linearGradient id="tri" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="{SAFFRON}"/>
    <stop offset="100%" stop-color="{SAFFRON_D}"/>
  </linearGradient>
  <linearGradient id="triv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFA845"/>
    <stop offset="100%" stop-color="{SAFFRON_D}"/>
  </linearGradient>
  <linearGradient id="grnv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2AA24C"/>
    <stop offset="100%" stop-color="{GREEN_D}"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="{SAFFRON}" stop-opacity="0.16"/>
    <stop offset="70%" stop-color="{SAFFRON}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="{SAFFRON}" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-12%" y="-12%" width="124%" height="124%">
    <feGaussianBlur stdDeviation="11"/>
  </filter>
</defs>''')
add(f'<rect width="{W}" height="{H}" fill="{BG}"/>')

# ================= top / bottom tricolor micro-bars =================
for i, col in enumerate((SAFFRON, WHITE, GREEN)):
    add(f'<rect x="0" y="{i*12}" width="{W}" height="12" fill="{col}"/>')
    add(f'<rect x="0" y="{H-(3-i)*12}" width="{W}" height="12" fill="{col}"/>')
add(f'<rect x="0" y="36" width="{W}" height="1.5" fill="{INK}" opacity="0.35"/>')
add(f'<rect x="0" y="{H-38}" width="{W}" height="1.5" fill="{INK}" opacity="0.35"/>')

# ================= header =================
add(row("HINDI DIWAS", "१४ सितंबर", F_DISP2, 52, 336, INK_SOFT, tracking=12))
add(f'<rect x="{M}" y="386" width="{W-2*M}" height="2" fill="{INK}" opacity="0.14"/>')

# ================= title =================
TY1, TY2, TS = 920, 1360, 470
add(laid("हिंदी", F_DISP, TS, TY1, INK))
add(laid("दिवस", F_DISP, TS, TY2, "url(#triv)"))
add(f'<rect x="{CX-430}" y="1462" width="860" height="8" fill="url(#tri)" rx="4"/>')
add(f'<rect x="{CX-430}" y="1478" width="860" height="3" fill="{GREEN}" rx="1.5" opacity="0.85"/>')

# ================= headline =================
add(laid("हमारी भाषा, हमारी पहचान।", F_DISP2, 130, 1600, INK, midline=True))

# ================= hero : India in tricolour =================
MAP = json.load(open("india_map.json"))
paths = [l["path"] for l in MAP["locations"]]
MH = 1210.0
sc = MH / 696.0
MW = 612.0 * sc
mx, my = CX - MW / 2, 1722.0
cy_map = my + MW / 2  # glow centre uses width; fine for a soft radial

add(f'<circle cx="{CX}" cy="{my + MH/2:.1f}" r="880" fill="url(#glow)"/>')

# soft shadow
add(f'<g transform="translate({mx+12:.1f} {my+16:.1f}) scale({sc:.6f})" filter="url(#soft)" opacity="0.16">')
add("".join(f'<path d="{p}" fill="{INK}"/>' for p in paths))
add("</g>")

g = [f'<g transform="translate({mx:.1f} {my:.1f}) scale({sc:.6f})">']
# 1) union outline : thick ink strokes, covered by the fills drawn right after
g.append("".join(f'<path d="{p}" fill="none" stroke="{INK}" stroke-width="14" stroke-linejoin="round"/>' for p in paths))
# 2) tricolour bands + chakra, clipped to India
g.append('<clipPath id="india">' + "".join(f'<path d="{p}"/>' for p in paths) + '</clipPath>')
g.append('<g clip-path="url(#india)">')
g.append(f'<rect x="0" y="0" width="612" height="229" fill="{SAFFRON}"/>')
g.append(f'<rect x="0" y="229" width="612" height="210" fill="{WHITE}"/>')
g.append(f'<rect x="0" y="439" width="612" height="270" fill="{GREEN}"/>')
# state borders in the paper colour (under the chakra)
g.append("".join(f'<path d="{p}" fill="none" stroke="{BG}" stroke-width="1.6" stroke-linejoin="round" opacity="0.85"/>' for p in paths))
g.append(chakra(302, 334, 88, NAVY, sw=5.2))
g.append('</g>')   # close clip group
g.append('</g>')   # close map group
add("".join(g))

# ================= facts =================
FACT = "१४ सितंबर १९४९ — संविधान सभा ने हिंदी को संघ की राजभाषा के रूप में अपनाया।"
fw = width(FACT, F_TXT, 52)
CH_Y = 3052
add(f'<rect x="{CX-fw/2-58:.1f}" y="{CH_Y-64:.1f}" width="{fw+116:.1f}" height="128" rx="8" fill="{WHITE}" '
    f'stroke="{INK}" stroke-width="2.4" stroke-opacity="0.55"/>')
add(f'<rect x="{CX-fw/2-58:.1f}" y="{CH_Y-64:.1f}" width="9" height="128" rx="4" fill="{SAFFRON}"/>')
add(f'<rect x="{CX+fw/2+49:.1f}" y="{CH_Y-64:.1f}" width="9" height="128" rx="4" fill="{GREEN}"/>')
add(laid(FACT, F_TXT, 52, CH_Y, INK, midline=True))

add(laid("अनुच्छेद ३४३  •  २६ जनवरी १९५० से लागू", F_TXT, 46, 3180, INK_SOFT, midline=True))
add(laid("इसी दिन हिंदी के पक्षधर बेओहर राजेंद्र सिंहा का जन्मदिन भी मनाया जाता है।",
         F_TXT, 44, 3246, INK_SOFT, midline=True))

# ================= slogan band =================
B0, B1 = 3316, 3470
add(f'<rect x="0" y="{B0}" width="{W}" height="{B1-B0}" fill="{INK}"/>')
add(f'<rect x="0" y="{B0}" width="{W}" height="7" fill="{SAFFRON}"/>')
add(f'<rect x="0" y="{B1-7}" width="{W}" height="7" fill="{GREEN}"/>')
add(laid("आओ हिंदी अपनाएँ, भारत को गौरव दिलाएँ!", F_DISP, 92, (B0+B1)/2, WHITE, midline=True))

body = "".join(s)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
       + body + "</svg>")
open("hindi_diwas_modern.svg", "w").write(svg)
print("modern svg written:", len(svg), "bytes")


def social(cw, ch, out_svg, scale_to="fit"):
    """centre the poster on a matching canvas (story / instagram)"""
    if scale_to == "fit":
        sc = min((cw - 60) / W, (ch - 60) / H)
    elif scale_to == "height":
        sc = ch / H
    pw, ph = W * sc, H * sc
    ox, oy = (cw - pw) / 2, (ch - ph) / 2
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{cw}" height="{ch}" viewBox="0 0 {cw} {ch}">',
           f'<rect width="{cw}" height="{ch}" fill="{BG}"/>',
           f'<rect x="{ox-6:.1f}" y="{oy-6:.1f}" width="{pw+12:.1f}" height="{ph+12:.1f}" '
           f'fill="none" stroke="{INK}" stroke-opacity="0.12" stroke-width="2"/>',
           f'<g transform="translate({ox:.2f} {oy:.2f}) scale({sc:.6f})">{body}</g>',
           "</svg>"]
    open(out_svg, "w").write("".join(out))
    print("wrote", out_svg)


social(1080, 1920, "hindi_diwas_modern_story.svg", "fit")      # status / story
social(1080, 1350, "hindi_diwas_modern_ig.svg", "height")      # instagram 4:5
