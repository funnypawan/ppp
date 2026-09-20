# -*- coding: utf-8 -*-
"""प्रिंट-योग्य प्रश्न-बैंक (Markdown) बनाता है — 100 प्रश्न + विकल्प + उत्तर व कारण।"""
import os
from questions import Q
L = ["A", "B", "C", "D"]
OUT = os.path.abspath(os.path.join('..', 'Biology_Ch1_100_MCQ_Question_Bank.md'))
o = ["# जैव विज्ञान • अध्याय 1 : जैव जगत (The Living World)\n",
     "**DREAM CLASSES KOTHWARA**  |  BY – DREAM SIR  |  100 वस्तुनिष्ठ प्रश्न (BSEB कक्षा 11 स्तर)\n",
     "> आधार-पाठ: NCERT कक्षा 11, अध्याय 1 — सभी प्रश्न एवं उत्तर पाठ्यपुस्तक के तथ्यों पर आधारित।\n",
     "---\n\n## प्रश्न-पत्र (1 – 100)\n"]
for i, (q, ops, a, e, vis, img, tag) in enumerate(Q, 1):
    o.append("**%d.** %s\n" % (i, q))
    for k, op in enumerate(ops):
        o.append("   - (%s) %s\n" % (L[k], op))
    o.append("\n")
o.append("---\n\n## उत्तर-कुंजी तथा कारण\n")
o.append("| प्र. | उत्तर | कारण |\n|---:|:---:|:---|\n")
for i, (q, ops, a, e, vis, img, tag) in enumerate(Q, 1):
    o.append("| %d | **(%s)** %s | %s |\n" % (i, L[a], ops[a], e))
o.append("\n---\n*तैयार: DREAM CLASSES KOTHWARA • BY – DREAM SIR*\n")
open(OUT, 'w', encoding='utf-8').write("".join(o))
print("written:", OUT, "| words:", len("".join(o).split()))
