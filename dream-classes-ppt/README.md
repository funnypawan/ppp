# DREAM CLASSES KOTHWARA — Blackboard VVI Objective PPTX generator

Builds a 16:9 (1920×1080) blackboard-style coaching deck from an uploaded PDF of
objective questions.

## Pipeline
1. `build/extract_pdf.py <pdf> <outdir>` — renders every page to PNG and pulls the
   embedded text (checks Devanagari quality, flags OCR damage).
2. Questions are written to `build/content.json` (PDF wording, PDF option order,
   PDF numbering — nothing invented; answers only if the PDF prints them).
3. `build/main.py --previews` — lays out every slide, runs the automated QA
   checks, writes the PPTX + JPG previews.

## Design
* classroom blackboard background (procedural, subtle chalk texture)
* red banner + gold accents, white bold Devanagari questions
* gold labels (A)–(D) with per-option bordered cards
* branding: header (subject / chapter / 10th class badge),
  footer “Dream Classes Kothwara” + “Dream Sir”, mobile on title & last slide

## Hindi rendering
Text is shaped with HarfBuzz (correct conjuncts/matras) and every character is
resolved to a font that actually contains it — Devanagari → *Noto Sans
Devanagari*, Latin → *Poppins*, Greek/maths → *Noto Sans* / *Noto Sans Math*.
All four families are **embedded in the PPTX** (`ppt/fonts/*.fntdata`), so the
deck renders without tofu boxes (□□□□) even on devices with no Devanagari font.

## QA (`build/checks.py`, runs on every build)
outside-canvas shapes, line-wider-than-box, text-taller-than-box, missing
glyphs, text/text ink collisions, text crossing card borders.
