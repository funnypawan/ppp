# जैव जगत (The Living World) — 100 वस्तुनिष्ठ प्रश्न जनरेटर

DREAM CLASSES KOTHWARA — BY DREAM SIR के लिए तैयार किया गया स्लाइड-जनरेटर।
हर प्रश्न = 1 स्लाइड, विकल्प सहित, प्रश्न व विकल्प हिन्दी में।

**हर स्लाइड (1–100) के सबसे ऊपर** पूरी चौड़ाई की पट्टी में — लाइन 1 = **DREAM CLASSES KOTHWARA**,
ठीक उसके नीचे लाइन 2 = **BY DREAM SIR**। `qa.py` इसे हर स्लाइड पर जाँचता है
(NO-TOP-BANNER / BANNER-LINE1 / BANNER-LINE2)। 8 रंगीन थीम (gradient), बड़े अक्षरों वाला
सफ़ेद हेडर-टेक्स्ट, छोटे आरेख/चित्र और नीचे हर सही विकल्प हाइलाइट + संक्षिप्त कारण।

## फ़ाइलें
| फ़ाइल | काम |
|---|---|
| `questions.py` | 100 प्रश्न, 4 विकल्प, सही उत्तर, संक्षिप्त कारण, आरेख-कुंजी, विषय-टैग |
| `build.py` | PPTX बनाता है → `../Biology_Ch1_Jaiv_Jagat_100_MCQ_Dream_Classes.pptx` |
| `qa.py` | बनी PPTX की layout-जाँच (टेक्स्ट ओवरफ़्लो, स्लाइड-बाउन्ड्री, उत्तर-संगति) |
| `make_bank.py` | प्रिंट-योग्य प्रश्न-बैंक (Markdown) → `../Biology_Ch1_100_MCQ_Question_Bank.md` |
| `preview.py` | _wireframe_ पूर्वावलोकन (PIL) — लेआउट जाँच हेतु |
| `../assets/*.jpg` | 5 छोटे विषयगत चित्र (hero, herbarium, garden, museum, field) |

## चलाना
```bash
pip install --break-system-packages python-pptx pillow
python3 deck/questions.py     # 100 प्रश्न + लंबाई-जाँच
python3 deck/build.py         # PPTX (104 स्लाइड = title + 100 + 2 उत्तर-कुंजी + अन्तिम)
python3 deck/qa.py            # कोई समस्या नहीं आना चाहिए
python3 deck/make_bank.py     # प्रिंट-योग्य .md
```
नई स्लाइड/प्रश्न जोड़ने के लिए: `questions.py` की सूची में टपल जोड़ें
`(प्रश्न, [A,B,C,D], सही-अनुक्रमिका 0-3, कारण, आरेख, चित्र, टैग)` और `python3 build.py` चलाएँ।
उपलब्ध `आरेख` कुंजियाँ: `hierarchy, binomial, traits, growth, cell, family, table, five,
domain, herbarium, steps, garden, museum, key, aids` (`None` = बिना आरेख)।
उपलब्ध `चित्र` कुंजियाँ: `hero, herbarium, garden, museum, field`।

## नोट
- फ़ॉन्ट: सभी टेक्स्ट-runs पर `Nirmala UI` (latin+ea+cs) तथा `lang="hi-IN"` सेट है, इसलिए PowerPoint/
  Google Slides देवनागरी सही shape करेगा; फ़ॉन्ट न मिलने पर सिस्टम देवनागरी फ़ॉन्ट fallback होगा।
- "मानक हर्बेरियम शीट 41 × 29 से.मी." (प्र. 83) NCERT-पाठ का नहीं, बल्कि प्रयोगशाला-मानक तथ्य है;
  बोर्ड-परीक्षा की दृष्टि से प्रचलित है। शेष सभी तथ्य NCERT अध्याय 1 से सत्यापित।
