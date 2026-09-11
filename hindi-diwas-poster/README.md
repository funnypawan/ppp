# हिंदी दिवस पोस्टर — Hindi Diwas Poster

A print-ready **हिंदी दिवस (Hindi Diwas, 14 September)** poster with a clean
tricolor design — cream antique-paper background, tricolor borders,
a medallion with **अ**, the slogan *«आओ हिंदी अपनाएँ, भारत को गौरव दिलाएँ!»*
and the historic line *१४ सितंबर १९४९ — हिंदी को राजभाषा का दर्जा मिला*.

## Files

| File | What it is |
|---|---|
| `hindi-diwas-poster.svg` | **Vector master** (2480 × 3508 = A4 @ 300 dpi). All text is converted to outlines, so it renders identically everywhere — no font installation needed. |
| `hindi-diwas-poster.pdf` | **Print-ready A4** (210 × 297 mm) single page, 300 dpi. Give this to a printer/print shop. |
| `hindi-diwas-poster-print-300dpi.png` | A4 @ 300 dpi raster (2480 × 3508). |
| `hindi-diwas-poster-1080x1528.png` | Web/social size for WhatsApp, Instagram, Facebook posts. |
| `hindi-diwas-story-1080x1920.png` | Status / Story / Reels size (9:16). |
| `hindi-diwas-story.svg` | Vector master of the story format. |

## Regenerating / editing

```bash
pip install -r requirements.txt          # uharfbuzz + fonttools (+ pillow for the PDF)
python poster.py                         # writes hindi_diwas_poster.svg + hindi_diwas_story.svg
npm i @resvg/resvg-js                    # one-time, for rasterising
node render.js hindi_diwas_poster.svg out.png 2480
```

Everything is drawn in `poster.py`: colours (`SAFFRON`, `GREEN`, `MAROON`, `INK` …),
all text lines, and the vertical rhythm of the layout are plain constants at the top —
change a string or a colour and re-run.

Why the two Python modules? `textpath.py` shapes every Hindi/Latin string with
**HarfBuzz** (correct Devanagari conjuncts, matras, chandrabindu and word spacing)
and converts glyphs to SVG paths with **fontTools**. That is the only reliable way to get
flawless Devanagari, because generic SVG renderers do not do Indic shaping.

## Fonts (bundled in `fonts/`, SIL Open Font License)

* **Rozha One** — the display face of *हिंदी दिवस*
* **Mukta** — ExtraBold / Bold / SemiBold / Medium / Regular for headings and body
* **Baloo 2** — ExtraBold, available for punchier headings
* **Tiro Devanagari Hindi** — reserved for formal/serif lines

## Printing tips

* Use the PDF or the SVG. Do **not** upscale a raster beyond 300 dpi.
* Standard trim **A4** (210 × 297 mm). The design is edge-to-edge; if your printer
  cannot print full bleed, print at "Fit to page".
* The thin outer keyline sits ~7 mm from the paper edge, so it survives small
  printer margins; if your printer crops more, use `Fit to page`.
