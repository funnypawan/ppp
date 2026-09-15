# -*- coding: utf-8 -*-
"""Builds top-100-self-improvement-books-hindi.pdf (Devanagari-safe, with bookmarks).

Run:  python3 tools/make_pdf.py
Needs: pip install fpdf2 uharfbuzz   (fonts are bundled in assets/fonts/)
"""
import os
import sys

from fpdf import FPDF
from fpdf.enums import MethodReturnValue, XPos, YPos

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_books import BOOKS, BONUS, CATEGORIES            # noqa: E402
from data_topics import PLAN, READING_RULES, TOPICS, WHERE_TO_READ  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_DIR = os.path.join(ROOT, "assets", "fonts")
OUT = os.path.join(ROOT, "top-100-self-improvement-books-hindi.pdf")

INK = (26, 32, 54)
MUTED = (108, 118, 148)
NAVY = (30, 46, 100)
NAVY_D = (20, 32, 72)
AMBER = (222, 150, 22)
AMBER_L = (255, 246, 224)
GREEN = (18, 132, 106)
BORDER = (203, 210, 228)
SOFT = (243, 246, 252)

TITLE = "टॉप 100 सेल्फ-इम्प्रूवमेंट किताबें"
SUBTITLE = "हिंदी गाइड — Rich Dad Poor Dad, Think and Grow Rich और Atomic Habits जैसी किताबें"


