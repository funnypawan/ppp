#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build the SochSet YouTube upload-pack PDF from youtube_metadata.md.
Renders with PyMuPDF's Story engine (MuPDF/HarfBuzz) -> correct Devanagari shaping.
Also writes plain-text copy files (with emoji intact) for easy copy-paste.
"""
import os, re, html as htmlmod
import uharfbuzz as hb
import pymupdf
import markdown

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "youtube_metadata.md")
OUT = os.path.join(BASE, "SochSet_YouTube_Upload_Pack.pdf")
TXT_DESC = os.path.join(BASE, "SochSet_description.txt")
TXT_META = os.path.join(BASE, "SochSet_title_and_tags.txt")

FD = os.path.join(BASE, "fonts")
W, H = 595.276, 841.89
MARGIN_X = 42.0
TOP = 62.0
BOTTOM = H - 50.0

NAVY = (0.086, 0.129, 0.243)
GOLD = (0.769, 0.478, 0.047)
INK = (0.102, 0.110, 0.133)
MUTED = (0.384, 0.408, 0.463)
RULE = (0.871, 0.886, 0.918)

FONTS = [hb.Font(hb.Face(hb.Blob.from_file_path(os.path.join(FD, f))))
         for f in ("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari-Bold.ttf",
                   "NotoSans-Regular.ttf", "NotoSans-Bold.ttf")]

# characters the bundled fonts cannot draw -> safe visual equivalents
MAP = {
    "\u2705": "\u2022",   # check  -> bullet
    "\u2714": "\u2022",
    "\u2713": "\u2022",
    "\u25b6": "\u25b8",   # play   -> small triangle (checked below)
    "\u2501": "",         # heavy line
    "\u2500": "",
    "\u2192": ">",
    "\u21d2": ">",
    "\u279c": ">",
    "\ufe0f": "",         # variation selector
}


def covered(ch):
    cp = ord(ch)
    return any(f.get_nominal_glyph(cp) is not None for f in FONTS)


def sanitize(t):
    """Keep only characters the fonts can render (prevents MuPDF/HB glyph chaos)."""
    out = []
    for ch in t:
        if ch in "\n\r\t " or covered(ch):
            out.append(ch)
        else:
            rep = MAP.get(ch, "")
            if rep and all(covered(c) for c in rep):
                out.append(rep)
    return "".join(out)


# ---------------------------------------------------------------- markdown -> html
def md_to_html(md_text):
    md_text = sanitize(md_text)
    # drop the first H1 (the hero banner already shows it)
    md_text = re.sub(r"^# .*$", "", md_text, count=1, flags=re.M)
    return markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists", "nl2br", "attr_list"],
        output_format="html5",
    )


CSS = """
@font-face {font-family: hindi; src: url(fonts/NotoSansDevanagari-Regular.ttf);}
@font-face {font-family: hindi; font-weight: bold; src: url(fonts/NotoSansDevanagari-Bold.ttf);}
@font-face {font-family: latin; src: url(fonts/NotoSans-Regular.ttf);}
@font-face {font-family: latin; font-weight: bold; src: url(fonts/NotoSans-Bold.ttf);}
* {font-family: latin, hindi;}
body {font-size: 10.4pt; color: #1a1c22; line-height: 1.5;}
p {margin: 4px 0 7px;}
h2 {font-size: 15pt; color: #16213e; margin: 18px 0 8px; padding: 3px 0 3px 10px;
    border-left: 5px solid #c47a0c; line-height: 1.25;}
h3 {font-size: 11.6pt; color: #a86708; margin: 12px 0 4px;}
h4 {font-size: 10.6pt; color: #16213e; margin: 10px 0 4px;}
strong {color: #16213e;}
a {color: #1a4fa0; text-decoration: none;}
table {border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 9.6pt;}
th {background: #f6f2e8; color: #16213e; text-align: left; font-weight: bold;
    border-bottom: 1.2px solid #d9c79a; padding: 5px 6px;}
td {border-bottom: 0.7px solid #e2e6ee; padding: 5px 6px; vertical-align: top;}
pre {background: #f3f5f9; border-left: 5px solid #c47a0c; padding: 10px 12px;
     font-family: latin, hindi; font-size: 9.7pt; line-height: 1.5;
     white-space: pre-wrap; margin: 6px 0 12px; color: #1c2436;}
code {font-family: latin, hindi; font-size: 9.7pt; background: #f3f5f9; padding: 0 2px;}
pre code {background: transparent; padding: 0;}
blockquote {background: #fbf5e6; border-left: 4px solid #d9b96a; margin: 8px 0;
            padding: 7px 10px; color: #6b4a05; font-size: 10pt;}
ul, ol {margin: 3px 0 8px 20px; padding: 0;}
li {margin: 2.5px 0;}
hr {border: none; border-top: 0.8px solid #dee2ea; margin: 14px 0;}
"""


def measure_hero(title, subtitle):
    """Return (band_height, title_rect, sub_rect) using a throwaway page."""
    tmp = pymupdf.open()
    pg = tmp.new_page(width=W, height=H)
    tl, sl = sanitize(title), sanitize(subtitle)
    t_rect = pymupdf.Rect(MARGIN_X + 6, 40, W - MARGIN_X, 150)
    spare, _ = pg.insert_htmlbox(
        t_rect, f"<b>{htmlmod.escape(tl)}</b>",
        css="@font-face{font-family:hindi;src:url(fonts/NotoSansDevanagari-Bold.ttf);}"
            "@font-face{font-family:latin;font-weight:bold;src:url(fonts/NotoSans-Bold.ttf);}"
            "*{font-family:latin,hindi;} b{font-size:22pt;color:#ffffff;line-height:1.32;}",
        archive=pymupdf.Archive(BASE))
    used = t_rect.height - spare
    s_rect = pymupdf.Rect(MARGIN_X + 6, 40 + used + 5, W - MARGIN_X - 6, 40 + used + 70)
    spare2, _ = pg.insert_htmlbox(
        s_rect, htmlmod.escape(sl),
        css="@font-face{font-family:hindi;src:url(fonts/NotoSansDevanagari-Regular.ttf);}"
            "@font-face{font-family:latin;src:url(fonts/NotoSans-Regular.ttf);}"
            "*{font-family:latin,hindi;} div{font-size:10pt;color:#c3cde0;line-height:1.45;}",
        archive=pymupdf.Archive(BASE))
    used2 = s_rect.height - spare2
    band_h = 40 + used + 5 + used2 + 18
    tmp.close()
    return band_h, used, used2


def draw_hero(page, title, subtitle, cy):
    """cy = y of the top of the title text block."""
    tl, sl = sanitize(title), sanitize(subtitle)
    t_rect = pymupdf.Rect(MARGIN_X + 6, cy, W - MARGIN_X, cy + 120)
    pg = page
    spare, _ = pg.insert_htmlbox(
        t_rect, f"<b>{htmlmod.escape(tl)}</b>",
        css="@font-face{font-family:hindi;src:url(fonts/NotoSansDevanagari-Bold.ttf);}"
            "@font-face{font-family:latin;font-weight:bold;src:url(fonts/NotoSans-Bold.ttf);}"
            "*{font-family:latin,hindi;} b{font-size:22pt;color:#ffffff;line-height:1.32;}",
        archive=pymupdf.Archive(BASE))
    return t_rect.height - spare


def draw_chrome(page, pageno):
    if pageno > 1:
        page.insert_text((MARGIN_X, 34),
                         sanitize("SochSet  |  YouTube Upload Pack  -  Atomic Habits (Hindi)"),
                         fontsize=8, fontname="helv", color=MUTED)
        page.draw_line(pymupdf.Point(MARGIN_X, 40), pymupdf.Point(W - MARGIN_X, 40),
                       color=RULE, width=0.7)
    if pageno > 1:
        page.insert_text((W / 2 - 12, H - 26), f"Page {pageno}",
                         fontsize=8, fontname="helv", color=MUTED)


def build_html():
    md = open(SRC, encoding="utf-8").read()
    body = md_to_html(md)
    hero_title = "YouTube Upload Pack\nAtomic Habits (Hindi Book Summary)"
    hero_sub = ("Channel: SochSet  |  Handle: @sochsethofficial  |  "
                "Video: 6 min 20 sec, 1080p, Hindi voice + background music + on-screen text")
    return hero_title, hero_sub, body


def write_copy_files(md):
    lines = md.split("\n")
    out = {"desc": [], "meta": []}
    mode = None
    for l in lines:
        s = l.strip()
        if s.startswith("## ") and "DESCRIPTION" in s:
            mode = "desc"; continue
        if s.startswith("## ") and "TAGS" in s:
            mode = None
        if mode and s.startswith("```"):
            mode = "desc_body" if mode == "desc" else mode
            continue
        if mode == "desc_body":
            if s.startswith("```"):
                mode = None
                continue
            out["desc"].append(l)
    # title + tags (exact, emoji preserved)
    title = ""
    tags = ""
    for i, l in enumerate(lines):
        if l.strip().startswith("1% बेहतर रोज़") and not title:
            title = l.strip()
        if l.startswith("atomic habits hindi,"):
            tags = l.strip()
    with open(TXT_DESC, "w", encoding="utf-8") as f:
        f.write("TITLE:\n" + title + "\n\nDESCRIPTION:\n" + "\n".join(out["desc"]).strip() + "\n")
    with open(TXT_META, "w", encoding="utf-8") as f:
        f.write("TITLE (61 characters):\n" + title + "\n\nTAGS (copy-paste, 483 characters):\n" + tags + "\n")
    print("copy files written:", os.path.basename(TXT_DESC), "+", os.path.basename(TXT_META))


def build():
    md = open(SRC, encoding="utf-8").read()
    write_copy_files(md)
    hero_title, hero_sub, body = build_html()

    band_h, used, used2 = measure_hero(hero_title, hero_sub)
    title_cy = 40 - 26  # title block starts here inside the band

    story = pymupdf.Story(html=body, user_css=CSS, archive=pymupdf.Archive(BASE))

    def rectfn(rect_num, filled):
        mediabox = pymupdf.Rect(0, 0, W, H)
        if rect_num == 0:
            rect = pymupdf.Rect(MARGIN_X, band_h + 20, W - MARGIN_X, BOTTOM)
        else:
            rect = pymupdf.Rect(MARGIN_X, TOP, W - MARGIN_X, BOTTOM)
        return mediabox, rect, None

    out = story.write_with_links(rectfn)
    if isinstance(out, pymupdf.Document):
        doc = out
    else:
        data = out.read() if hasattr(out, "read") else bytes(out)
        doc = pymupdf.open(stream=data, filetype="pdf")

    # ---- page 1 hero banner ----
    page = doc[0]
    page.draw_rect(pymupdf.Rect(0, 0, W, band_h), color=None, fill=NAVY)
    page.draw_rect(pymupdf.Rect(0, band_h, W, band_h + 3.4), color=None, fill=GOLD)
    page.insert_text((MARGIN_X + 6, 26), "SOCHSET   @sochsethofficial",
                     fontsize=8.5, fontname="hebo", color=(0.84, 0.69, 0.35))
    draw_hero(page, hero_title, hero_sub, 34)

    # ---- header / footer on the rest ----
    for i in range(1, doc.page_count):
        pg = doc[i]
        pg.insert_text((MARGIN_X, 34),
                       sanitize("SochSet  |  YouTube Upload Pack  -  Atomic Habits (Hindi)"),
                       fontsize=8, fontname="helv", color=MUTED)
        pg.draw_line(pymupdf.Point(MARGIN_X, 40), pymupdf.Point(W - MARGIN_X, 40),
                     color=RULE, width=0.7)
        pg.insert_text((W / 2 - 14, H - 26), f"Page {i + 1}",
                       fontsize=8, fontname="helv", color=MUTED)

    doc.save(OUT, deflate=True, garbage=3)
    print("PDF written:", OUT, round(os.path.getsize(OUT) / 1024, 1), "KB | pages:", doc.page_count)


if __name__ == "__main__":
    build()
