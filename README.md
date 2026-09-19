# ppp

pppppppppppppppppp

## Dream Classes Kothwara — OMR Sheet (A4)

| File | Kya hai |
|---|---|
| `Dream-Classes-OMR-Sheet-A4.pdf` | Print-ready OMR sheet (A4 **landscape**) |
| `omr-sheet.html` | Wahi sheet browser me — kholo aur `Ctrl+P` se print karo |
| `omr-sheet-preview.png` | Preview image (150 dpi) |
| `omr-sheet-generator.py` | Sheet banane wali script — layout ke saare numbers (mm me) upar CONFIG me hain |

**Sheet me kya hai:** upar `DREAM CLASSES KOTHWARA` + `Mob. : 9708983294`, uske neeche
5 column × 20 question = **total 100 question**, har question ke bagal me **A B C D** ke 4 gole circle (bubble),
aur neeche Total Marks : 100 / Marks Obtained / Examiner's Sign.
Name / Roll No. / Date ki line **nahi** hai (chaaho to CONFIG me `SHOW_INFO_ROW = True` kar do).

**Print karne ka tarika:** paper size **A4**, layout **Landscape**, margins **None**, scale **100%**.

**Badalna ho to:** `omr-sheet-generator.py` me CONFIG section edit karo (institute ka naam, mobile,
`QUESTIONS`, `COLUMNS`, `OPTIONS`, `SHOW_INFO_ROW`, `BUBBLE_DIA`, font sizes — sab millimetre me)
aur chalao:

```bash
pip install reportlab
python3 omr-sheet-generator.py     # PDF + HTML dono dobara ban jayenge
```

Common tweaks:

* 20 question wali chhoti sheet → `QUESTIONS = 20` (per column 4 ho jayenge)
* 5th option (A B C D E) → `OPTIONS = ["A", "B", "C", "D", "E"]`
* Bubbles bade/chhote → `BUBBLE_DIA` (abhi 6.0 mm)
* Name / Roll No. / Date line wapas → `SHOW_INFO_ROW = True`
