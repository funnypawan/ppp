#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make_tutorial_html.py — ek self-contained Hinglish tutorial page banata hai
(jisme animated dog live chalta hai). Chalao:

    python3 make_tutorial_html.py     ->  kaise-banaye.html

Kuch bhi internet/CDN se load nahi hota — file phone me bhi offline chalegi.
"""
import html
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SVG = os.path.join(HERE, "cute_dog_animated.svg")
OUT = os.path.join(HERE, "kaise-banaye.html")

STEPS = [
    ("1 · Character SVG banao (ya reuse karo)",
     "Har hissa ek alag &lt;g&gt; me ho, aur usse pehle ek &lt;!-- naam --&gt; comment. Bas itna kaafi hai — "
     "mera parser inhi comments se part ke naam banata hai (Head, Left Ear, Tail, Left Eye ...).",
     '<svg viewBox="0 0 200 240">\n  <!-- Tail -->\n  <path d="M 145 130 Q 170 120 175 90" stroke="#D4A574"\n        stroke-width="18" fill="none" stroke-linecap="round"/>\n  <!-- Left Eye -->\n  <circle cx="85" cy="70" r="6" fill="#333"/>\n</svg>'),
    ("2 · Motion = pivot + transform",
     "Animation ka poora raaz: kisi point (pivot) ke around rotate/scale karo aur use time ke saath badlo. "
     "SVG me ye ek line hai — values me last do number pivot (cx cy) hote hain.",
     '<animateTransform attributeName="transform" type="rotate"\n  values="-16 145 132; 16 145 132; -16 145 132"\n  dur="0.42s" repeatCount="indefinite"/>'),
    ("3 · Blink, breathing, mouth",
     "Blink = eye ko y-axis pe 0.08 tak squish. Breathing = body ko niche ke center se scale. "
     "Bark = mouth/tongue ko thoda neeche khicho. keyTimes se motion ka 'snap' aata hai.",
     '<!-- blink: 4.1s me ek baar, jaldi -->\n<animateTransform attributeName="transform" type="scale"\n  values="1 1;1 1;1 0.08;1 1;1 1"\n  keyTimes="0;0.40;0.45;0.50;1" dur="4.1s" repeatCount="indefinite"/>\n\n<!-- breathing: 0 100 225 = feet wala pivot -->\n<animateTransform attributeName="transform" type="scale"\n  values="1 1;1.03 0.97;1 1" dur="3.2s" repeatCount="indefinite"/>'),
    ("4 · Voiceover + caption",
     "Script ko scene me todo (mere hisaab se aapke 5.wav…13.wav bhi ek-scene-ek-file hain). "
     "Per scene ek clip export karo: mono, 44.1 kHz, RMS ≈ −20 dBFS, koi music stem ke andar nahi.",
     'ffmpeg -i voice_raw.wav -ac 1 -ar 44100 \\\n  -af "highpass=f=80,loudnorm=I=-19:TP=-1" \\\n  14.wav'),
    ("5 · Video me bake karo",
     "Frames -> MP4. Python script har frame par rig values recompute karti hai, isliye caption ka "
     "karaoke audio ki progress se sync rehta hai.",
     'python3 make_animation.py --all\n#  -> cute_dog_animation_9x16.mp4 (1080x1920, 30fps)\n#  -> cute_dog_animation_16x9.mp4 (blur-fill reflow)'),
]

RIG_TABLE = [
    ("Poonch hilana (happy)", "rotate", "-16 145 132; 16 145 132; -16 145 132", "0.42s"),
    ("Kan fadfadana", "rotate", "-9 70 18; 7 70 18; -9 70 18", "1.35s"),
    ("Sar hilana / tilt", "rotate", "-4 100 122; 4 100 122; -4 100 122", "2.6s"),
    ("Saans (breathing)", "scale", "1 1; 1.03 0.97; 1 1", "3.2s"),
    ("Palke jhapkana", "scale", "1 1; 1 1; 1 0.08; 1 1; 1 1", "4.1s"),
    ("Upar-neeche bounce", "translate", "0 0; 0 -26; 0 0", "1.6s"),
]


def page(svg_markup: str) -> str:
    steps_html = "\n".join(
        f'''<section class="card"><h2>{html.escape(t)}</h2><p>{txt}</p>
        <div class="code"><button class="copy" onclick="cp(this)">copy</button><pre>{html.escape(code)}</pre></div></section>'''
        for t, txt, code in STEPS)
    rows = "\n".join(
        f"<tr><td>{html.escape(a)}</td><td><code>{b}</code></td><td class='mono'>{html.escape(c)}</td><td><code>{d}</code></td></tr>"
        for a, b, c, d in RIG_TABLE)
    return f"""<!DOCTYPE html>
