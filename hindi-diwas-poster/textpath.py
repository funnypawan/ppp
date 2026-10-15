"""Shape Devanagari/Latin text with HarfBuzz and emit self-contained SVG path data."""
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

_cache = {}

def _font(font_path, features=None):
    key = (font_path, tuple(sorted((features or {}).items())))
    if key not in _cache:
        tt = TTFont(font_path)
        upem = tt["head"].unitsPerEm
        gs = tt.getGlyphSet()
        data = open(font_path, "rb").read()
        face = hb.Face(data)
        hbfont = hb.Font(face)
        hbfont.scale = (upem, upem)
        _cache[key] = (tt, upem, gs, hbfont)
    return _cache[key]

def shape(text, font_path, size, features=None, script="deva", language="hi", direction="ltr"):
    """Return list of dicts: {'name','path','x','y','cluster','ax','ay'} in px, y-down, baseline at 0."""
    tt, upem, gs, hbfont = _font(font_path, features)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.direction = direction
    buf.script = script
    buf.language = language
    hb.shape(hbfont, buf, features or {})
    scale = size / upem
    out = []
    x = y = 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = tt.getGlyphName(info.codepoint)
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
        # font outlines are y-up: flip vertically, then offset
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, x + pos.x_offset * scale, y - pos.y_offset * scale))
        gs[name].draw(tpen)
        out.append(dict(name=name, path=pen.getCommands(), cluster=info.cluster,
                        ax=pos.x_advance * scale, ay=pos.y_advance * scale))
        x += pos.x_advance * scale
        y += pos.y_advance * scale
    return out, x

def width(text, font_path, size, features=None, script="deva", language="hi"):
    return shape(text, font_path, size, features, script, language)[1]

def text_svg(text, font_path, size, x, y, fill="#000", anchor="start",
             features=None, opacity=None, script="deva", language="hi", extra_attrs="", tracking=0.0):
    """x,y = baseline origin for anchor 'start'; for 'middle'/'end' the text is aligned there."""
    glyphs, w = shape(text, font_path, size, features, script, language)
    w_eff = w + tracking * max(0, len(glyphs) - 1)
    ox = x if anchor == "start" else (x - w_eff / 2 if anchor == "middle" else x - w_eff)
    op = f' opacity="{opacity}"' if opacity is not None else ""
    parts = [f'<g transform="translate({ox:.2f} {y:.2f})" fill="{fill}"{op}{extra_attrs}>']
    adv = 0.0
    for i, g in enumerate(glyphs):
        if g["path"]:
            parts.append(f'<path transform="translate({adv:.2f} 0)" d="{g["path"]}"/>')
        adv += tracking
    parts.append("</g>")
    return "".join(parts)

def glyph_svg_path(ch, font_path, size):
    """Outline path for a single character, baseline at origin, y-down."""
    glyphs, w = shape(ch, font_path, size, script="deva", language="hi")
    return "".join(g["path"] for g in glyphs if g["path"]), w

def glyph_bbox(text, font_path, size, features=None, script="deva", language="hi"):
    """Ink bounding box (xmin, ymin, xmax, ymax) in px, y-down, origin = first glyph's baseline start."""
    from fontTools.pens.boundsPen import BoundsPen
    tt, upem, gs, _ = _font(font_path, features)
    scale = size / upem
    glyphs = shape(text, font_path, size, features, script, language)[0]
    xmin = ymin = 1e18
    xmax = ymax = -1e18
    xcur = 0.0
    for g in glyphs:
        bp = BoundsPen(gs)
        gs[g["name"]].draw(TransformPen(bp, Transform(scale, 0, 0, -scale, xcur, 0)))
        if bp.bounds:
            x0, y0, x1, y1 = bp.bounds
            xmin, ymin = min(xmin, x0), min(ymin, y0)
            xmax, ymax = max(xmax, x1), max(ymax, y1)
        xcur += g["ax"]
    if xmin > xmax:
        return 0.0, 0.0, 0.0, 0.0, 0.0
    return xmin, ymin, xmax, ymax, xcur


def ink_offset(text, font_path, size, features=None):
    """(dx, dy) needed to make ink box centred on origin."""
    x0, y0, x1, y1, _ = glyph_bbox(text, font_path, size, features)
    return -(x0 + x1) / 2, -(y0 + y1) / 2
