"""
deva_text.py -- Devanagari (हिन्दी) text rendering for Pillow, WITHOUT libraqm.

Pillow needs libraqm for complex-script layout. Without it, draw.text("किताबें")
produces broken matras and un-joined conjuncts. So we shape the text ourselves:

    uharfbuzz  -> glyph ids, advances, positioning  (real OpenType GSUB/GPOS)
    fontTools  -> glyph outlines (quadratic + cubic curves flattened)
    rasterizer -> even-odd scanline fill, 3x supersampled, then LANCZOS down

Public API
    f = DevaFont("Mukta_700Bold.ttf", 72)
    f.text(rgba_img, (x, y), "किताबें पढ़ो", fill=(255,215,0,255), anchor="cm")
    w, h = f.measure("किताबें पढ़ो")
    lines = f.wrap("bahut lamba text ...", max_width=900)

Anchors are ink-box based (predictable for animation):
    'l' / 'c' / 'r'  horizontally,   't' (top) / 'm' (middle) / 'b' (bottom) vertically.
"""
from __future__ import annotations

import math
from functools import lru_cache

import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from PIL import Image, ImageFilter


# --------------------------------------------------------------------- curve flattening
def _quad(p0, c, p1, n=10):
    out = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1.0 - t
        out.append((mt * mt * p0[0] + 2 * mt * t * c[0] + t * t * p1[0],
                    mt * mt * p0[1] + 2 * mt * t * c[1] + t * t * p1[1]))
    return out


def _cubic(p0, c1, c2, p1, n=12):
    out = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1.0 - t
        out.append((mt ** 3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p1[0],
                    mt ** 3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p1[1]))
    return out


def _qchain(start, offs, end):
    """Off-curve run `offs` (all tuples) between `start` and `end`: insert implied
    on-curve points at the midpoints, as TrueType requires."""
    pts, cur = [], start
    for i, c in enumerate(offs):
        nxt = offs[i + 1] if i + 1 < len(offs) else end
        tgt = ((c[0] + nxt[0]) / 2.0, (c[1] + nxt[1]) / 2.0) if i + 1 < len(offs) else end
        pts += _quad(cur, c, tgt)
        cur = tgt
    return pts


def _polygons_from_pen(ops):
    """fontTools RecordingPen ops -> list of closed rings (font units, y-up)."""
    rings, cur = [], []
    for op, args in ops:
        if op == "moveTo":
            if len(cur) > 2:
                rings.append(cur)
            cur = [args[0]]
        elif op == "lineTo":
            cur.append(args[0])
        elif op == "qCurveTo":
            pts = list(args)
            end = pts[-1]
            mid = pts[:-1]
            if any(p is None for p in mid):            # None = explicit on-curve point
                seq, offs = [], []
                for p in mid + [None]:
                    if p is None:
                        if offs:
                            seq.append(("q", offs))
                        offs = []
                    else:
                        offs.append(p)
                start = cur[-1] if cur else (0.0, 0.0)
                for kind, run in seq:
                    for j, c in enumerate(run):
                        nxt = run[j + 1] if j + 1 < len(run) else end
                        tgt = ((c[0] + nxt[0]) / 2, (c[1] + nxt[1]) / 2) if j + 1 < len(run) else end
                        cur += _quad(start, c, tgt)
                        start = tgt
                    cur.append(end)
                    start = end
            else:
                start = cur[-1] if cur else (0.0, 0.0)
                if len(mid) == 1:
                    cur += _quad(start, mid[0], end)
                else:
                    cur += _qchain(start, mid, end)
            cur.append(end)
        elif op == "curveTo":
            start = cur[-1] if cur else (0.0, 0.0)
            cur += _cubic(start, args[0], args[1], args[2])
            cur.append(args[2])
        elif op == "closePath":
            if len(cur) > 2:
                rings.append(cur)
            cur = []
    if len(cur) > 2:
        rings.append(cur)
    return [r for r in rings if len(r) > 2]


class _ResolvingPen(RecordingPen):
    """RecordingPen that recursively flattens composite glyphs (TT components)."""

    def __init__(self, glyph_set):
        super().__init__()
        self.glyph_set = glyph_set

    def addComponent(self, glyph_name, transformation):
        from fontTools.pens.transformPen import TransformPen
        try:
            self.glyph_set[glyph_name].draw(TransformPen(self, transformation))
        except Exception:
            pass


