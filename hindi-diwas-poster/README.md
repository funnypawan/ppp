# हिंदी दिवस पोस्टर — Hindi Diwas Poster

A print-ready **हिंदी दिवस (14 September)** poster. Two designs are included:

| Design | Look | Generator |
|---|---|---|
| **MODERN** ⭐ *(competition pick)* | Clean minimal, editorial, huge type over an **India map in tricolour**, black slogan band | `poster2.py` |
| Classic | Traditional tricolour, cream paper, medallion, ornate frame | `poster.py` |

The **modern** set is the strong one for a school competition: poster-quality layout,
correct historical facts, and it prints clean at any size because it is vector.

---

## 📁 Modern design (recommended)

| File | Use |
|---|---|
| `hindi-diwas-poster-modern-A4.pdf` | **A4 print (210 × 297 mm), 300 dpi** — normal printer |
| `hindi-diwas-poster-modern-A3.pdf` | **A3 print (297 × 420 mm), 300 dpi** — bigger, judges-friendly |
| `hindi-diwas-poster-modern.svg` | **Vector master** — infinite size, text outlined |
| `hindi-diwas-poster-modern-A4-300dpi.png` | 2480 × 3508 raster |
| `hindi-diwas-poster-modern-A3-300dpi.png` | 3508 × 4962 raster |
| `hindi-diwas-poster-modern-1080x1350.png` | Instagram / Facebook 4:5 post |
| `hindi-diwas-story-modern-1080x1920.png` + `.svg` | WhatsApp status / Instagram story |

**Content on the modern poster**

* Kicker: `HINDI DIWAS` / `१४ सितंबर`
* Big display title: **हिंदी दिवस**
* Headline: **हमारी भाषा, हमारी पहचान।**
* Hero: **India map filled with the tricolour + Ashoka Chakra**, state boundaries drawn in paper-white, heavy ink outline
* Fact strip: *१४ सितंबर १९४९ — संविधान सभा ने हिंदी को संघ की राजभाषा के रूप में अपनाया।*
* Sub-line: *अनुच्छेद ३४३ • २६ जनवरी १९५० से लागू* and
  *इसी दिन हिंदी के पक्षधर बेओहर राजेंद्र सिंहा का जन्मदिन भी मनाया जाता है।*
* Slogan band: **आओ हिंदी अपनाएँ, भारत को गौरव दिलाएँ!**

### Facts — checked

* Hindi (Devanagari script) was adopted as the official language of the Union by the
  **Constituent Assembly on 14 September 1949** — the resolution followed the
  Munshi–Ayyangar formula, which kept English as an associate official language
  for 15 years.
* It became part of **Article 343** of the Constitution, which came into force on
  **26 January 1950**.
* 14 September is also the **birth anniversary of Beohar Rajendra Simha**, a Hindi
  literary advocate and illustrator of the original Constitution manuscript.
* Hindi Diwas has been officially observed since **1953**.

---

## 📁 Classic design

`hindi-diwas-poster.pdf` (A4 print) · `hindi-diwas-poster.svg` (vector) ·
`hindi-diwas-poster-print-300dpi.png` · `hindi-diwas-poster-1080x1528.png` ·
`hindi-diwas-story-1080x1920.png` (+ `.svg`)

---

## Regenerating / editing

```bash
pip install -r requirements.txt        # uharfbuzz + fonttools (+ pillow, for the PDF)
python poster2.py                      # modern design  -> hindi_diwas_modern*.svg
python poster.py                       # classic design -> hindi_diwas_poster.svg

npm i @resvg/resvg-js                  # one-time, for rasterising
node render.js hindi_diwas_modern.svg out.png 2480        # full A4 raster
python makepdf.py modern_A4.png out.pdf a4                # wrap into a print PDF
```

Everything lives in `poster2.py` / `poster.py` as plain constants — colours
(`SAFFRON`, `GREEN`, `INK`, `NAVY` …), every text line, and the vertical rhythm.
Change a string, re-run, re-render.

**Why two Python modules?** `textpath.py` shapes each Hindi/Latin string with
**HarfBuzz** (correct Devanagari conjuncts, matras, chandrabindu, word spacing) and
turns glyphs into SVG paths with **fontTools**. Generic SVG/PDF text engines do not
shape Indic scripts, so this is the only reliable way to get flawless Devanagari.

## Fonts (bundled in `fonts/`, SIL Open Font License)

| Font | Where it is used |
|---|---|
| **Khand** Bold / SemiBold / Medium | modern display type (हिंदी दिवस, slogan) |
| **Hind** Regular / SemiBold | modern body & fact text |
| **Mukta** | classic poster body |
| **Rozha One** | classic poster title |
| **Baloo 2**, **Tiro Devanagari Hindi**, **Yatra One**, **Kalam** | alternates, ready to use |

## India map data

`india_map.json` is the state-wise India map (36 states/UTs) from the
[`svg-maps/india`](https://www.npmjs.com/package/svg-maps/india) package, licensed
**CC-BY 4.0** — see `MAP-LICENSE.md`. It is used only to draw the country shape and
state boundaries; the poster itself is original artwork.

## Printing tips

* Use the **PDF** or the **SVG** — never upscale a raster beyond 300 dpi.
* The modern design is edge-to-edge. If your printer has margins, print **“Fit to page”**.
* For a school display, **A3** reads much better from a distance — the SVG/A3 PDF scales
  to any bigger size (A2, A1) without quality loss.
