# Sheru Animation — kaise bani, aur aap khud kaise banaoge

Repo: `ppp/animation/` · ye guide Hinglish me hai taaki seedha follow ho sake.

---

## 0. Pehle ek honest baat

Aapka Google Drive link is sandbox se **khul nahi raha** (`drive.google.com` /
`drive.usercontent.google.com` par TLS hi block hai, `gdown` se bhi try kiya).
Isliye main aapki video *dekh* nahi paaya. To maine wo kiya jo repo me mojood tha —
aapke **9 narration stems** (`5.wav … 13.wav`) aur **Hindi guide**
(`top-100-self-improvement-books.html`) ko analyze karke format reverse-engineer kiya,
aur **wahi format** me ek nayi animation bana di: `animation/cute_dog_animation_9x16.mp4`
(+ 16:9 version).

Agar aap video file ko chat me attach kar denge (ya YouTube/any non-Google public link
denge), main exact copy — same transitions, same fonts, same timing — bana dunga.

---

## 1. Aapke stems ka analysis (maine ye numbers se nikala)

| File | Duration | Sample rate | Peak | RMS | Speech ratio | Median gap | 99.5% energy band |
|---|---|---|---|---|---|---|---|
| 5.wav | 31.2 s | 44.1 kHz mono | 0.877 | −19.9 dBFS | 74% | 0.27 s | 9.0 kHz |
| 6.wav | 62.3 s | 44.1 kHz mono | 0.857 | −20.1 | 74% | 0.25 | 9.8 kHz |
| 7.wav | 52.5 s | 44.1 kHz mono | 0.851 | −20.7 | 77% | 0.29 | 9.2 kHz |
| 8.wav | 90.6 s | 44.1 kHz mono | 0.912 | −19.8 | 77% | 0.22 | 9.7 kHz |
| 9.wav | 105.1 s | 44.1 kHz mono | 0.930 | −19.5 | 76% | 0.34 | 9.7 kHz |
| 10.wav | 62.2 s | 44.1 kHz mono | 0.882 | −18.1 | 76% | 0.26 | 11.1 kHz |
| 11.wav | 145.9 s | 44.1 kHz mono | 0.918 | −19.5 | 75% | 0.32 | 9.7 kHz |
| 12.wav | 91.4 s | 44.1 kHz mono | 0.885 | −20.3 | 76% | 0.35 | 10.2 kHz |
| 13.wav | 25.0 s | 44.1 kHz mono | 0.805 | −19.8 | 76% | 0.26 | 8.9 kHz |

**Isse jo format ka pata chala:**

1. **Ek scene = ek WAV**, numbered sequence me (5…13). Total ~11 min content.
2. **Voice-only stems** — 60 Hz se neeche energy ~0.00% matlab background music stems ke
   *andar nahi* hai; music editor me alag se layer kiya jaata hai.
3. **AI voice**: energy 99.5% tak ~9–11 kHz me band hai (real mic recording 16–20 kHz tak
   jaati hai) → neural TTS output jo **22–24 kHz source se 44.1 kHz me upsample** kiya gaya.
4. **Rough normalize, no mastering**: peak 0.85–0.93, RMS ≈ −20 dBFS, clipping 0%, koi limiter
   nahi. Final video me loudness −14 dBFS jaisi expected hoti hai.
5. **Bolchaal**: speech ratio ~76%, median pause 0.25–0.35 s, max pause 1.3–2.7 s
   → paragraph-level script, pauses already built-in (editor me cutting minimal).
6. **No metadata chunks** (RIFF me sirf `fmt ` + `data`) → tool ne export karte waqt tag strip kiya.

Meri bani hui video ne **yahi format copy kiya**: narration alag stems (mono, 44.1 kHz),
voice RMS −19.5 dBFS, scene ke beech 0.45 s kaans, music master mix me (stem me nahi).
Aur numbering aage badha di: **`14.wav … 21.wav`** repo root me parde.

---

## 2. Animation actually kaise banti hai (5 layer pipeline)

```
 cute_dog.svg ──
               ├─▶ [1] PARSE   : har <circle>/<ellipse>/<rect>/<path> ko Python polygon banao
               │              (animation/make_animation.py : load_svg)
               ├─▶ [2] RIG     : har "part" ko pivot + transform do
               │              head bob · ear flop · tail wag · blink · mouth · squash
               │              (part_transform + rig_state)   ← yahi "animation" hai
               ├─▶ [3] TEXT    : हिन्दी ko HarfBuzz se shape karo, phir outline rasterize
               │              (deva_text.py) — kyunki Pillow me libraqm nahi hai
               ├─▶ [4] AUDIO   : AI voiceover (per scene) + numpy se bana music/SFX
               │              ducking: voice aate hi music 30% tak kam
               └─▶ [5] BAKE    : frames → ffmpeg pipe → H.264 MP4, AAC audio
```

Frame rate 30 fps, canvas 1080×1920, dog layer 2× supersample (anti-aliasing ke liye),
~43 ms/frame → poori 56 s video ~1.5 min me render.

---

## 3. Chalane ka tarika

```bash
cd ppp/animation
python3 -m venv .venv && .venv/bin/pip install pillow numpy imageio-ffmpeg uharfbuzz fonttools

# (optional) voice clips: Arena ke generate_speech se audio/s01.wav … s08.wav aa chuke hain
python3 make_animation.py --preview 2.0,10.0,24.0,30.0   # frames PNG me, quick look
python3 make_animation.py --audio                        # narration stems + master_mix.wav
python3 make_animation.py --render --horizontal           # 9:16 + 16:9 MP4
python3 make_animation.py --all                           # audio + dono video

# browser-only animation (kuch install nahi karna):
python3 make_svg_animation.py        # → cute_dog_animated.svg
```

