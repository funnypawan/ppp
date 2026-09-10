# 🎤 Voice, Music aur SFX Guide

Intro ka 60% असर **sound** se aata hai. Us video me bhi visual se zyada **awaaz** kaam karti hai — "ओए", "वाओ", "अरे" wale sound words.

---

## 1️⃣ Voice Over (Hindi) — TTS ya apni awaaz

### CapCut TTS (free, fastest)
`Text → Text to Speech → Hindi → voice: "Male / Female Hindi"` → speed 1.05-1.15x.
Ek text box me ek line daalo (poora paragraph na daalo, warna robot lagti hai).

### ElevenLabs (sabse natural)
- Model: **Multilingual v2**
- Settings: `Stability 45%`, `Similarity 75%`, `Style 30%`, `Speaker Boost ON`
- Language: **Hindi (hi)**, speed 1.0

### 4 characters ke voice settings

| Character | Pitch | Speed | Tone | TTS trick |
|---|---|---|---|---|
| **बच्चा (baccha)** | +12% high | 1.15x | Excited, energy | Female voice + pitch up (male se better lagta hai) |
| **पापा** | -8% low | 0.92x | Tired, soft | Male voice + slow |
| **मयंक भाई** | 0% | 1.05x | Confident, dosti wala | Normal male voice |
| **मंकी भाई** | +22% high | 1.20x | Comedy, cartoon | Nasal tone, pitch max |

### VO lines (ready to paste)

```
[बच्चा] अरे पापा! आज मेरा बर्थडे है, मुझे नया मिनी डीजे चाहिए!

[पापा] नया डीजे? बेटा, इस महीने तो बजट खत्म हो गया।

[बच्चा] तो मयंक भाई से बनवा दो ना! वो कार्डबोर्ड से बना देते हैं!

[मयंक भाई] मिनी डीजे चाहिए? चलो, आज ट्रक पर लाइट के साथ बनाते हैं!

[मंकी भाई] बजाओ बजाओ! मिनी डीजे तैयार है!

[VO - deep, logo ke waqt] मिनी डीजे!
```

> ⏱️ **Timing:** har line 1.5-2.5 sec ki rakho. Dialogue ke beech **0.3 sec silence** chhodo — CapCut me clip ke aage-peeche khali jagah.

### Mic se record karne ke liye
- Mobile ka mic + chhota room (kapde/cushion ke beech) — echo kam hoga
- Mic muh se **15-20 cm** door, thoda side me (pop sound se bachne ke liye)
- Recording ke baad CapCut me: **Noise Reduction 40% + Voice Enhance ON**
- Levels: **Voice -6 dB, Music -18 dB, SFX -12 dB**

---

## 2️⃣ Music (copyright-free)

### Search keywords
| Platform | Keyword |
|---|---|
| Pixabay Music / Audio Library | `dj remix 140 bpm`, `desi dj drop`, `trap beat hindi`, `festival dhol edm` |
| Uppbeat | `indian edm`, `toy commercial`, `energetic intro` |
| Suno / Udio (custom banao) | Prompt: `upbeat desi DJ remix, heavy bass drop, dhol + synth, 145 BPM, energetic, instrumental, loopable, 30 seconds` |

### Structure jisme jodo
```
0.0-2.0s   → SFX intro (riser + scratch)
2.0-8.0s   → Music bed LOW (-22 dB), dialogue chale
8.0-11.5s  → Build-up (riser chadhta hua)
11.5-13.5s → DROP (sub-bass + full volume) = logo reveal
13.5s+     → Loop / video ka BGM
```

> 🎯 **Sabse important trick:** Logo wale frame pe music ka **exact drop** aana chahiye. CapCut me "Beat" marker laga ke drop ka point logo cut pe rakh do.

---

## 3️⃣ SFX Cue Sheet (timecode ke saath)

| Time | SFX | Keyword (Pixabay/Zapsplat) | Volume |
|---|---|---|---|
| 0.0s | DJ scratch | `dj scratch short` | -8 dB |
| 0.2s | Deep whoosh / riser | `riser whoosh cinematic 1s` | -10 dB |
| 1.2s | Light switch on | `light switch click` | -12 dB |
| 2.0s | Bell / cute ting | `cute bell ting` | -14 dB |
| 4.5s | Comedy "dhin" | `comedy dhin funny` | -12 dB |
| 6.5s | Phone ring | `nokia ringtone classic` / `old phone ring` | -10 dB |
| 9.0s | Whoosh transition | `fast whoosh transition` | -10 dB |
| 11.5s | **Sub-bass drop** | `sub bass drop boom` | -6 dB |
| 11.8s | Crowd cheer | `small crowd cheer` | -14 dB |
| 12.0s | Sparkle / magic | `magic sparkle chime` | -16 dB |
| Har prop shot | Cardboard thud | `cardboard box thud` | -12 dB |
| Truck shot | Tyre screech | `tyre screech short` | -14 dB |
| Monkey shot | Monkey chatter | `monkey chatter funny` | -12 dB |
| Dog shot | Dog bark (1x) | `dog bark single funny` | -12 dB |
| Generator | Engine start fail | `engine start fail sputter` | -10 dB |
| Lights test | Electric buzz | `electric buzz light` | -18 dB |
| Bass hit pe | Speaker punch | `speaker punch bass hit` | -10 dB |

### SFX lagane ke 3 rules
1. **Kuch bhi screen pe aaye, uska sound do** (prop thud, LED click, wire rustle) — isko "foley" kehte hain.
2. Har **cut** pe halka whoosh — energy badhti hai.
3. Silence fear mat karo — drop se pehle **0.5 sec silence** = sabse strong effect.

---

## 4️⃣ Final Audio Mix (CapCut me)

| Track | Level | Extra |
|---|---|---|
| Voice over | -6 dB | Noise reduction 40%, Voice enhance ON |
| Music | -20 dB (dialogue ke time) / -8 dB (drop pe) | Fade in 0.5s, fade out 1s |
| SFX | -12 dB | Har SFX pe 10-20ms fade in/out (click sound hatane ke liye) |
| Master | -1 dB peak | Loudness target: -14 LUFS (YouTube standard) |

**Quick master chain (CapCut):** `Normalize → Compressor → EQ (bass +2, high +1) → Loudness -14 LUFS`
