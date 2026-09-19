# ppp

pppppppppppppppppp

## Dream Classes Kothwara — OMR Sheet (A4)

| File | Kya hai |
|---|---|
| `Dream-Classes-OMR-Sheet-A4.pdf` | Print-ready OMR sheet (A4 **landscape**) |
| `omr-sheet.html` | Wahi sheet browser me — kholo aur `Ctrl+P` se print karo |
| `omr-sheet-preview.png` | Preview image (150 dpi) |
| `omr-sheet-generator.py` | Sheet banane wali script — layout ke saare numbers (mm me) upar CONFIG me hain |

**Sheet me kya hai:** upar `DREAM CLASSES KOTHWARA` + `Mob. : 9708983294`, uske neeche Name / Roll No. / Date,
5 column × 4 question = **20 question**, har question ke bagal me **A B C D** ke 4 gole circle (bubble),
aur neeche Total Marks / Marks Obtained / Examiner's Sign.

**Print karne ka tarika:** paper size **A4**, layout **Landscape**, margins **None**, scale **100%**.

**Badalna ho to:** `omr-sheet-generator.py` me CONFIG section edit karo (institute ka naam, mobile,
`QUESTIONS`, `COLUMNS`, `OPTIONS`, `BUBBLE_DIA`, font sizes — sab millimetre me) aur chalاؤ:

```bash
pip install reportlab
python3 omr-sheet-generator.py     # PDF + HTML dono dobara ban jayenge
```
