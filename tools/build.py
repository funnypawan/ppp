# -*- coding: utf-8 -*-
"""Generates the Hindi markdown guide + searchable HTML page."""
import html
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data_books import BOOKS, BONUS, CATEGORIES          # noqa: E402
from data_topics import TOPICS, PLAN, READING_RULES, WHERE_TO_READ  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = {c[0]: c for c in CATEGORIES}

TITLE = "मेरी सेल्फ-इम्प्रूवमेंट लाइब्रेरी"
SUB = "टॉप 100 किताबें + 25 बोनस किताबें + सेल्फ-इम्प्रूवमेंट के टॉपिक्स (हिंदी में)"


# ----------------------------------------------------------------- markdown
def build_md():
    L = []
    a = L.append
    a(f"# {TITLE}")
    a("")
    a(f"**{SUB}**")
    a("")
    a("> यह गाइड उन लोगों के लिए है जिन्हें *Rich Dad Poor Dad*, *Think and Grow Rich*, *Atomic Habits* जैसी किताबें पसंद हैं।")
    a("> हर किताब के साथ हिंदी नाम, मूल अंग्रेज़ी नाम, लेखक और **क्यों पढ़ें** दिया गया है, ताकि आप अपने हिसाब से किताब चुन सकें।")
    a("")
    a("---")
    a("")
    a("## विषय-सूची")
    a("")
    a("| भाग | विषय | किताबें |")
    a("|---|---|---|")
    for key, name, _icon, desc in CATEGORIES:
        nums = [b for b in BOOKS if b["cat"] == key]
        a(f"| {name} | {desc} | {nums[0]['n']}–{nums[-1]['n']} |")
    a(f"| बोनस | अतिरिक्त शानदार किताबें (भारतीय + क्लासिक) | {BONUS[0]['n']}–{BONUS[-1]['n']} |")
    a("| टॉपिक्स | सेल्फ-इम्प्रूवमेंट के {n} टॉपिक, 8 बड़े हिस्सों में | — |".format(
        n=sum(len(t[1]) for t in TOPICS)))
    a("| प्लान | 12 महीने का पढ़ने + अमल करने का प्लान | — |")
    a("")
    a("---")
    a("")

    for key, name, _icon, desc in CATEGORIES:
        books = [b for b in BOOKS if b["cat"] == key]
        a(f"## {name} ({books[0]['n']}–{books[-1]['n']})")
        a("")
        a(f"*{desc}*")
        a("")
        a("| # | किताब (हिंदी) | मूल नाम | लेखक | क्यों पढ़ें |")
        a("|---|---|---|---|---|")
        for b in books:
            a(f"| {b['n']} | **{b['hi']}** | *{b['en']}* | {b['au']} | {b['why']} |")
        a("")

    a(f"## बोनस: {BONUS[0]['n']}–{BONUS[-1]['n']} — अतिरिक्त शानदार किताबें")
    a("")
    a("*ये टॉप-100 से बाहर हैं, पर भारतीय पाठकों के लिए इतनी उपयोगी हैं कि सूची में नाम न आना नाइंसाफ़ी होगी।*")
    a("")
    a("| # | किताब (हिंदी) | मूल नाम | लेखक | क्यों पढ़ें |")
    a("|---|---|---|---|---|")
    for b in BONUS:
        a(f"| {b['n']} | **{b['hi']}** | *{b['en']}* | {b['au']} | {b['why']} |")
    a("")
    a("---")
    a("")
    a("## सेल्फ-इम्प्रूवमेंट के टॉपिक्स (क्या-क्या सीखना चाहिए)")
    a("")
    a("किताबें पढ़ने से ज़्यादा ज़रूरी है यह तय करना कि **किस चीज़ पर काम करना है**। नीचे 8 बड़े हिस्सों में टॉपिक दिए हैं — हर हफ़्ते किसी एक पर ध्यान दीजिए।")
    a("")
    for i, (group, items) in enumerate(TOPICS, 1):
        a(f"### {i}. {group}")
        a("")
        for t, d in items:
            a(f"- **{t}** — {d}")
        a("")

    a("---")
    a("")
    a("## 12 महीने का पढ़ने और अमल करने का प्लान")
    a("")
    a("महीने में 2 किताबें — साल में 24 किताबें, और हर महीने एक आदत ज़िंदगी में।")
    a("")
    a("| महीना | किताबें | अमल (Action) |")
    a("|---|---|---|")
    for m, books, action in PLAN:
        a(f"| {m} | {books} | {action} |")
    a("")

    a("## किताब से पूरा फ़ायदा लेने के 8 नियम")
    a("")
    for i, (t, d) in enumerate(READING_RULES, 1):
        a(f"{i}. **{t}** — {d}")
    a("")

    a("## हिंदी में किताबें कहाँ से पढ़ें / सुनें")
    a("")
    for t, d in WHERE_TO_READ:
        a(f"- **{t}** — {d}")
    a("")

    a("## शुरुआत के लिए सबसे आसान 10 किताबें (अगर अभी 0 से शुरू कर रहे हैं)")
    a("")
    starter = [
        ("अमीर पिता, गरीब पिता", "पैसे की सोच बदलने के लिए"),
        ("छोटी आदतें, बड़े बदलाव", "रोज़ का सिस्टम बनाने के लिए"),
        ("जीत आपकी (शिव खेड़ा)", "भारतीय उदाहरणों में मोटिवेशन के लिए"),
        ("दोस्त बनाइए और लोगों को प्रभावित कीजिए", "लोगों से जुड़ने के लिए"),
        ("माइंडसेट", "हार और सीखने का नज़रिया बदलने के लिए"),
        ("सुबह 5 बजे का क्लब", "दिन की शुरुआत सुधारने के लिए"),
        ("डीप वर्क", "फ़ोकस और पढ़ाई-काम में गहराई के लिए"),
        ("द अल्केमिस्ट", "सपनों और साहस के लिए (हल्की, एक बैठक में)"),
        ("हम क्यों सोते हैं", "नींद और ऊर्जा सुधारने के लिए"),
        ("अब की शक्ति", "तनाव और चिंता कम करने के लिए"),
    ]
    a("| # | किताब | किसलिए |")
    a("|---|---|---|")
    for i, (b, w) in enumerate(starter, 1):
        a(f"| {i} | **{b}** | {w} |")
    a("")
    a("---")
    a("")
    a("*हिंदी नाम प्रकाशक के हिसाब से थोड़े बदल सकते हैं (जैसे Atomic Habits = \"छोटी आदतें, बड़े बदलाव\" / \"परमाणु आदतें\"), लेखक और मूल नाम से आपको सही किताब मिल जाएगी।*")
    a("")
    return "\n".join(L) + "\n"


