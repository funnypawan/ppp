# ✂️ Editing Checklist (CapCut / Premiere / Resolve)

Beginner ke liye **CapCut** recommended — free, mobile + PC, Hindi TTS built-in.

---

## A. Project Setup

| Setting | Long video | Shorts/Reels |
|---|---|---|
| Aspect | 16:9 | 9:16 (1080x1920) |
| Resolution | 1080p | 1080p |
| FPS | 60 | 60 (30 bhi chalega) |
| Bitrate | 20-30 Mbps | 15-20 Mbps |
| Codec | H.264 / MP4 | H.264 / MP4 |

---

## B. Timeline Order (layer-by-layer)

```
LAYER 6 (sabse upar) : Text / Logo / Captions
LAYER 5              : Overlays (light leaks, particles, lens flares, smoke)
LAYER 4              : Effects / Transitions
LAYER 3              : Character clips (AI video)
LAYER 2              : SFX (har cut pe)
LAYER 1 (sabse neeche) : Music + Voice over
```

---

## C. Step-by-Step Order (isi order me karo, time bachega)

1. **Music pehle daalo** aur "Auto-beat" (CapCut) ON karo — cuts ka grid ban jayega.
2. Sab AI clips import karo → timeline pe **beat markers** ke hisaab se rakho.
3. **Dialogue ke hisaab se clips ki length tune karo** (voice se pehle, visual baad me).
4. Transitions lagao (Step 7 me list).
5. Voice over daalo → levels set karo (-6dB).
6. SFX cue sheet ke hisaab se SFX daalo (`06-voice-music-sfx.md`).
7. Texts + logo + watermark.
8. Color: `Teal-Orange / Cinematic` filter + **Glow/Bloom 20%** + **Vignette 15%**.
9. Shakiness: logo pe `Shake` effect 30-40%, intensity zyada nahi.
10. **2 baar poora dekho** (mute karke bhi — sirf visual kaise lagta hai) → export.

---

## D. Transitions List (kahan kya)

| Cut | Transition | Duration |
|---|---|---|
| Opener → S2 | Whip pan / Spin blur | 0.3s |
| S3 → S4 (phone) | Zoom + Flash white | 0.2s |
| Phone → Workshop | Flash + Zoom | 0.3s |
| Workshop ke andar cuts | Hard cut (no transition) | — |
| Last prop → Logo | **Riser + Flash + Shake + Sub-drop** | 0.4s |
| Logo → Content | Fade to black → 0.5s silence | 0.5s |

---

## E. Text Styling (brand ke liye fix karo)

| Cheez | Value |
|---|---|
| Heading font | Anton / Bebas Neue / Titan One |
| Body font | Poppins / Baloo / Mukta (Hindi ke liye Mukta best) |
| Text color | White `#FFFFFF` + black outline 6-8px |
| Accent color | Magenta `#FF2DAA` + Cyan `#00E5FF` + Orange `#FF7A00` |
| Animation in | Zoom In 0.3s / Pop Up |
| Position | Hook text top-center, caption bottom-center |

**Logo reveal animation (CapCut keyframe method):**
1. Logo text ko 3D/Emboss style do, orange-white color, magenta glow.
2. Keyframe 1 (0.0s): Scale **60%**, Opacity **0%**, Rotation **-8°**
3. Keyframe 2 (0.4s): Scale **118%**, Opacity **100%**, Rotation **0°** ← yahan sound ka BOOM
4. Keyframe 3 (0.6s): Scale **100%** (settle)
5. Keyframe 4 (2.4s): Opacity **100%** → (3.0s) Opacity **0%**
6. Upar se `Shake` effect + `Light leak` overlay.

---

## F. Color Grading (2 minute ka kaam)

- **Filter:** CapCut → "Cinematic" → Teal-Orange (ya "Vintage" + adjust)
- **Manual:** Contrast +12, Saturation +8, Sharpness +15, Temperature -5, Highlights -10, Shadows +8
- **Glow/Bloom:** intensity 15-25 (LED lights ko pop deta hai)
- **Vignette:** 15-20% (dark corners → attention center pe)
- Har clip pe **same grade** copy-paste karo (CapCut: "Copy adjustments → Paste")

---

## G. Export ke pehle Final Checklist

- [ ] Pehle 3 second me **ek sound + kuch dikhna** shuru ho gaya (dead air nahi)
- [ ] Intro total **15 sec se kam** hai
- [ ] Logo **3 sec** se zyada nahi hai
- [ ] Dialogue har jagah saaf sunai de raha hai (mute test)
- [ ] Saari text spelling sahi (AI se banwai nahi hai na?)
- [ ] Logo/watermark har video me same jagah, same size
- [ ] Aakhir me subscribe pop + next video tease
- [ ] Thumbnail ready (16:9, bade bold text, 2-4 words max)
- [ ] Aspect ratio platform ke hisaab se (long = 16:9, Shorts = 9:16)
- [ ] Volume peak -1dB, loudness -14 LUFS

---

## H. Upload Metadata

**Title formula:**
```
Mini Dj {Vehicle} setup | how to make mini dj setup for {Occasion} | Mini dj {Character} making at home
```

**Pinned comment (engagement ke liye):**
```
Batao agla mini DJ kis gaadi pe banaun? 🚚 Pickup / Truck / E-rickshaw — comment karo!
```

**Playlist:** `Mini DJ Full Setup Series` — saari videos ek jagah, session watch time badhta hai.

---

## I. Consistency System (yahi brand banata hai)

Ek folder banao: `MiniDJ_BrandKit/` — isme rakho:
```
logo.png            (transparent, 1000x1000)
intro_15s.mp4       (ready bumper)
intro_5s.mp4        (short bumper)
intro_3s_vertical.mp4
sound_logo.wav      (scratch + sub-drop)
fonts/              (Anton, Poppins, Mukta)
colors.txt          (hex codes)
character_sheet/    (5 character images - AI reference ke liye)
music_bgm.mp3       (safe BGM)
```

**Rule:** Har video me **same 4 cheezein** — logo, intro sound, font, colors.
Isse 7-10 video ke baad log thumbnail dekh ke hi pehchan lenge = **branding done**.
