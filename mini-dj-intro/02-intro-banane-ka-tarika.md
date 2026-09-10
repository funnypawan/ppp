# 🧠 Channel Intro Banane Ka Tarika (Step-by-Step)

Ye guide Mini Dj jaise **miniature DIY / toy-DJ** channel ke liye hai, lekin method kisi bhi story-based channel pe kaam karega.
Total kaam: **pehli baar 3-4 ghante, uske baad har intro 20 minute me ready.**

---

## STEP 0 — Reference todkar samjho (15 min)

Us video ko 0:00-0:25 tak 5 baar dekho aur notebook me likho:
1. **Pehla sound kya hai?** (DJ scratch + tabla/bass) — isse "sound brand" banega.
2. **Pehla visual kya hai?** (bacche ka close-up / mini DJ ka glow)
3. **Pehle 15 sec me kitne camera cuts hain?** (uss video me ~8 cuts hain)
4. **Kaunse props repeat hote hain?** (pickup truck, speaker stack, LED strip, amplifier board, generator)
5. **Kaunse characters repeat hote hain?** (Monkey bhai, Doggy bhai, Mayank bhai, chhota baccha, papa)

Bas yeh 5 cheezein tumhari "brand kit" hain. Inhe fix karo:
- 🎨 **Colors:** neon magenta + cyan + orange (dark background par)
- 🔤 **Font:** 1 heading font (Anton / Bebas Neue / Baloo) + 1 body font
- 🔊 **Sound logo:** 2 sec ka scratch + sub-drop (Suno/AI se banao, ya free SFX jodo)
- 🐒 **Mascot:** Monkey bhai (headphone pehna hua) — ye tumhara "face" hai

---

## STEP 1 — Character Sheet banao (30 min)

Har character ka **ek hi clean front-facing image** banao aur phone me "Characters" naam ke album me save karo. Ye images aage har shot ke liye reference banengi — isse face same rehta hai.

5 characters chahiye (prompts `04-image-prompts.md` me hain):
1. **Mayank bhai** — 22 saal, Indian, DIY craftsman
2. **Monkey bhai** — mascot, headphone + cap
3. **Doggy bhai** — toolbox wala dog
4. **Chhota baccha** — 7-8 saal ka ladka
5. **Papa** — kurta pehna hue, mustache

> 💡 **Consistency trick:** Naya pose banane ke liye *text prompt* na likho — purani image ko **input** me daalo aur likho: *"same character, same face, same clothes, now standing and holding a speaker box"*. Gemini/ChatGPT/Leonardo sab yeh support karte hain.

---

## STEP 2 — Keyframes banao (45 min)

Ek 15-second intro ke liye **8-10 keyframe images** chahiye (16:9 me 1920x1080, Shorts ke liye 1080x1920).

Reel (shot list) yeh hai:

| Shot | Kya dikhega | Duration |
|---|---|---|
| S1 | Close-up: chhote bacche ka excited face, dark room me LED glow | 1.5s |
| S2 | Papa ka face, haath utha ke "na" bolte hue | 1.0s |
| S3 | Phone screen par "Mayank Bhai 📞" — call ring | 1.0s |
| S4 | Mayank bhai workshop table par cardboard pickup uthate hue | 2.0s |
| S5 | Speaker stack + LED strip jalte hue (macro shot) | 1.5s |
| S6 | DJ console ka macro: knobs ghoom rahe, VU meter jump | 1.5s |
| S7 | Pickup truck full loaded, hero low-angle shot | 2.0s |
| S8 | Monkey bhai DJ console ke peeche, haath hawa me | 2.0s |
| S9 | Logo reveal frame (MINI DJ text + speakers) | 2.0s |
| S10 | End card: poori gang truck ke saath, wave karte hue | 2.0s |

**Image generate karte waqt:**
- Style prompt **hamesha same** rakho (warna look badal jayega): `cinematic 3D render, Pixar-style stylized realistic, dark stage, neon magenta cyan, volumetric fog, 8k`
- Drama ke liye **rim light** aur **shallow depth of field** maango
- Logo wali image AI se mat karwao — woh CapCut me text se banega (Step 5)

---

## STEP 3 — Image → Video (60-90 min)

Har keyframe ko 4-5 second ke clip me badlo. Free tool: **Kling AI** ya **CapCut → AI Video**.
Rules jo follow karne hain:
1. Ek prompt me **ek hi movement** maango ("camera slowly pushes in" YA "the truck drives forward") — dono maango to result ganda aayega.
2. Harkat **slow** rakho — 4 sec me sirf 30-40% movement.
3. **Negative prompt** hamesha daalo: `blur, distortion, extra fingers, warped face, text, watermark, flicker`
4. Face wale shots ko **lip-sync** tabhi karwao jab dialogue ho (Veo 3 / Kling "Talking avatar" / Runway Act-One).
5. Har shot ka **2 take** rakho — ek slow, ek fast.