<html lang="hi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yeh animation kaise banegi — Sheru guide</title>
<style>
 :root {{ --bg:#0f1117; --card:#1a1d29; --bd:#2a2d3a; --gold:#ffd700; --teal:#00d4aa;
          --coral:#ff6b6b; --tx:#e8e8e8; --mut:#9ca3af; }}
 * {{ box-sizing:border-box; }}
 body {{ margin:0; background:linear-gradient(135deg,#0f1117,#1a1d29); color:var(--tx);
   font-family:'Nirmala UI','Noto Sans Devanagari','Mukta','Segoe UI',sans-serif; line-height:1.75; padding:18px; }}
 header {{ text-align:center; padding:26px 14px; border:1px solid var(--bd); border-radius:20px;
   background:linear-gradient(135deg,rgba(255,215,0,.10),rgba(0,212,170,.08)); margin-bottom:22px; }}
 h1 {{ margin:0 0 8px; font-size:clamp(1.5rem,5vw,2.4rem);
   background:linear-gradient(90deg,#ffd700,#00d4aa); -webkit-background-clip:text; background-clip:text; color:transparent; }}
 header p {{ margin:0; color:var(--mut); font-size:.95rem; }}
 .wrap {{ display:grid; gap:22px; grid-template-columns:1fr; max-width:1150px; margin:0 auto; }}
 @media(min-width:900px) {{ .wrap {{ grid-template-columns:minmax(280px,38%) 1fr; align-items:start; }} }}
 .stage {{ position:sticky; top:14px; border:1px solid var(--bd); border-radius:20px; overflow:hidden; background:#0f1117; }}
 .stage svg {{ display:block; width:100%; height:auto; }}
 .cap {{ padding:10px 14px; color:var(--mut); font-size:.85rem; border-top:1px solid var(--bd); }}
 .card {{ background:var(--card); border:1px solid var(--bd); border-radius:18px; padding:16px 18px; margin-bottom:16px; }}
 h2 {{ font-size:1.06rem; margin:0 0 8px; color:var(--gold); }}
 .code {{ position:relative; margin-top:10px; }}
 pre {{ background:#0b0d13; border:1px solid var(--bd); border-radius:12px; padding:12px 14px; overflow:auto;
   font:500 .8rem/1.6 ui-monospace,SFMono-Regular,Menlo,monospace; color:#d6e2ff; margin:0; }}
 .copy {{ position:absolute; top:8px; right:8px; background:rgba(255,215,0,.14); color:var(--gold);
   border:1px solid rgba(255,215,0,.35); border-radius:20px; padding:3px 12px; font-size:.75rem; cursor:pointer; }}
 .copy:active {{ transform:scale(.96); }}
 table {{ width:100%; border-collapse:collapse; font-size:.86rem; }}
 th,td {{ text-align:left; padding:8px 6px; border-bottom:1px solid var(--bd); vertical-align:top; }}
 th {{ color:var(--teal); font-weight:600; }}
 .mono {{ font:500 .78rem/1.5 ui-monospace,Menlo,monospace; color:#cbd5e1; word-break:break-all; }}
 .warn {{ border-left:4px solid var(--coral); background:rgba(255,107,107,.07); padding:12px 14px; border-radius:0 12px 12px 0; }}
 .tip {{ border-left:4px solid var(--teal); background:rgba(0,212,170,.07); padding:12px 14px; border-radius:0 12px 12px 0; }}
 footer {{ text-align:center; color:var(--mut); font-size:.8rem; margin:26px 0 8px; }}
</style></head><body>
<header>
  <h1>Sheru wali animation — kaise banegi</h1>
  <p>Right taraf wali jaan sirf SVG + 6 line ki animation hai. Neeche har step copy-paste ke saath.</p>
</header>
<div class="wrap">
  <div class="stage">
    {svg_markup}
    <div class="cap">Ye live SVG hai — scroll mat karo, bas dekho. Frame rate browser apne aap decide karta hai.</div>
  </div>
  <div>
    {steps_html}

    <section class="card">
      <h2>Value table — kya badloge to kya hoga</h2>
      <table><thead><tr><th>Motion</th><th>type</th><th>values (dx dy pivot)</th><th>dur</th></tr></thead>
      <tbody>{rows}</tbody></table>
      <p style="color:var(--mut);font-size:.85rem;margin-bottom:0">
      Rule of thumb: <b>0.4–0.5s</b> = excited/fast, <b>2.5–4s</b> = calm/loop. Ek loop me 3 values do
      (start; extreme; start) warna jump dikhega.</p>
    </section>

    <section class="card warn">
      <b>Hindi text toot raha hai?</b><br>
      CapCut/PIL me font me Devanagari shaping na ho to matra idhar-udhar chali jaati hai.
      Is repo me <code>animation/deva_text.py</code> HarfBuzz se khud shape karta hai
      (<code>PIL.features.check('raqm')</code> False hone par bhi chalega). Mobile me Bas
      <b>Mukta / Noto Sans Devanagari / Nirmala UI</b> font chuno — problem khatam.
    </section>

    <section class="card tip">
      <b>Phone-only route (bina Python)</b><br>
      1) Canva me character banao, parts alag PNG me export (head, ear, tail, eyes).
      2) CapCut → canvas 1080×1920 → image ko timeline me daalo → <b>Keyframe</b>:
      Rotation 0°→6°→0° (2.6s) head par; Scale Y 100%→8% (0.15s) eyes par = blink.
      3) Voiceover record/TTS → Auto captions → Music −18 dB + <i>audio ducking</i>.
      4) Export 1080×1920, 30 fps, H.264, 8–12 Mbps.
    </section>
  </div>
</div>
<script>
function cp(btn) {{
  const pre = btn.parentElement.querySelector('pre');
  navigator.clipboard.writeText(pre.innerText).then(() => {{
    btn.textContent = 'copied ✓'; setTimeout(() => btn.textContent = 'copy', 1400);
  }}).catch(() => {{ const r = document.createRange(); r.selectNode(pre); getSelection().removeAllRanges(); getSelection().addRange(r); }});
}}
</script>
<footer>ppp · animation/kaise-banaye.html · offline chalta hai · make_tutorial_html.py se regenerate</footer>
</body></html>
"""


def build():
    svg = open(SVG, encoding="utf-8").read()
    # strip the outer <svg ...> attrs width/height so it scales responsively inside the page
    import re
    svg = re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)
    open(OUT, "w", encoding="utf-8").write(page(svg))
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    build()