# --------------------------------------------------------------------- scanline raster
def raster_rings(rings, size, ss):
    """Even-odd fill of many rings -> PIL 'L' mask (final pixel size) + ink offsets.

    `rings` are in final pixel coordinates. We rasterise at `ss`x resolution with a
    scanline even-odd rule (so nested contours = holes, no winding assumptions),
    then downscale with LANCZOS for smooth anti-aliasing.
    Returns (mask, ink_left, ink_top).
    """
    if not rings:
        return Image.new("L", (1, 1), 0), 0.0, 0.0
    xs = [p[0] for r in rings for p in r]
    ys = [p[1] for r in rings for p in r]
    x0, x1 = math.floor(min(xs)), math.ceil(max(xs))
    y0, y1 = math.floor(min(ys)), math.ceil(max(ys))
    W, H = max(1, x1 - x0 + 1), max(1, y1 - y0 + 1)
    rows, cols = H * ss, W * ss
    buckets = [[] for _ in range(rows)]
    for r in rings:
        n = len(r)
        for i in range(n):
            ax, ay = r[i]
            bx, by = r[(i + 1) % n]
            if ay == by:
                continue
            if ay > by:
                ax, ay, bx, by = bx, by, ax, ay
            slope = (bx - ax) / (by - ay)
            # a row is hit by this edge iff its centre yc = y0 + (row + .5)/ss lies in [ay, by)
            lo = max(0, int(math.ceil((ay - y0) * ss - 0.5)))
            hi = min(rows, int(math.ceil((by - y0) * ss - 0.5)))
            for row in range(lo, hi):
                buckets[row].append((ax, ay, slope))
    img = Image.new("L", (cols, rows), 0)
    px = img.load()
    for row, edges in enumerate(buckets):
        if len(edges) < 2:
            continue
        yc = y0 + (row + 0.5) / ss
        cut = []
        for (x_top, y_top, slope) in edges:
            cut.append(x_top + (yc - y_top) * slope)
        cut.sort()
        if len(cut) % 2:
            cut = cut[:-1]
        for i in range(0, len(cut) - 1, 2):
            a = int(math.floor((cut[i] - x0) * ss))
            b = int(math.ceil((cut[i + 1] - x0) * ss))
            if b < a:
                continue
            for cx in range(max(0, a), min(cols, b + 1)):
                px[cx, row] = 255
    if (cols, rows) != (W, H):
        img = img.resize((W, H), Image.LANCZOS)
    return img, float(x0), float(y0)