Detail prompts: `05-image-to-video-prompts.md`

> 💰 **Paise bachane ka jugaad:** Agar AI video credits khatam ho gaye to **CapCut ka 2.5D parallax** use karo — image ko 3 layer me mask karo aur scale keyframe lagao. Wo bhi log ko "video" jaisa lagta hai.

---

## STEP 4 — Voiceover / Dialogue (30 min)

Us video ka असली jaadu **Hindi dialogue** hai — bacche ki awaaz + papa ki awaaz + Mayank bhai ki awaaz.
Mobile ki recorder me hi record kar sakte ho, ya TTS:

- **Baccha:** high pitch, 1.15x speed, thoda "chipmunk" pitch +12%
- **Papa:** low pitch, slow, thoda gussa
- **Mayank bhai:** normal, energetic, "haan bhai!" wala tone
- **Monkey bhai:** comedy wali nasal voice (TTS me pitch +20%)

Lines taiyaar hain: `03-scripts-hindi.md`
> 🎯 Important: Dialogue ke andar **sound words** daalo — "ओए", "वाओ", "अरे", "ओ हो हो" — yeh audio me energy laate hain.

---

## STEP 5 — Logo / Bumper (30 min) — CapCut me

**AI se text nahi banwana.** CapCut me text tool se banao:

1. Text likho: `MINI DJ` (ya tumhara channel naam) — font: **Anton / Bebas Neue / Titan One**
2. Style: **3D / Emboss** look, color orange-white, **Outer Glow** magenta 30-40%
3. Animation: **In → "Zoom In" 0.4s** + **Out → "Fade Out"**, ya keyframe se scale `0.6 → 1.15 → 1.0`
4. Background me logo-reveal image rakho (S9)
5. Sound: **riser (1s) → sub-drop → DJ scratch**, exactly jab text appear ho
6. Total length **3 second** — isse zyada nahi.

---

## STEP 6 — Music aur Cut Timing (20 min)

- Music: **140-150 BPM** DJ remix (Pixabay pe "dj remix 140 bpm" / "desi dj drop")
- Cut har **4 beats** pe (140 BPM = ~1.71s per 4 beats)
- CapCut me **"Beat" marker** feature hai — "Auto-beat" ON karo, cut uske upar rakh do. Free me perfect sync.
- Bass drop ke time pe **logo** aaye — yahi "intro" ka peak hai.

---

## STEP 7 — Transitions + Effects (20 min)

- S1→S2: **Whip pan / Spin blur**
- S3→S4: **Zoom transition** (CapCut "흰색 flash" / flash white 3 frame)
- S5-S6: **Macro cuts** (koi transition nahi, bas hard cut — energy ke liye)
- S8→S9 (logo): **Bass drop + flash + shake** (CapCut "Shake" effect, intensity 40%)
- Poori intro pe halka **glow / bloom** + **vignette** + **teal-orange filter** (CapCut: "Cinematic" filters)

---

## STEP 8 — Text & Graphics (10 min)

- Hook line screen pe bold Hindi me (top-center ya center-bottom), **2 words per screen**
- Emoji use karo: 🔊 🚚 🐒 🔥
- Bottom-left corner me chhota **watermark/logo** hamesha (channel ke liye) — opacity 40%
- Subscribe wala pop **end me**, start me nahi

---

## STEP 9 — Export Settings

| Platform | Resolution | FPS | Bitrate |
|---|---|---|---|
| YouTube long video | 1920x1080 | 60 | 20-30 Mbps |
| YouTube Shorts | 1080x1920 | 60 | 20 Mbps |
| Instagram Reels | 1080x1920 | 30 | 12 Mbps |

CapCut export me **"Codec: H.264, Format: MP4"** rakho. 60fps zaroor — miniature shots me smoothness bahut dikhti hai.

---

## STEP 10 — Reuse (ek baar banao, 50 videos me use karo)

- Intro ko **separate project file** me save karo → har video me top pe drag-drop.
- 3 versions banao:
  1. **5s bumper** (story se pehle/baad me)
  2. **15s full intro** (naye viewers ke liye, mahine me ek baar)
  3. **3s Shorts hook** (vertical)
- Har video me **same sound logo** rakho — 2 hafte me log kaan se pehchan lenge. Yahi brand banta hai.

---

## ⚠️ 7 Galtiyan jo views maar deti hain

1. Intro 10 sec se lamba → 40% viewers gaya.
2. 0:00 pe logo → hook hi nahi laga.
3. AI-generated text/logo me spelling galat.
4. Har video me different font/color → brand zero.
5. Character ka face har scene me badal jana (reference image use nahi ki).
6. Music ke upar voice bahut low → dialogue samajh hi nahi aata (voice -6dB, music -18dB rakho).
7. Vertical video ka 16:9 export → black bars, reach kam.