class Guide(FPDF):
    def __init__(self, pages_map=None):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_margins(16, 20, 16)
        self.set_auto_page_break(True, margin=20)
        self.set_title("टॉप 100 सेल्फ-इम्प्रूवमेंट किताबें (हिंदी गाइड)")
        self.set_author("सेल्फ-इम्प्रूवमेंट लाइब्रेरी")
        self.set_subject("टॉप 100 किताबें + 25 बोनस किताबें + 70 टॉपिक्स + 12 महीने का प्लान")
        self.set_keywords("self improvement, hindi, books, आदतें, पैसा, माइंडसेट")
        self.add_font("hi", "", os.path.join(FONT_DIR, "NotoSansDevanagari-Regular.ttf"))
        self.add_font("hi", "B", os.path.join(FONT_DIR, "NotoSansDevanagari-Bold.ttf"))
        self.set_text_shaping(True)
        self.pages_map = pages_map or {}
        self.sec = ""
        self.sec_no = ""
        self.record = {}

    # ---------------------------------------------------------------- chrome
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("hi", "", 7.6)
        self.set_text_color(*MUTED)
        self.set_xy(self.l_margin, 10)
        self.cell(self.epw * 0.62, 5, self.sec_no + self.sec, align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.cell(self.epw * 0.38, 5, TITLE + " · हिंदी", align="R", new_x=XPos.LMARGIN, new_y=YPos.TOP)
        self.set_draw_color(*BORDER)
        self.set_line_width(0.2)
        self.line(self.l_margin, 16.5, self.w - self.r_margin, 16.5)
        self.set_y(22)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.set_font("hi", "", 7.6)
        self.set_text_color(*MUTED)
        self.cell(self.epw * 0.7, 5, "प्रकाशक के हिसाब से हिंदी नाम थोड़े बदल सकते हैं — लेखक और मूल नाम से सही किताब मिलेगी।", align="L")
        self.cell(self.epw * 0.3, 5, "पेज " + str(self.page_no()), align="R")

    # --------------------------------------------------------------- helpers
    def font(self, style="", size=10, color=INK):
        self.set_font("hi", style, size)
        self.set_text_color(*color)

    def text_h(self, txt, w, style="", size=10):
        self.font(style, size)
        return self.multi_cell(w, size * 0.46 + 1.2, txt, dry_run=True, output=MethodReturnValue.HEIGHT)

    def para(self, txt, w=None, style="", size=10, color=INK, lh=None, align="L"):
        self.font(style, size, color)
        self.multi_cell(w or self.epw, lh or size * 0.46 + 1.2, txt, align=align,
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def bullet(self, label, body, size=9.6, gap=1.6):
        w = self.epw
        x = self.l_margin
        y = self.get_y()
        self.set_fill_color(*AMBER)
        self.rect(x + 1.2, y + 2.6, 1.8, 1.8, style="F")
        self.set_xy(x + 5, y)
        self.font("B", size)
        lw = self.get_string_width(label) + 1.2
        if lw < w * 0.42:
            self.cell(lw, size * 0.46 + 1.2, label, new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.set_xy(x + 5 + lw, y)
            self.font("", size, INK)
            self.multi_cell(w - 5 - lw, size * 0.46 + 1.2, body, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        else:
            self.multi_cell(w - 5, size * 0.46 + 1.2, label + " " + body,
                            new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(gap)

    def hr(self, y=None, color=BORDER):
        self.set_draw_color(*color)
        self.set_line_width(0.2)
        y = y if y is not None else self.get_y()
        self.line(self.l_margin, y, self.w - self.r_margin, y)

    def section(self, key, no, title, desc):
        self.add_page()
        self.sec, self.sec_no = title, no
        self.record[key] = self.page_no()
        self.start_section(no + " " + title, level=0)
        y = self.get_y()
        self.set_fill_color(*NAVY)
        self.rect(self.l_margin, y, self.epw, 15, style="F", round_corners=True, corner_radius=2.5)
        self.set_xy(self.l_margin + 5, y + 3.4)
        self.font("B", 15, (255, 255, 255))
        self.cell(self.epw - 10, 8, no + " " + title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_y(y + 19)
        self.para(desc, style="", size=9.8, color=MUTED)
        self.ln(2.5)

    # ------------------------------------------------------------- book card
    def book_card(self, b):
        w = self.epw
        x = self.l_margin
        badge = 11.0
        pad = 4.0
        tw = w - badge - pad * 2 - 3.5
        th = self.text_h(b["hi"], tw, "B", 12.4)
        eh = self.text_h(b["en"], tw, "", 9.8)
        ah = self.text_h("लेखक: " + b["au"], tw, "", 9.4)
        wh = self.text_h(b["why"], tw, "", 9.5)
        h = pad + th + 0.8 + eh + ah + 1.4 + wh + pad
        if self.get_y() + h > self.h - 22:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(*SOFT)
        self.set_draw_color(*BORDER)
        self.set_line_width(0.25)
        self.rect(x, y, w, h, style="DF", round_corners=True, corner_radius=2.5)
        # number badge
        self.set_fill_color(*AMBER)
        self.rect(x + pad - 1, y + pad - 0.6, badge, badge, style="F", round_corners=True, corner_radius=2)
        self.set_xy(x + pad - 1, y + pad + 1.4)
        self.font("B", 11, (255, 255, 255))
        self.cell(badge, 6, str(b["n"]), align="C")
        # text block
        tx = x + pad + badge + 3.5
        self.set_xy(tx, y + pad - 1.2)
        self.font("B", 12.4, NAVY_D)
        self.multi_cell(tw, th and 12.4 * 0.46 + 1.2, b["hi"], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(tx)
        self.font("", 9.8, GREEN)
        self.multi_cell(tw, 9.8 * 0.46 + 1.2, b["en"], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(tx)
        self.font("", 9.4, MUTED)
        self.multi_cell(tw, 9.4 * 0.46 + 1.2, "लेखक: " + b["au"], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(tx)
        self.ln(1.0)
        self.font("", 9.5, INK)
        self.multi_cell(tw, 9.5 * 0.46 + 1.2, b["why"], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_y(y + h + 3.2)

    # ------------------------------------------------------------- big table
    def table(self, headers, rows, widths, head_size=9.4, body_size=9.2):
        x0 = self.l_margin
        row_h = lambda txt, w, st, sz: self.text_h(txt, w - 4, st, sz) + 3  # noqa: E731
        # header
        if self.get_y() + 12 > self.h - 22:
            self.add_page()
        y = self.get_y()
        self.set_fill_color(*NAVY)
        self.rect(x0, y, self.epw, 9.5, style="F")
        cx = x0
        for i, hd in enumerate(headers):
            self.set_xy(cx + 2, y + 1.8)
            self.font("B", head_size, (255, 255, 255))
            self.cell(widths[i] - 4, 6, hd, new_x=XPos.RIGHT, new_y=YPos.TOP)
            cx += widths[i]
        self.set_y(y + 9.5)
        # rows
        for ri, row in enumerate(rows):
            hs = [row_h(c, widths[i], "B" if i == 0 else "", body_size) for i, c in enumerate(row)]
            rh = max(hs)
            if self.get_y() + rh > self.h - 22:
                self.add_page()
            y = self.get_y()
            if ri % 2 == 1:
                self.set_fill_color(*SOFT)
                self.rect(x0, y, self.epw, rh, style="F")
            self.set_draw_color(*BORDER)
            self.set_line_width(0.15)
            self.rect(x0, y, self.epw, rh, style="D")
            cx = x0
            for ci, w in enumerate(widths):
                if ci:
                    self.line(cx, y, cx, y + rh)
                self.set_xy(cx + 2, y + 1.4)
                self.font("B" if ci == 0 else "", body_size, INK if ci == 0 else (60, 68, 92))
                self.multi_cell(w - 4, body_size * 0.46 + 1.2, row[ci],
                                new_x=XPos.RIGHT, new_y=YPos.TOP)
                cx += w
            self.set_y(y + rh)
        self.ln(3)

    # ------------------------------------------------------------ static bits
    def cover(self):
        self.add_page()
        self.set_fill_color(*NAVY)
        self.rect(0, 0, self.w, 112, style="F")
        self.set_fill_color(*AMBER)
        self.rect(0, 112, self.w, 2.6, style="F")
        self.set_xy(16, 24)
        self.font("", 11.5, (255, 214, 140))
        self.cell(self.epw, 6, "सेल्फ-इम्प्रूवमेंट लाइब्रेरी · हिंदी गाइड", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_xy(16, 33)
        self.font("B", 30, (255, 255, 255))
        self.multi_cell(self.epw - 4, 15, TITLE, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1.5)
        self.set_x(16)
        self.font("", 10.5, (206, 216, 240))
        self.multi_cell(self.epw - 10, 6, SUBTITLE, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        y = 126
        stats = [("100", "टॉप किताबें"), ("25", "बोनस किताबें"), ("70", "टॉपिक्स"),
                 ("12", "महीने का प्लान"), ("9", "बड़े विषय")]
        bw = (self.epw - 4 * 4) / 5
        for i, (num, lab) in enumerate(stats):
            x = 16 + i * (bw + 4)
            self.set_fill_color(*AMBER_L)
            self.set_draw_color(*BORDER)
            self.rect(x, y, bw, 20, style="DF", round_corners=True, corner_radius=2)
            self.set_xy(x, y + 3)
            self.font("B", 15, NAVY_D)
            self.cell(bw, 7, num, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_xy(x, y + 11)
            self.font("", 8.2, MUTED)
            self.cell(bw, 5, lab, align="C")

        y = 158
        self.set_xy(16, y)
        self.font("B", 13, NAVY_D)
        self.cell(0, 7, "इस पीडीएफ़ में क्या है", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)
        items = [
            ("100 किताबें, 8 विषयों में", "पैसा · आदतें · माइंडसेट · उत्पादकता · करियर · रिश्ते · शांति · स्वास्थ्य — हर किताब के साथ हिंदी नाम, मूल अंग्रेज़ी नाम, लेखक और ‘क्यों पढ़ें’।"),
            ("25 बोनस किताबें", "डॉ. कलाम, शिव खेड़ा, अंकुर वारिकू, नवल रविकांत, रॉबिन शर्मा, टोनी रॉबिन्स जैसी भारतीय और विश्व-प्रसिद्ध किताबें।"),
            ("70 सेल्फ-इम्प्रूवमेंट टॉपिक", "बजट से लेकर ध्यान तक — किस चीज़ पर काम करना है, यह तय करने के लिए।"),
            ("12 महीने का प्लान", "महीने में 2 किताबें + 1 आदत ज़िंदगी में — साल भर की तैयार योजना।"),
            ("किताब से पूरा फ़ायदा", "पढ़ने के 8 नियम, हिंदी में किताबें कहाँ से लें, और 0 से शुरुआत करने वालों के लिए 10 सबसे आसान किताबें।"),
        ]
        for lab, body in items:
            self.bullet(lab + " —", body, size=9.8)

        self.set_y(self.h - 34)
        self.set_fill_color(*SOFT)
        self.set_draw_color(*BORDER)
        self.rect(16, self.h - 34, self.epw, 20, style="DF", round_corners=True, corner_radius=2)
        self.set_xy(19, self.h - 31.5)
        self.font("", 9.2, MUTED)
        self.multi_cell(self.epw - 6, 5.2,
                        "हिंदी नाम प्रकाशक के हिसाब से थोड़े बदल सकते हैं (जैसे Atomic Habits = \"छोटी आदतें, बड़े बदलाव\" / \"परमाणु आदतें\") — "
                        "लेखक और मूल नाम से आपको सही किताब मिल जाएगी। ऊपर बुकमार्क/आउटलाइन से सीधे किसी भी भाग पर जा सकते हैं।",
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def toc(self):
        self.add_page()
        self.sec, self.sec_no = "विषय-सूची", ""
        rows = [("भाग", "विषय", "किताबें/टॉपिक", "पेज")]
        for key, name, _icon, desc in CATEGORIES:
            nums = [b for b in BOOKS if b["cat"] == key]
            rows.append((name, desc, f"{nums[0]['n']}–{nums[-1]['n']}", str(self.pages_map.get(key, "—"))))
        rows.append(("बोनस किताबें", "अतिरिक्त शानदार किताबें (भारतीय + विश्व-प्रसिद्ध)",
                     f"{BONUS[0]['n']}–{BONUS[-1]['n']}", str(self.pages_map.get("bonus", "—"))))
        rows.append(("सेल्फ-इम्प्रूवमेंट टॉपिक्स", "9 हिस्सों में 70 टॉपिक — क्या-क्या सीखना है",
                     "70 टॉपिक", str(self.pages_map.get("topics", "—"))))
        rows.append(("12 महीने का प्लान", "पढ़ने और अमल करने की साल-भर की योजना",
                     "12 महीने", str(self.pages_map.get("plan", "—"))))
        rows.append(("किताब से पूरा फ़ायदा", "पढ़ने के 8 नियम, कहाँ से लें, शुरुआत की 10 किताबें",
                     "—", str(self.pages_map.get("rules", "—"))))
        widths = [self.epw * 0.24, self.epw * 0.50, self.epw * 0.14, self.epw * 0.12]
        self.set_y(30)
        self.set_xy(16, 30)
        self.font("B", 18, NAVY_D)
        self.cell(0, 10, "विषय-सूची", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)
        self.table(rows[0], rows[1:], widths, head_size=9.6, body_size=9.4)

        self.ln(2)
        self.font("B", 13.5, NAVY_D)
        self.cell(0, 8, "इस गाइड को कैसे इस्तेमाल करें", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)
        for lab, body in [
            ("1. पहले टॉपिक पढ़िए", "‘सेल्फ-इम्प्रूवमेंट टॉपिक्स’ वाला भाग देखिए और चुनिए कि इस साल आपको सबसे ज़रूरी किस चीज़ पर काम करना है — पैसा, आदत, सेहत, रिश्ते या मन।"),
            ("2. फिर विषय चुनिए", "उसी विषय की किताबें चुनिए। हर कार्ड पर ‘क्यों पढ़ें’ लिखा है, इससे पता चलेगा कि किताब आपके लिए है या नहीं।"),
            ("3. 12 महीने का प्लान अपनाइए", "महीने में 2 किताबें और 1 आदत। पूरा साल ख़त्म होते-होते 24 किताबें और 12 आदतें — यही असली बदलाव है।"),
            ("4. पढ़ने के बाद अमल कीजिए", "हर किताब से 1–3 चीज़ें चुनकर अगले 30 दिन लागू कीजिए। पढ़ना मक़सद नहीं, बदलाव मक़सद है।"),
        ]:
            self.bullet(lab, body, size=9.6)

    def end_note(self):
        self.sec, self.sec_no = "आख़िरी बात", ""
        self.add_page()
        self.record["rules"] = self.record.get("rules", self.page_no())
        self.set_y(40)
        self.font("B", 20, NAVY_D)
        self.multi_cell(self.epw, 12, "एक आख़िरी बात", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)
        self.para(
            "ज्ञान किताबों में नहीं, किताबों से निकले फैसलों में होता है। इस पूरी सूची में से अगर आप सिर्फ़ 5 किताबें पढ़कर "
            "उनसे सीखी हुई बातें रोज़ की ज़िंदगी में उतार पाएँ, तो यह गाइड अपना काम कर गई।",
            size=11.5)
        self.ln(4)
        for lab, body in [
            ("आज की शुरुआत", "इस पूरी सूची से 1 किताब और 1 आदत चुनिए — और आज ही पहला पेज पढ़ लीजिए।"),
            ("30 दिन बाद", "लिखकर देखिए कि क्या बदला — छोटे बदलाव ही सबसे बड़े साबित होते हैं।"),
            ("दूसरों के साथ बाँटिए", "जो सीखा वह किसी को सिखाइए — तभी वह ज्ञान अपना होता है।"),
        ]:
            self.bullet(lab + " —", body, size=10.4)
        self.ln(6)
        self.set_fill_color(*AMBER_L)
        self.set_draw_color(*AMBER)
        y = self.get_y()
        self.rect(self.l_margin, y, self.epw, 22, style="DF", round_corners=True, corner_radius=3)
        self.set_xy(self.l_margin + 4, y + 4)
        self.font("B", 12, NAVY_D)
        self.cell(0, 7, "पढ़ते रहिए, बढ़ते रहिए।", new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def build(pages_map=None):
    pdf = Guide(pages_map)
    pdf.cover()
    pdf.toc()

    for key, name, _icon, desc in CATEGORIES:
        pdf.section(key, "", name, desc)
        for b in [x for x in BOOKS if x["cat"] == key]:
            pdf.book_card(b)

    pdf.section("bonus", "", "बोनस किताबें (" + str(BONUS[0]["n"]) + "–" + str(BONUS[-1]["n"]) + ")",
                "टॉप-100 से बाहर, पर भारतीय पाठकों के लिए इतनी उपयोगी कि सूची में नाम न आना नाइंसाफ़ी होगी।")
    for b in BONUS:
        pdf.book_card(b)

    pdf.section("topics", "", "सेल्फ-इम्प्रूवमेंट के टॉपिक्स (क्या-क्या सीखना है)",
                "किताबें पढ़ने से ज़्यादा ज़रूरी है यह तय करना कि किस चीज़ पर काम करना है। हर हफ़्ते किसी एक टॉपिक पर ध्यान दीजिए।")
    for i, (group, items) in enumerate(TOPICS, 1):
        if pdf.get_y() + 24 > pdf.h - 24:
            pdf.add_page()
        pdf.font("B", 12.6, NAVY_D)
        pdf.multi_cell(pdf.epw, 8, str(i) + ". " + group, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(0.5)
        for t, d in items:
            pdf.bullet(t, d, size=9.5, gap=1.2)
        pdf.ln(2.5)

    pdf.section("plan", "", "12 महीने का पढ़ने और अमल करने का प्लान",
                "महीने में 2 किताबें — साल में 24 किताबें, और हर महीने एक आदत ज़िंदगी में।")
    rows = [(m, bk, ac) for m, bk, ac in PLAN]
    pdf.table(["महीना", "किताबें", "अमल (Action)"],
              rows, [pdf.epw * 0.15, pdf.epw * 0.43, pdf.epw * 0.42])

    pdf.section("rules", "", "किताब से पूरा फ़ायदा लेने के 8 नियम",
                "किताबें पढ़ने का तरीक़ा ही तय करता है कि ज्ञान कितना टिकेगा।")
    for i, (t, d) in enumerate(READING_RULES, 1):
        pdf.bullet(str(i) + ". " + t, d, size=9.8)

    pdf.add_page()
    pdf.font("B", 14, NAVY_D)
    pdf.multi_cell(pdf.epw, 9, "हिंदी में किताबें कहाँ से पढ़ें / सुनें", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)
    for t, d in WHERE_TO_READ:
        pdf.bullet(t, d, size=9.8)

    pdf.ln(4)
    pdf.font("B", 14, NAVY_D)
    pdf.multi_cell(pdf.epw, 9, "0 से शुरुआत: सबसे आसान 10 किताबें", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1.5)
    starter = [
        ("अमीर पिता, गरीब पिता", "पैसे की सोच बदलने के लिए"),
        ("छोटी आदतें, बड़े बदलाव", "रोज़ का सिस्टम बनाने के लिए"),
        ("जीत आपकी (शिव खेड़ा)", "भारतीय उदाहरणों में मोटिवेशन के लिए"),
        ("दोस्त बनाइए और लोगों को प्रभावित कीजिए", "लोगों से जुड़ने के लिए"),
        ("माइंडसेट", "हार और सीखने का नज़रिया बदलने के लिए"),
        ("सुबह 5 बजे का क्लब", "दिन की शुरुआत सुधारने के लिए"),
        ("डीप वर्क", "फ़ोकस और गहराई के लिए"),
        ("द अल्केमिस्ट", "सपनों और साहस के लिए (हल्की, एक बैठक में)"),
        ("हम क्यों सोते हैं", "नींद और ऊर्जा सुधारने के लिए"),
        ("अब की शक्ति", "तनाव और चिंता कम करने के लिए"),
    ]
    pdf.table(["#", "किताब", "किसलिए"],
              [(str(i), b, w) for i, (b, w) in enumerate(starter, 1)],
              [pdf.epw * 0.07, pdf.epw * 0.45, pdf.epw * 0.48])

    pdf.end_note()
    return pdf


def main():
    probe = build(None)
    probe.output(OUT)
    pm = dict(probe.record)

    final = build(pm)
    final.output(OUT)
    print("pages:", final.pages_count if hasattr(final, "pages_count") else final.page_no())
    print("sections:", pm)
    print("written:", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