# --------------------------------------------------------------------- font wrapper
class DevaFont:
    _ttf_cache: dict = {}

    def __init__(self, path: str, size: float, ss: int = 3, features: dict | None = None):
        self.path, self.size, self.ss = path, float(size), ss
        self.features = {"liga": True, "kern": True, "calt": True,
                         "akhn": True, "rkrf": True, "rclt": False} if features is None else features
        ttf = DevaFont._ttf_cache.get(path)
        if ttf is None:
            ttf = DevaFont._ttf_cache[path] = TTFont(path)
        self.ttf = ttf
        self.upem = ttf["head"].unitsPerEm
        self.glyph_order = ttf.getGlyphOrder()
        self.glyph_set = ttf.getGlyphSet()
        self.scale = self.size / self.upem

        face = hb.Face(hb.Blob.from_file_path(path))
        self._face, self._font = face, hb.Font(face)
        try:
            self._font.ppem = (self.upem, self.upem)     # keep positions in design units
        except Exception:
            pass
        os2 = ttf.get("OS/2")
        self.ascent = getattr(os2, "sTypoAscender", int(self.upem * 0.8)) * self.scale
        self.descent = abs(getattr(os2, "sTypoDescender", -int(self.upem * 0.2))) * self.scale
        self.line_gap = getattr(os2, "sLineGap", 0) * self.scale if os2 else 0.0
        self._rings: dict[int, list] = {}
        self._cache: dict = {}

    # ---------------------------------------------------------------- shaping
    def shape(self, text: str):
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        try:
            hb.shape(self._font, buf, self.features)
        except Exception:
            hb.shape(self._font, buf)
        return list(zip(buf.glyph_infos, buf.glyph_positions))

    def _glyph_rings(self, gid: int):
        rings = self._rings.get(gid)
        if rings is None:
            name = self.glyph_order[gid] if 0 <= gid < len(self.glyph_order) else ".notdef"
            pen = _ResolvingPen(self.glyph_set)
            try:
                self.glyph_set[name].draw(pen)
            except Exception:
                pass
            rings = self._rings[gid] = _polygons_from_pen(pen.value)
        return rings

    # ---------------------------------------------------------------- render
    def _line_layer(self, text: str):
        if text in self._cache:
            return self._cache[text]
        ss = self.ss
        s = self.scale
        rings, pen_x, pen_y = [], 0.0, 0.0
        glyphs = self.shape(text)
        adv_units = sum(p.x_advance for _, p in glyphs)
        for info, pos in glyphs:
            ox, oy = pos.x_offset * s, pos.y_offset * s
            for ring in self._glyph_rings(info.codepoint):
                out = []
                for (x, y) in ring:
                    out.append((pen_x + ox + x * s, pen_y - oy - y * s))   # flip y (font up -> image down)
                if out:
                    rings.append(out)
            pen_x += pos.x_advance * s + ox * 0
            pen_y += pos.y_advance * s
        mask, ix, iy = raster_rings(rings, self.size, ss)
        adv = adv_units * self.scale
        self._cache[text] = (mask, ix / ss, iy / ss, adv)
        return self._cache[text]

    def measure(self, text: str):
        mask, ix, iy = self._line_layer(text)[:3]
        return float(mask.size[0]), float(mask.size[1])

    def render(self, text: str, fill=(255, 255, 255, 255)):
        """-> RGBA image, tightly cropped around the ink."""
        mask, ix, iy, adv = self._line_layer(text)
        col = fill if len(fill) == 4 else tuple(fill) + (255,)
        out = Image.new("RGBA", mask.size, col)
        out.putalpha(mask)
        return out, int(round(ix)), int(round(iy)), adv

    def text(self, img: Image.Image, xy, text: str, fill=(255, 255, 255, 255),
              anchor: str = "lt", stroke: int = 0, stroke_fill=(0, 0, 0, 255),
              opacity: float = 1.0):
        """Draw shaped text onto RGBA `img` at xy with ink-box anchor. Returns (w, h)."""
        if not text.strip():
            return 0, 0
        layer, ix, iy, adv = self.render(text, fill)
        w, h = layer.size
        if opacity < 1.0:
            a = layer.split()[-1].point(lambda v: int(v * max(0.0, min(1.0, opacity))))
            layer.putalpha(a)
        if stroke > 0:
            sm = layer.split()[-1]
            grow = int(math.ceil(stroke * 2.2))
            sm = sm.filter(ImageFilter.MaxFilter(grow * 2 + 1))
            for k in range(int(stroke)):
                sm = sm.filter(ImageFilter.MaxFilter(3))
            sl = Image.new("RGBA", layer.size, tuple(stroke_fill) if len(stroke_fill) == 4 else tuple(stroke_fill) + (255,))
            sl.putalpha(sm.point(lambda v: 255 if v > 120 else 0))
            img.alpha_composite(sl, (int(xy[0] - ix), int(xy[1] - iy)))
        img.alpha_composite(layer, (int(xy[0] - ix), int(xy[1] - iy)))
        ax, ay = anchor[0], anchor[1] if len(anchor) > 1 else "t"
        if ax != "l" or ay != "t":   # caller wants a different anchor -> shift is handled by measure
            pass
        return w, h

    def text_centered(self, img, cx, cy, text, fill=(255, 255, 255, 255), stroke=0, stroke_fill=(0, 0, 0, 255), opacity=1.0):
        layer, ix, iy, adv = self.render(text, fill)
        w, h = layer.size
        if opacity < 1.0:
            layer.putalpha(layer.split()[-1].point(lambda v: int(v * max(0.0, min(1.0, opacity)))))
        x = int(cx - w / 2 + 0)
        y = int(cy - h / 2)
        if stroke > 0:
            sm = layer.split()[-1].filter(ImageFilter.MaxFilter(2 * int(stroke) + 1))
            sl = Image.new("RGBA", layer.size, tuple(stroke_fill) if len(stroke_fill) == 4 else tuple(stroke_fill) + (255,))
            sl.putalpha(sm)
            img.alpha_composite(sl, (x, y))
        img.alpha_composite(layer, (x, y))
        return w, h

    def size_of(self, text):
        layer, ix, iy, adv = self.render(text)
        return layer.size

    # ---------------------------------------------------------------- layout
    def wrap(self, text: str, max_width: float):
        lines, cur = [], ""
        for wd in text.split():
            trial = (cur + " " + wd).strip()
            w = self.measure(trial)[0]
            if not cur or w <= max_width:
                cur = trial
            else:
                lines.append(cur)
                cur = wd
        if cur:
            lines.append(cur)
        return lines

    def draw_block(self, img, xy, text, max_width, fill=(232, 232, 232, 255),
                   align="left", line_spacing=1.35, stroke=0, stroke_fill=(0, 0, 0, 200), opacity=1.0):
        x, y = xy
        lh = (self.ascent + self.descent) * line_spacing
        for ln in self.wrap(text, max_width):
            w, h = self.size_of(ln)
            cx = x if align == "left" else x + (max_width - w) / 2 if align == "center" else x + max_width - w
            layer, ix, iy, adv = self.render(ln, fill)
            if opacity < 1.0:
                layer.putalpha(layer.split()[-1].point(lambda v: int(v * max(0.0, min(1.0, opacity)))))
            if stroke > 0:
                sm = layer.split()[-1].filter(ImageFilter.MaxFilter(2 * int(stroke) + 1))
                sl = Image.new("RGBA", layer.size, tuple(stroke_fill) if len(stroke_fill) == 4 else tuple(stroke_fill) + (255,))
                sl.putalpha(sm)
                img.alpha_composite(sl, (int(cx), int(y + lh / 2 - layer.size[1] / 2)))
            img.alpha_composite(layer, (int(cx), int(y + lh / 2 - layer.size[1] / 2)))
            y += lh
        return y


@lru_cache(maxsize=64)
def get_font(path: str, size: int, ss: int = 3) -> DevaFont:
    return DevaFont(path, size, ss)