`FFMPEG=/path/to/ffmpeg python3 make_animation.py --render` — agar aapka apna ffmpeg use karna ho.

---

## 4. Khud se banane ke 3 raste

### A. Zero-install (browser) — sabse easy
1. Character ko SVG me rakho, **har part ko alag `<g>`** do (`<!-- Head -->` type comments se
   main parts naam le leta hoon).
2. Us `<g>` ke andar `<animateTransform type="rotate" values="-16 145 132;16 145 132;-16 145 132"
   dur="0.42s" repeatCount="indefinite"/>` — bas, poonch hil gayi.
   * `type="rotate"` ke values me **pivot (cx cy)** bhi hota hai → isiliye rotate isi ke around ghoomta hai.
   * blink = `type="scale" values="1 1;1 1;1 0.08;1 1;1 1"` + `keyTimes` (jaldi on/off).
   * breathing = body ko bottom-center se `scale` karo (1.00→1.03 x, 0.97→1.00 y).
3. `cute_dog_animated.svg` dekho — ye exact yahi karta hai.
4. Video chahiye? Browser me record (OBS) ya `ffmpeg -framerate 30 -i frame%04d.png …`
   (headless chrome se frames nikaal ke).

### B. Python + ffmpeg (jo maine kiya) — longest control
Upar wala section 3. Isme aap **hazaron frames programmatically** banate ho: timing pixel-perfect
voice ke saath bind hoti hai, captions ka karaoke audio progress se drive hota hai.

### C. Mobile / CapCut (editor route) — fastest for reels
1. Script likho → Hindi TTS se per-scene voice export (mono 44.1 kHz rakho, aapke stems jaisa).
2. Canvas 1080×1920, background `#0f1117 → #1a1d29` gradient, accent `#ffd700` / `#00d4aa`
   (ye palette aapke HTML guide se hi liya hai taaki brand same rahe).
3. Character PNG layers (head/ears/tail/alag) → CapCut me **keyframes**: head 0→6°→0 (2.6 s loop),
   tail -16→16° (0.42 s loop), blink ke liye eyes layer 0.15 s ke liye hide.
4. Auto-captions ON, font **Mukta/Noto Sans Devanagari** (rakshan: Devanagari me matra sahi
   baithe), 2 lines max, bottom 15% safe area me.
5. Music −18 dB, voice par **auto-ducking** (CapCut: "Audio ducking"), master loudness ≈ −14 dBFS.
6. Export 1080×1920, 30 fps, H.264, bitrate 8–12 Mbps.

---

## 5. Knobs (jo turant result badalte hain)

| Kya | Kahan | Asar |
|---|---|---|
| `SCENES` | `make_animation.py` | scene list, caption, kaunsa part highlight ho, kaunsa act |
| `PAD = 0.45` | same | scenes ke beech kaans (voice ki pacing) |
| `rig_state()` | same | breathing/ear flop/tail wag ki amplitude + speed |
| `FPS`, `VW/VH` | same | smoothness aur resolution |
| `music_level=0.20` | `build_mix()` | bed ka volume |
| `--crf 20` | `encode()` | file size vs quality (18 = best, 24 = chhota) |
| palette `GOLD/TEAL/CORAL` | top | brand color |

## 6. Troubleshooting

* **हिन्दी text toota hua / matra idhar-udhar** → Pillow ke paas `libraqm` nahi; is repo me
  `deva_text.py` HarfBuzz se khud shape karta hai. `PIL.features.check('raqm')` False ho to
  isi module ko use karo (ya `apt install libraqm0` karke Pillow raqm ke saath rebuild karo).
* **ffmpeg not found** → `pip install imageio-ffmpeg`; script usse bundled binary uthata hai.
* **Audio-video drift** → frames `dur*FPS` se round karo (`Timeline` yahi karta hai), aur
  export me variable frame rate wali MP4 input na karo.
* **Bilkul blank PNG** → supersample layer ka bbox canvas se bahar gaya; `draw_dog` me clamp hai,
  phir bhi `dog_h` value kam karo.
* **Halka sa hum/buzz** → voice stem par `highpass(80 Hz)` laga hai; apni recording par bhi laga sakte ho.

---

## 7. Isi repo me kya-kya mila

```
animation/make_animation.py          # poori pipeline (parse → rig → text → audio → MP4)
animation/deva_text.py               # HarfBuzz-based Hindi/Devanagari text renderer
animation/make_svg_animation.py      # browser-only animated SVG banane wala
animation/intro/                       # 5-second "सोच सेठ" YouTube channel bumper (alag README wahan)
animation/kaise-banaye.html          # ← phone pe kholo: live animation + har step copy button ke saath
animation/make_tutorial_html.py      # upar wala page banata hai
animation/cute_dog_animated.svg      # ← browser me kholo, dog yahi hilta hai
animation/audio/s01..s08.wav         # AI narration clips (24 kHz, TTS native)
animation/audio/master_mix.wav       # voice + music, −14 dBFS master
animation/cute_dog_animation_9x16.mp4  # MAIN deliverable (reels/shorts, 1080x1920)
animation/cute_dog_animation_16x9.mp4  # same content, blur-fill 1920x1080
animation/out/preview_*.png            # frame QC stills (gitignored)
14.wav … 21.wav                      # narration stems, aapke 5–13.wav ke format me
```
