#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dream Classes Kothwara -- OMR Sheet (A4 Landscape) generator
============================================================

Ye script ek hi layout se do file banati hai:

  1. Dream-Classes-OMR-Sheet-A4.pdf  -> print ready (kisi bhi dukaan/browser se print karo)
  2. omr-sheet.html                  -> wahi design browser me dekhne / print karne ke liye

Sheet ka design:
  * A4 page, "long" (landscape) me
  * Upar: institute ka naam + mobile number
  * 5 column, har column me 4 question  ->  total 20 question (Q1-4, Q5-8, ... Q17-20)
  * Har question ke bagal me A B C D ke 4 gole circle (bubble)

Chalane ke liye:
    pip install reportlab
    python3 omr-sheet-generator.py

Sab kuch mm me set hai -- neeche CONFIG ke numbers badal kar layout adjust kar sakte ho
(jaise BUBBLE_DIA bada karna, COLUMNS badalna, naam badalna, etc.)
"""

import os

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth

MM = 72.0 / 25.4  # 1 millimetre in points

# ----------------------------------------------------------------------------
# CONFIG  (sab measurements millimetre me)
# ----------------------------------------------------------------------------
PAGE_W, PAGE_H = 297.0, 210.0          # A4 landscape
MARGIN_X, MARGIN_TOP, MARGIN_BOTTOM = 7.0, 6.0, 6.0

INSTITUTE = "DREAM CLASSES KOTHWARA"
MOBILE = "Mob. : 9708983294"

QUESTIONS = 20                          # total questions
COLUMNS = 5                             # kitne column me
OPTIONS = ["A", "B", "C", "D"]          # 4 option

TITLE_SIZE = 11.0                       # institute name ka font size
MOB_SIZE = 5.0
INFO_SIZE = 3.8                         # Name / Roll No / Date line
QNO_SIZE = 4.4                          # question number
BUBBLE_DIA = 9.6                        # circle ka diameter
BUBBLE_GAP = 1.9                        # do circles ke beech ka gap
LETTER_SIZE = 4.2                       # A B C D letters
FOOT_SIZE = 3.5

COL_GAP = 3.0                           # columns ke beech gap
ROW_GAP = 2.5                           # ek column ke question boxes ke beech gap
BOX_PAD = 1.2                           # box ke andar padding
BOX_RADIUS = 1.8

C_TITLE = "#12306b"                     # deep blue
C_TEXT = "#2b2b2b"
C_LETTER = "#222222"
C_BUBBLE = "#444444"
C_BORDER = "#b8b8b8"
C_LINE = "#666666"

FONT, FONT_BOLD = "Helvetica", "Helvetica-Bold"

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_NAME = "Dream-Classes-OMR-Sheet-A4.pdf"
HTML_NAME = "omr-sheet.html"


# ----------------------------------------------------------------------------
# Chhota drawing helper -- ek hi element list se PDF aur SVG dono banti hai
# ----------------------------------------------------------------------------
class Sheet:
    def __init__(self, width=PAGE_W, height=PAGE_H):
        self.w, self.h = width, height
        self.elements = []

    # ---- banane wale helpers (origin top-left, y neeche ki taraf) ----
    def rect(self, x, y, w, h, radius=0.0, fill=None, stroke=None, sw=0.4):
        self.elements.append({"t": "rect", "x": x, "y": y, "w": w, "h": h,
                              "r": radius, "fill": fill, "stroke": stroke, "sw": sw})

    def circle(self, cx, cy, r, fill=None, stroke=None, sw=0.4):
        self.elements.append({"t": "circle", "cx": cx, "cy": cy, "r": r,
                              "fill": fill, "stroke": stroke, "sw": sw})

    def line(self, x1, y1, x2, y2, color=C_LINE, sw=0.35):
        self.elements.append({"t": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                              "stroke": color, "sw": sw})

    def text(self, x, y, s, size, bold=False, color=C_TEXT, anchor="start"):
        self.elements.append({"t": "text", "x": x, "y": y, "s": s, "size": size,
                              "bold": bold, "fill": color, "anchor": anchor})

    @staticmethod
    def text_width(s, size, bold=False):
        """Text ki width mm me (Helvetica metrics)."""
        return stringWidth(s, FONT_BOLD if bold else FONT, size * MM) / MM

    # ---- PDF ----
    def write_pdf(self, path):
        c = canvas.Canvas(path, pagesize=(self.w * MM, self.h * MM))
        c.setTitle("OMR Sheet - " + INSTITUTE)
        c.setAuthor(INSTITUTE)
        for e in self.elements:
            if e["t"] == "rect":
                c.setLineWidth(e["sw"] * MM)
                c.setStrokeColor(HexColor(e["stroke"]) if e["stroke"] else None)
                c.setFillColor(HexColor(e["fill"]) if e["fill"] else None)
                y_bottom = (self.h - e["y"] - e["h"]) * MM
                if e["r"]:
                    c.roundRect(e["x"] * MM, y_bottom, e["w"] * MM, e["h"] * MM,
                                e["r"] * MM, stroke=1 if e["stroke"] else 0,
                                fill=1 if e["fill"] else 0)
                else:
                    c.rect(e["x"] * MM, y_bottom, e["w"] * MM, e["h"] * MM,
                           stroke=1 if e["stroke"] else 0,
                           fill=1 if e["fill"] else 0)
            elif e["t"] == "circle":
                c.setLineWidth(e["sw"] * MM)
                c.setStrokeColor(HexColor(e["stroke"]) if e["stroke"] else None)
                c.setFillColor(HexColor(e["fill"]) if e["fill"] else None)
                c.circle(e["cx"] * MM, (self.h - e["cy"]) * MM, e["r"] * MM,
                         stroke=1 if e["stroke"] else 0,
                         fill=1 if e["fill"] else 0)
            elif e["t"] == "line":
                c.setLineWidth(e["sw"] * MM)
                c.setStrokeColor(HexColor(e["stroke"]))
                c.line(e["x1"] * MM, (self.h - e["y1"]) * MM,
                       e["x2"] * MM, (self.h - e["y2"]) * MM)
            elif e["t"] == "text":
                c.setFont(FONT_BOLD if e["bold"] else FONT, e["size"] * MM)
                c.setFillColor(HexColor(e["fill"]))
                y = (self.h - e["y"]) * MM
                if e["anchor"] == "middle":
                    c.drawCentredString(e["x"] * MM, y, e["s"])
                elif e["anchor"] == "end":
                    c.drawRightString(e["x"] * MM, y, e["s"])
                else:
                    c.drawString(e["x"] * MM, y, e["s"])
        c.showPage()
        c.save()

    # ---- SVG ----
    def to_svg(self, inline=False):
        def esc(s):
            return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

        def n(v):
            return ("%.3f" % v).rstrip("0").rstrip(".")

        head = ('<svg xmlns="http://www.w3.org/2000/svg" '
                'width="%smm" height="%smm" viewBox="0 0 %s %s">'
                % (n(self.w), n(self.h), n(self.w), n(self.h)))
        body = []
        for e in self.elements:
            if e["t"] == "rect":
                attrs = 'x="%s" y="%s" width="%s" height="%s"' % (
                    n(e["x"]), n(e["y"]), n(e["w"]), n(e["h"]))
                if e["r"]:
                    attrs += ' rx="%s" ry="%s"' % (n(e["r"]), n(e["r"]))
                attrs += ' fill="%s"' % (e["fill"] or "none")
                if e["stroke"]:
                    attrs += ' stroke="%s" stroke-width="%s"' % (e["stroke"], n(e["sw"]))
                body.append("<rect %s/>" % attrs)
            elif e["t"] == "circle":
                attrs = 'cx="%s" cy="%s" r="%s" fill="%s"' % (
                    n(e["cx"]), n(e["cy"]), n(e["r"]), e["fill"] or "none")
                if e["stroke"]:
                    attrs += ' stroke="%s" stroke-width="%s"' % (e["stroke"], n(e["sw"]))
                body.append("<circle %s/>" % attrs)
            elif e["t"] == "line":
                body.append('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" '
                            'stroke-width="%s"/>' % (n(e["x1"]), n(e["y1"]), n(e["x2"]),
                                                     n(e["y2"]), e["stroke"], n(e["sw"])))
            elif e["t"] == "text":
                body.append('<text x="%s" y="%s" font-family="Helvetica, Arial, sans-serif" '
                            'font-size="%s" font-weight="%s" fill="%s"%s>%s</text>'
                            % (n(e["x"]), n(e["y"]), n(e["size"]),
                               "bold" if e["bold"] else "normal", e["fill"],
                               ' text-anchor="middle"' if e["anchor"] == "middle"
                               else (' text-anchor="end"' if e["anchor"] == "end" else ""),
                               esc(e["s"])))
        svg = head + "".join(body) + "</svg>"
        if inline:
            return svg
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + svg


# ----------------------------------------------------------------------------
# Layout
# ----------------------------------------------------------------------------
def build_sheet():
    s = Sheet()
    cx_page = PAGE_W / 2.0
    inner_left = MARGIN_X
    inner_right = PAGE_W - MARGIN_X
    inner_w = inner_right - inner_left

    # ---------- Header ----------
    title_baseline = MARGIN_TOP + TITLE_SIZE * 0.78
    mob_baseline = title_baseline + TITLE_SIZE * 0.42 + MOB_SIZE * 0.75
    rule_y = mob_baseline + MOB_SIZE * 0.45 + 1.8

    s.text(cx_page, title_baseline, INSTITUTE, TITLE_SIZE, bold=True,
           color=C_TITLE, anchor="middle")
    s.text(cx_page, mob_baseline, MOBILE, MOB_SIZE, bold=True,
           color=C_TEXT, anchor="middle")
    # double rule (heading ke neeche patli double line)
    s.line(inner_left, rule_y, inner_right, rule_y, color=C_TITLE, sw=0.5)
    s.line(inner_left, rule_y + 1.0, inner_right, rule_y + 1.0, color=C_TITLE, sw=0.25)

    # ---------- Name / Roll No. / Date ----------
    info_baseline = rule_y + 1.0 + INFO_SIZE * 1.9
    underline_y = info_baseline + 0.9

    items = [("Name :", 22.0, 62.0), ("Roll No. :", 42.0, 34.0), ("Date :", 60.0, 0.0)]
    x = inner_left
    for label, line_len, gap_after in items:
        s.text(x, info_baseline, label, INFO_SIZE, bold=True, color=C_TEXT)
        lx = x + s.text_width(label, INFO_SIZE, True) + 2.0
        if line_len:
            s.line(lx, underline_y, lx + line_len, underline_y, color=C_LINE, sw=0.35)
        x = lx + line_len + (gap_after if gap_after else 0.0)

    # ---------- Footer (office use) ----------
    foot_h = 11.0
    foot_top = PAGE_H - MARGIN_BOTTOM - foot_h
    s.rect(inner_left, foot_top, inner_w, foot_h, radius=BOX_RADIUS,
           fill="#ffffff", stroke=C_BORDER, sw=0.4)
    foot_base = foot_top + foot_h / 2.0 + FOOT_SIZE * 0.36

    foot_line_y = foot_top + foot_h / 2.0 + 1.2
    txt = "Total Marks : %d" % QUESTIONS
    s.text(inner_left + 4.0, foot_base, txt, FOOT_SIZE, bold=True, color=C_TEXT)
    x2 = inner_left + 4.0 + s.text_width(txt, FOOT_SIZE, True) + 14.0
    lab = "Marks Obtained :"
    s.text(x2, foot_base, lab, FOOT_SIZE, bold=True, color=C_TEXT)
    lx = x2 + s.text_width(lab, FOOT_SIZE, True) + 2.0
    s.line(lx, foot_line_y, lx + 30.0, foot_line_y, color=C_LINE, sw=0.35)
    x3 = lx + 30.0 + 16.0
    lab2 = "Examiner's Sign :"
    s.text(x3, foot_base, lab2, FOOT_SIZE, bold=True, color=C_TEXT)
    lx2 = x3 + s.text_width(lab2, FOOT_SIZE, True) + 2.0
    s.line(lx2, foot_line_y, inner_right - 4.0, foot_line_y, color=C_LINE, sw=0.35)

    # ---------- Question grid ----------
    grid_top = underline_y + 4.0
    grid_bottom = foot_top - 3.5
    grid_h = grid_bottom - grid_top

    per_col = QUESTIONS // COLUMNS                    # 4
    col_w = (inner_w - (COLUMNS - 1) * COL_GAP) / COLUMNS
    row_h = (grid_h - (per_col - 1) * ROW_GAP) / per_col

    bub_w = len(OPTIONS) * BUBBLE_DIA + (len(OPTIONS) - 1) * BUBBLE_GAP
    qno_w = 6.5
    content_w = qno_w + 1.5 + bub_w
    start_x = (col_w - 2 * BOX_PAD - content_w) / 2.0      # box ke andar centering

    for c in range(COLUMNS):
        col_x = inner_left + c * (col_w + COL_GAP)
        for r in range(per_col):
            q_num = c * per_col + r + 1
            box_y = grid_top + r * (row_h + ROW_GAP)
            s.rect(col_x, box_y, col_w, row_h, radius=BOX_RADIUS,
                   fill="#ffffff", stroke=C_BORDER, sw=0.4)

            mid_y = box_y + row_h / 2.0
            # question number
            num_x = col_x + BOX_PAD + start_x + qno_w
            s.text(num_x, mid_y + QNO_SIZE * 0.36, "%d." % q_num, QNO_SIZE,
                   bold=True, color=C_TEXT, anchor="end")

            # A B C D bubbles
            bub_x = col_x + BOX_PAD + start_x + qno_w + 1.5 + BUBBLE_DIA / 2.0
            for i, opt in enumerate(OPTIONS):
                bx = bub_x + i * (BUBBLE_DIA + BUBBLE_GAP)
                s.circle(bx, mid_y, BUBBLE_DIA / 2.0, fill="#ffffff",
                         stroke=C_BUBBLE, sw=0.4)
                s.text(bx, mid_y + LETTER_SIZE * 0.36, opt, LETTER_SIZE,
                       bold=True, color=C_LETTER, anchor="middle")

    return s


# ----------------------------------------------------------------------------
# HTML wrapper (SVG andar embed)
# ----------------------------------------------------------------------------
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OMR Sheet (A4) - {institute}</title>
<style>
  @page {{ size: A4 landscape; margin: 0; }}
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; padding: 0; background: #d9dde3; }}
  .hint {{
    text-align: center; padding: 14px 10px 12px; font: 13px/1.5 Arial, Helvetica, sans-serif;
    color: #4a5568;
  }}
  .sheet {{
    width: 297mm; height: 210mm; margin: 0 auto 24px; background: #fff;
    box-shadow: 0 3px 18px rgba(0, 0, 0, .25);
  }}
  .sheet svg {{ display: block; width: 297mm; height: 210mm; }}
  @media print {{
    html, body {{ background: #fff; }}
    .hint {{ display: none; }}
    .sheet {{ box-shadow: none; margin: 0; }}
  }}
</style>
</head>
<body>
<div class="hint">Print settings &rarr; Paper: A4 &nbsp;|&nbsp; Layout: Landscape &nbsp;|&nbsp; Margins: None &nbsp;|&nbsp; Scale: 100%</div>
<div class="sheet">
{svg}
</div>
</body>
</html>
"""


def main():
    sheet = build_sheet()

    pdf_path = os.path.join(OUT_DIR, PDF_NAME)
    sheet.write_pdf(pdf_path)
    print("PDF  ->", pdf_path)

    html_path = os.path.join(OUT_DIR, HTML_NAME)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_TEMPLATE.format(institute=INSTITUTE, svg=sheet.to_svg(inline=True)))
    print("HTML ->", html_path)


if __name__ == "__main__":
    main()
