#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Proper Hindi (Devanagari) text renderer -> transparent PNG.
Uses HarfBuzz (uharfbuzz) for complex-script shaping + FreeType for rasterizing.
Handles font fallback: Devanagari font for Hindi, Latin font for English/digits.
"""
import os
import freetype
import uharfbuzz as hb
from PIL import Image, ImageDraw, ImageFilter

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
DEVA_BLACK = os.path.join(FONT_DIR, "NotoSansDevanagari-Black.ttf")
DEVA_BOLD = os.path.join(FONT_DIR, "NotoSansDevanagari-Bold.ttf")
LAT_BLACK = os.path.join(FONT_DIR, "NotoSans-Black.ttf")
LAT_BOLD = os.path.join(FONT_DIR, "NotoSans-Bold.ttf")


class ShapedFont:
    """A font made of a primary (Devanagari) + fallback (Latin) file."""

    def __init__(self, deva_path=DEVA_BLACK, lat_path=LAT_BLACK):
        self.fonts = []
        for p in (deva_path, lat_path):
            blob = hb.Blob.from_file_path(p)
            face = hb.Face(blob)
            hbfont = hb.Font(face)
            ftface = freetype.Face(p)
            self.fonts.append({"path": p, "hb": hbfont, "ft": ftface, "upem": face.upem,
                               "_blob": blob, "_face": face})

    def _covered(self, fi, cp):
        try:
            return self.fonts[fi]["hb"].get_nominal_glyph(cp) is not None
        except Exception:
            return False

    def _pick(self, ch):
        cp = ord(ch)
        if ch.isspace():
            return 0
        for i in range(len(self.fonts)):
            if self._covered(i, cp):
                return i
        return 0

    def layout(self, text, size_px):
        """Return list of (x, y, w, h, bitmap_bytes, left, top) in pixel space (baseline at y=0)."""
        out = []
        # split into runs that share the same font file
        runs = []
        cur = None
        for ch in text:
            fi = self._pick(ch)
            if cur and cur[0] == fi:
                cur[1] += ch
            else:
                cur = [fi, ch]
                runs.append(cur)
        pen_x = 0.0
        upem_scale = {}
        for fi, rtext in runs:
            F = self.fonts[fi]
            hbfont = F["hb"]
            hbfont.scale = (int(size_px * 64), int(size_px * 64))
            ftface = F["ft"]
            ftface.set_char_size(int(size_px * 64))
            buf = hb.Buffer()
            buf.add_str(rtext)
            buf.direction = "ltr"
            buf.script = "Deva" if fi == 0 else "Latn"
            buf.language = "hi"
            hb.shape(hbfont, buf, features={"kern": True, "liga": True})
            for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
                gid = info.codepoint
                x_adv = pos.x_advance / 64.0
                x_off = pos.x_offset / 64.0
                y_off = pos.y_offset / 64.0
                gx = pen_x + x_off
                try:
                    ftface.load_glyph(gid, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_TARGET_NORMAL)
                    g = ftface.glyph
                    bm = g.bitmap
                    w, rows, pitch = bm.width, bm.rows, bm.pitch
                    if w and rows:
                        buf_bytes = bytes(bm.buffer)
                        # freetype bitmap rows are top-down starting at bitmap_top above baseline
                        out.append({"x": gx, "y": -y_off, "w": w, "h": rows,
                                    "left": g.bitmap_left, "top": g.bitmap_top,
                                    "data": buf_bytes, "pitch": pitch})
                except Exception:
                    pass
                pen_x += x_adv
        return out, pen_x


_CACHE = {}


def get_font(kind="black"):
    if kind not in _CACHE:
        if kind == "black":
            _CACHE[kind] = ShapedFont(DEVA_BLACK, LAT_BLACK)
        else:
            _CACHE[kind] = ShapedFont(DEVA_BOLD, LAT_BOLD)
    return _CACHE[kind]


def text_size(text, size_px, kind="black"):
    f = get_font(kind)
    _, adv = f.layout(text, size_px)
    return adv


def draw_text_mask(text, size_px, kind="black", pad=None):
    """Render text to an L-mode mask image. Returns (mask, width, baseline_from_top)."""
    f = get_font(kind)
    glyphs, adv = f.layout(text, size_px)
    if pad is None:
        pad = int(size_px * 0.9)
    W = int(adv) + pad * 2
    asc = int(size_px * 1.15)
    desc = int(size_px * 0.7)
    H = asc + desc + pad
    img = Image.new("L", (W, H), 0)
    px = img.load()
    for gl in glyphs:
        x0 = int(round(gl["x"] + pad)) + gl["left"]
        base = asc + gl["y"]
        y_top = int(round(base)) - gl["top"]
        w, h, pitch, data = gl["w"], gl["h"], gl["pitch"], gl["data"]
        for row in range(h):
            y = y_top + row
            if y < 0 or y >= H:
                continue
            off = row * pitch
            rowdata = data[off:off + w]
            for col in range(w):
                x = x0 + col
                if 0 <= x < W:
                    v = rowdata[col]
                    if v:
                        px[x, y] = max(px[x, y], v)
    return img, W, asc


def render_line(text, size_px, kind="black", fill=(255, 255, 255), stroke=(0, 0, 0),
                stroke_w=6, shadow=True, glow=None, grad=None):
    """Return RGBA image of one line of text with outline + shadow."""
    mask, W, asc = draw_text_mask(text, size_px, kind)
    out = Image.new("RGBA", (W, mask.height), (0, 0, 0, 0))

    if shadow:
        sh = mask.filter(ImageFilter.MaxFilter(3))
        sh = sh.point(lambda v: int(v * 0.55))
        shadow_img = Image.new("RGBA", (W, mask.height), (0, 0, 0, 0))
        s_alpha = Image.new("L", (W, mask.height), 0)
        s_alpha.paste(sh, (max(1, stroke_w // 2), max(2, stroke_w // 2 + 3)))
        shadow_img.putalpha(s_alpha)
        out = Image.alpha_composite(out, shadow_img)

    if stroke_w > 0:
        k = stroke_w if stroke_w % 2 == 1 else stroke_w + 1
        dil = mask.filter(ImageFilter.MaxFilter(k))
        col = Image.new("RGBA", (W, mask.height), stroke + (255,))
        col.putalpha(dil)
        out = Image.alpha_composite(out, col)

    if glow:
        k = glow if glow % 2 == 1 else glow + 1
        gl = mask.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.GaussianBlur(k))
        glimg = Image.new("RGBA", (W, mask.height), (255, 200, 90, 0))
        glimg.putalpha(gl.point(lambda v: int(v * 0.8)))
        out = Image.alpha_composite(out, glimg)

    if grad:
        gradimg = Image.new("RGBA", (W, mask.height))
        d = ImageDraw.Draw(gradimg)
        top, bot = grad
        for y in range(mask.height):
            t = y / max(1, mask.height - 1)
            c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
            d.line([(0, y), (W, y)], fill=c + (255,))
        gradimg.putalpha(mask)
        out = Image.alpha_composite(out, gradimg)
    else:
        body = Image.new("RGBA", (W, mask.height), fill + (255,))
        body.putalpha(mask)
        out = Image.alpha_composite(out, body)
    return out


def render_caption(lines, size_px=86, kind="black", gap=18, **kw):
    """Render multiple lines centered, return RGBA image."""
    imgs = [render_line(t, size_px, kind, **kw) for t in lines]
    W = max(i.width for i in imgs)
    H = sum(i.height for i in imgs) + gap * (len(imgs) - 1)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    y = 0
    for i in imgs:
        out.alpha_composite(i, ((W - i.width) // 2, y))
        y += i.height + gap
    return out


if __name__ == "__main__":
    tests = [
        ["छोटी आदतें,", "बड़ा बदलाव"],
        ["1% बेहतर रोज़", "37 गुना बेहतर साल"],
        ["PLATEAU OF", "LATENT POTENTIAL"],
        ["बुद्धि, कर्म, प्रयास, श्रद्धा"],
    ]
    ims = []
    for t in tests:
        ims.append(render_caption(t, size_px=90, grad=((255, 236, 150), (255, 165, 40)), glow=9))
    W = max(i.width for i in ims) + 80
    H = sum(i.height for i in ims) + 80 * len(ims)
    canvas = Image.new("RGB", (W, H), (18, 20, 28))
    y = 40
    for i in ims:
        canvas.paste(i, (40, y), i)
        y += i.height + 80
    canvas.save("test_hindi_text.png")
    print("saved test_hindi_text.png", canvas.size)