# --------------------------------------------------------------------- html
def esc(s):
    return html.escape(s, quote=True)


def build_html():
    cats_js = json.dumps([
        {"id": c[0], "name": c[1], "icon": c[2], "desc": c[3]} for c in CATEGORIES
    ], ensure_ascii=False)
    books_js = json.dumps([
        {"n": b["n"], "cat": b["cat"], "hi": b["hi"], "en": b["en"], "au": b["au"], "why": b["why"]}
        for b in BOOKS
    ], ensure_ascii=False)
    bonus_js = json.dumps([
        {"n": b["n"], "cat": "bonus", "hi": b["hi"], "en": b["en"], "au": b["au"], "why": b["why"]}
        for b in BONUS
    ], ensure_ascii=False)
    topics_js = json.dumps([
        {"group": g, "items": [{"t": t, "d": d} for t, d in items]} for g, items in TOPICS
    ], ensure_ascii=False)
    plan_js = json.dumps([
        {"m": m, "b": b, "a": a} for m, b, a in PLAN
    ], ensure_ascii=False)

    topic_count = sum(len(t[1]) for t in TOPICS)

    return f"""<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(TITLE)} — 100 किताबें + {topic_count} टॉपिक्स</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg:#0b1020; --bg2:#121a33; --card:#161f3d; --card2:#1c2750;
    --line:#2a3765; --txt:#eef2ff; --mut:#a9b6e0; --acc:#ffc107; --acc2:#41d1a7; --pink:#ff7ab2;
  }}
  * {{ box-sizing:border-box; }}
  body {{
    margin:0; background:radial-gradient(1200px 700px at 15% -10%, #1b2a5e 0%, var(--bg) 55%) fixed;
    color:var(--txt); font-family:'Noto Sans Devanagari',system-ui,'Segoe UI',Mangal,sans-serif;
    line-height:1.75; -webkit-font-smoothing:antialiased;
  }}
  .wrap {{ max-width:1180px; margin:0 auto; padding:28px 18px 80px; }}
  header.hero {{
    background:linear-gradient(135deg, rgba(255,193,7,.14), rgba(65,209,167,.10) 60%, transparent);
    border:1px solid var(--line); border-radius:22px; padding:28px 26px; margin-bottom:22px;
  }}
  h1 {{ font-size:clamp(24px,4.2vw,40px); margin:0 0 6px; line-height:1.35; }}
  h1 span {{ color:var(--acc); }}
  .sub {{ color:var(--mut); margin:0; font-size:16px; }}
  .stats {{ display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; }}
  .stat {{ background:var(--card); border:1px solid var(--line); border-radius:14px; padding:10px 14px; font-size:14px; }}
  .stat b {{ color:var(--acc2); font-size:20px; display:block; line-height:1.2; }}
  .controls {{ position:sticky; top:0; z-index:20; background:rgba(11,16,32,.92); backdrop-filter:blur(10px);
    padding:14px 0 10px; border-bottom:1px solid var(--line); margin-bottom:20px; }}
  .searchrow {{ display:flex; gap:10px; flex-wrap:wrap; }}
  input[type=search] {{
    flex:1 1 260px; min-width:0; background:var(--card); border:1px solid var(--line); color:var(--txt);
    padding:13px 16px; border-radius:14px; font:inherit; font-size:16px; outline:none;
  }}
  input[type=search]:focus {{ border-color:var(--acc); box-shadow:0 0 0 3px rgba(255,193,7,.15); }}
  .chips {{ display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }}
  .chip {{
    background:var(--card); border:1px solid var(--line); color:var(--mut); padding:8px 13px;
    border-radius:999px; cursor:pointer; font:inherit; font-size:14px; transition:.15s;
  }}
  .chip:hover {{ border-color:var(--acc); color:var(--txt); }}
  .chip.on {{ background:var(--acc); color:#1a1300; border-color:var(--acc); font-weight:600; }}
  .count {{ color:var(--mut); font-size:13px; margin-top:10px; }}
  h2 {{ font-size:clamp(19px,2.6vw,26px); margin:46px 0 6px; padding-top:10px; }}
  h2 .num {{ color:var(--pink); font-size:15px; font-weight:600; display:block; letter-spacing:.4px; }}
  .catdesc {{ color:var(--mut); margin:0 0 16px; font-size:15px; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }}
  .book {{
    background:linear-gradient(180deg,var(--card),var(--bg2)); border:1px solid var(--line);
    border-radius:18px; padding:16px 17px; position:relative; transition:.18s;
  }}
  .book:hover {{ transform:translateY(-3px); border-color:var(--acc); box-shadow:0 12px 30px rgba(0,0,0,.35); }}
  .book .no {{
    position:absolute; top:14px; right:14px; font-size:13px; font-weight:700; color:#1a1300;
    background:var(--acc); border-radius:8px; padding:2px 9px;
  }}
  .book h3 {{ margin:0 26px 2px 0; font-size:18px; line-height:1.45; }}
  .book .en {{ color:var(--acc2); font-size:13.5px; font-style:italic; display:block; margin-bottom:2px; }}
  .book .au {{ color:var(--mut); font-size:13.5px; display:block; margin-bottom:9px; }}
  .book .why {{ margin:0; font-size:14.5px; color:#dbe3ff; }}
  .book .tag {{ display:inline-block; font-size:11.5px; color:var(--mut); border:1px solid var(--line);
    border-radius:999px; padding:1px 9px; margin-top:11px; }}
  .empty {{ color:var(--mut); padding:40px 0; text-align:center; }}
  table {{ width:100%; border-collapse:collapse; margin-top:14px; font-size:14.5px; }}
  th, td {{ border:1px solid var(--line); padding:10px 12px; text-align:left; vertical-align:top; }}
  th {{ background:var(--card2); font-size:14px; }}
  tbody tr:nth-child(even) {{ background:rgba(255,255,255,.02); }}
  .topics {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:14px; margin-top:18px; }}
  .tgroup {{ background:var(--card); border:1px solid var(--line); border-radius:18px; padding:16px 18px; }}
  .tgroup h3 {{ margin:0 0 10px; font-size:17px; color:var(--acc); }}
  .tgroup ul {{ margin:0; padding-left:18px; }}
  .tgroup li {{ margin-bottom:9px; font-size:14.5px; }}
  .tgroup li b {{ color:#fff; }}
  .rules li {{ margin-bottom:9px; }}
  footer {{ color:var(--mut); font-size:13px; border-top:1px solid var(--line); margin-top:50px; padding-top:18px; }}
  @media print {{
    body {{ background:#fff; color:#000; }}
    .controls, header.hero .stats {{ display:none; }}
    .book, .tgroup, table, th, td {{ border-color:#bbb; background:#fff; color:#000; }}
    .book h3, .book .why, .tgroup li, .tgroup li b {{ color:#000; }}
  }}
</style>
</head>
<body>
<div class="wrap">

  <header class="hero">
    <h1>मेरी <span>सेल्फ-इम्प्रूवमेंट लाइब्रेरी</span></h1>
    <p class="sub">Rich Dad Poor Dad, Think and Grow Rich और Atomic Habits जैसी <b>टॉप 100 किताबें</b> + 25 बोनस किताबें + सेल्फ-इम्प्रूवमेंट के {topic_count} टॉपिक्स — पूरी हिंदी में।</p>
    <div class="stats">
      <div class="stat"><b>100</b>टॉप किताबें</div>
      <div class="stat"><b>25</b>बोनस किताबें</div>
      <div class="stat"><b>{topic_count}</b>टॉपिक्स</div>
      <div class="stat"><b>12</b>महीने का प्लान</div>
      <div class="stat"><b>8</b>बड़े विषय</div>
    </div>
  </header>

  <div class="controls">
    <div class="searchrow">
      <input type="search" id="q" placeholder="किताब, लेखक या विषय खोजिए… (जैसे: आदत, पैसा, जेम्स क्लियर)" autocomplete="off">
    </div>
    <div class="chips" id="chips"></div>
    <div class="count" id="count"></div>
  </div>

  <main id="list"></main>

  <h2 id="topics"><span class="num">क्या-क्या सीखना है</span>सेल्फ-इम्प्रूवमेंट के टॉपिक्स</h2>
  <p class="catdesc">किताबें पढ़ने से ज़्यादा ज़रूरी है यह तय करना कि <b>किस चीज़ पर काम करना है</b>। हर हफ़्ते किसी एक टॉपिक पर ध्यान दीजिए।</p>
  <div class="topics" id="topicsbox"></div>

  <h2 id="plan"><span class="num">साल भर की योजना</span>12 महीने का पढ़ने + अमल करने का प्लान</h2>
  <p class="catdesc">महीने में 2 किताबें = साल में 24 किताबें, और हर महीने एक आदत ज़िंदगी में।</p>
  <table id="plantable"><thead><tr><th>महीना</th><th>किताबें</th><th>अमल (Action)</th></tr></thead><tbody></tbody></table>

  <h2><span class="num">असर कैसे लें</span>किताब से पूरा फ़ायदा लेने के 8 नियम</h2>
  <ol class="rules">
    {"".join(f"<li><b>{esc(t)}</b> — {esc(d)}</li>" for t, d in READING_RULES)}
  </ol>

  <h2><span class="num">कहाँ से लें</span>हिंदी में किताबें कहाँ से पढ़ें / सुनें</h2>
  <ul class="rules">
    {"".join(f"<li><b>{esc(t)}</b> — {esc(d)}</li>" for t, d in WHERE_TO_READ)}
  </ul>

  <h2><span class="num">0 से शुरुआत</span>सबसे आसान 10 किताबें</h2>
  <table><thead><tr><th>#</th><th>किताब</th><th>किसलिए</th></tr></thead><tbody>
  {"".join(f"<tr><td>{i}</td><td><b>{esc(t)}</b></td><td>{esc(w)}</td></tr>" for i, (t, w) in enumerate([
      ("अमीर पिता, गरीब पिता", "पैसे की सोच बदलने के लिए"),
      ("छोटी आदतें, बड़े बदलाव", "रोज़ का सिस्टम बनाने के लिए"),
      ("जीत आपकी (शिव खेड़ा)", "भारतीय उदाहरणों में मोटिवेशन के लिए"),
      ("दोस्त बनाइए और लोगों को प्रभावित कीजिए", "लोगों से जुड़ने के लिए"),
      ("माइंडसेट", "हार और सीखने का नज़रिया बदलने के लिए"),
      ("सुबह 5 बजे का क्लब", "दिन की शुरुआत सुधारने के लिए"),
      ("डीप वर्क", "फ़ोकस और पढ़ाई-काम में गहराई के लिए"),
      ("द अल्केमिस्ट", "सपनों और साहस के लिए (हल्की, एक बैठक में)"),
      ("हम क्यों सोते हैं", "नींद और ऊर्जा सुधारने के लिए"),
      ("अब की शक्ति", "तनाव और चिंता कम करने के लिए"),
  ], 1))}
  </tbody></table>

  <footer>
    📄 <b>PDF संस्करण:</b> <a href="top-100-self-improvement-books-hindi.pdf" style="color:#ffc107">top-100-self-improvement-books-hindi.pdf</a> (34 पेज, बुकमार्क के साथ) · यह पेज भी Ctrl+P से PDF बन सकता है।<br>
    हिंदी नाम प्रकाशक के हिसाब से थोड़े बदल सकते हैं (जैसे Atomic Habits = "छोटी आदतें, बड़े बदलाव" / "परमाणु आदतें") — लेखक और मूल नाम से सही किताब मिल जाएगी।
    यह पेज पूरी तरह ऑफ़लाइन काम करता है; Ctrl+P से PDF बना सकते हैं।
  </footer>
</div>

<script>
const CATS = {cats_js};
const BOOKS = {books_js}.concat({bonus_js});
const TOPICS = {topics_js};
const PLAN = {plan_js};

const listEl = document.getElementById('list');
const chipsEl = document.getElementById('chips');
const countEl = document.getElementById('count');
const qEl = document.getElementById('q');
let active = 'all';

function norm(s) {{ return (s || '').toString().toLowerCase(); }}

function chip(id, label) {{
  const b = document.createElement('button');
  b.className = 'chip' + (id === active ? ' on' : '');
  b.dataset.id = id;
  b.textContent = label;
  b.onclick = () => {{ active = id; render(); document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.id === id)); }};
  return b;
}}

function renderChips() {{
  chipsEl.innerHTML = '';
  const all = BOOKS.length;
  chipsEl.appendChild(chip('all', 'सभी (' + all + ')'));
  CATS.forEach(c => chipsEl.appendChild(chip(c.id, c.icon + ' ' + c.name)));
  chipsEl.appendChild(chip('bonus', '★ बोनस किताबें ({BONUS[0]['n']}–{BONUS[-1]['n']})'));
}}

function bookCard(b) {{
  const cat = (CATS.find(c => c.id === b.cat) || {{name: 'बोनस किताबें', icon: '★'}});
  const d = document.createElement('article');
  d.className = 'book';
  d.innerHTML = '<span class="no">' + b.n + '</span>' +
    '<h3>' + b.hi + '</h3>' +
    '<span class="en">' + b.en + '</span>' +
    '<span class="au">✍ ' + b.au + '</span>' +
    '<p class="why">' + b.why + '</p>' +
    '<span class="tag">' + cat.icon + ' ' + cat.name + '</span>';
  return d;
}}

function render() {{
  const q = norm(qEl.value).trim();
  const words = q ? q.split(/\\s+/) : [];
  const groups = new Map();
  let shown = 0;

  BOOKS.forEach(b => {{
    if (active !== 'all' && b.cat !== active) return;
    const hay = norm(b.hi + ' ' + b.en + ' ' + b.au + ' ' + b.why + ' ' + b.n);
    if (words.some(w => !hay.includes(w))) return;
    shown++;
    if (!groups.has(b.cat)) groups.set(b.cat, []);
    groups.get(b.cat).push(b);
  }});

  listEl.innerHTML = '';
  CATS.forEach(c => {{
    if (!groups.has(c.id)) return;
    const sec = document.createElement('section');
    sec.innerHTML = '<h2><span class="num">किताबें ' + groups.get(c.id)[0].n + '–' + groups.get(c.id)[groups.get(c.id).length - 1].n + '</span>' + c.icon + ' ' + c.name + '</h2><p class="catdesc">' + c.desc + '</p>';
    const grid = document.createElement('div');
    grid.className = 'grid';
    groups.get(c.id).forEach(b => grid.appendChild(bookCard(b)));
    sec.appendChild(grid);
    listEl.appendChild(sec);
  }});
  if (groups.has('bonus')) {{
    const sec = document.createElement('section');
    sec.innerHTML = '<h2><span class="num">बोनस</span>★ अतिरिक्त शानदार किताबें</h2><p class="catdesc">टॉप-100 से बाहर, पर भारतीय पाठकों के लिए बेहद उपयोगी।</p>';
    const grid = document.createElement('div');
    grid.className = 'grid';
    groups.get('bonus').forEach(b => grid.appendChild(bookCard(b)));
    sec.appendChild(grid);
    listEl.appendChild(sec);
  }}
  if (!shown) listEl.innerHTML = '<p class="empty">कोई किताब नहीं मिली — दूसरा शब्द आज़माइए (जैसे: पैसा, आदत, रिश्ते, नींद)।</p>';
  countEl.textContent = shown + ' किताबें दिख रही हैं · कुल ' + BOOKS.length + ' किताबें · {topic_count} टॉपिक्स';
}}

qEl.addEventListener('input', render);

const tb = document.querySelector('#plantable tbody');
PLAN.forEach(p => {{
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><b>' + p.m + '</b></td><td>' + p.b + '</td><td>' + p.a + '</td>';
  tb.appendChild(tr);
}});

const tbox = document.getElementById('topicsbox');
TOPICS.forEach((g, i) => {{
  const d = document.createElement('div');
  d.className = 'tgroup';
  d.innerHTML = '<h3>' + (i + 1) + '. ' + g.group + '</h3><ul>' +
    g.items.map(it => '<li><b>' + it.t + '</b> — ' + it.d + '</li>').join('') + '</ul>';
  tbox.appendChild(d);
}});

renderChips();
render();
</script>
</body>
</html>
"""


def main():
    md = build_md()
    with open(os.path.join(ROOT, "top-100-self-improvement-books-hindi.md"), "w", encoding="utf-8") as f:
        f.write(md)
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(build_html())
    print("books:", len(BOOKS), "bonus:", len(BONUS), "topics:", sum(len(t[1]) for t in TOPICS))
    print("md chars:", len(md))


if __name__ == "__main__":
    main()
