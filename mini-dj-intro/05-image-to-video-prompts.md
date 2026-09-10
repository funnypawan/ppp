# 🎥 Image → Video Prompts (Image ko animate karne ke liye)

**Kaise use karna hai:** `04-image-prompts.md` se jo image banayi, usko tool me "Image to Video" me upload karo → neeche diya prompt paste karo → 4-5 sec generate karo.

**Golden rule:** Ek clip = **ek movement**. Camera move aur subject move dono maango to AI gandagi kar deta hai.

---

## 🔧 Common Negative Prompt (har clip me daalo)

```
fast motion, jump cut, morphing face, changing clothes, extra fingers, extra limbs, warped eyes,
duplicate objects, flickering lights, text, watermark, logo, blurry, low resolution, distortion,
sudden zoom, camera shake, characters appearing from nowhere, background changing
```

**Motion strength / Camera control:** `slow, subtle, smooth` — 4 second clip me 30-40% movement kaafi hai.

---

## SHOT-WISE PROMPTS

### S1 — Light ON (1.5s)
```
The neon magenta DJ light switches on with a soft flicker, light beam slowly sweeps across the
cardboard speakers, dust particles float and drift in the beam, subtle smoke rolls in from the right,
camera absolutely static. Slow, cinematic, smooth.
```

### S2 — Bacche ka face (2.5s)
```
The boy blinks once, his eyes widen with excitement, lips part slightly as he smiles, the LED light on
his face softly pulses magenta and cyan, small hair strands move slightly, camera slowly pushes in
toward his face. Very subtle motion, natural expression, no head turn. Slow motion.
```

### S3 — Papa confused (2.0s)
```
The father slowly scratches his head, shakes his head side to side once with a funny helpless
expression, the empty wallet in his other hand tilts, the LED accent light behind him flickers gently,
camera holds static with a very slight handheld sway. Comedic timing, natural slow motion.
```

### S4 — Phone ringing (1.5s)
```
The smartphone screen glows and vibrates on the table, the incoming-call screen pulses green at a
steady rhythm, screen light ripples over the hand and the wooden surface, background DJ lights blur
and bokeh softly, camera static macro shot. Subtle vibration only, no scrolling on the screen.
```

### S5 — Workshop table (2.0s)
```
Dust motes drift slowly through the warm desk-lamp beam, a hand reaches in from the right and slides
a cardboard sheet slightly, wires jiggle a little, camera slowly orbits clockwise around the table.
Smooth, satisfying DIY craft b-roll motion, shallow depth of field.
```

### S6 — Speaker loading (2.0s)
```
The handmade speaker box is lowered slowly onto the truck's cargo bed, cardboard surface flexes
slightly, the LED strip underneath pulses magenta once, soft smoke drifts in the background,
camera slowly tilts down following the movement. Slow, careful, weighty motion.
```

### S7 — LED light test (1.5s)
```
The LED strip ignites and colour-chases from left to right — magenta, cyan, orange — reflections
crawl across the wet floor and cardboard texture, smoke swirls gently, sparkle highlights bloom,
camera static with a very slow push in. Energetic light, calm camera.
```

### S8 — Monkey Bhai hero shot (3.0s)
```
The monkey raises his fist higher and shouts with joy, head tilts slightly back, headphones bounce a
little, tail swings behind him, one hand taps the DJ console, neon lights pulse in rhythm, smoke
drifts, camera slowly pushes in and slightly tilts up. Energetic but smooth, character stays on model.
```

### S9 — Logo reveal plate (2.0s)
```
Spotlight beams sweep slowly through thick fog, sparks and glowing particles drift upward, the wet
reflective floor shimmers, the cardboard truck stays parked and still, camera slowly rises (crane up)
revealing the empty upper space, lens flare blooms softly. Epic slow cinematic reveal, no text.
```
> Text "MINI DJ" iske upar CapCut me daalna hai (Step 5).

### S10 — Squad end card (3.0s)
```
All four characters wave at the camera at slightly different speeds, the monkey bounces a little, the
dog's tail wags, confetti drifts down through the warm fairy lights, LED strip on the truck colour-
cycles, camera slowly pushes in. Cheerful, warm, smooth group motion.
```

### S11 — Final payoff / DJ bajta hua (4.0s)
```
The truck's speakers pump with bass — cones visibly pulsing, LED strips and laser beams sweep the
night street, the monkey and dog dance energetically, crowd silhouettes raise their hands in the
background, confetti and smoke drift, camera slowly orbits around the truck. Concert energy,
smooth cinematic orbit, nobody morphs.
```

### S12 — Thumbnail me motion (optional, 2s)
```
Camera slowly pushes in on the truck while the LED lights pulse brighter, the monkey's mouth opens
in a shocked expression, sparks drift upward. Punchy but smooth.
```

---

## 🗣️ LIPSYNC PROMPTS (dialogue wale shots)

Sirf **Veo 3 / Kling talking-avatar / Runway Act-One / Hailuo** me chalega.

**S2 (baccha) — lip-sync:**
```
The boy speaks in Hindi with a cute excited child voice, mouth and jaw animate naturally,
eyebrows lift, slight head nod on the last word, eyes stay on camera, no body morphing.
Dialogue: "पापा! आज मेरा बर्थडे है, मुझे नया मिनी डीजे चाहिए!"
```

**S3 (papa):**
```
The father speaks in Hindi with a tired but loving adult voice, moustache moves naturally, head shakes
gently once, hand gesture stays consistent with the wallet.
Dialogue: "नया डीजे? बेटा, पैसे कहाँ से लाऊँ?"
```

**S8 (monkey bhai):**
```
The cartoon monkey speaks in Hindi with a funny high-pitched cartoon voice, big mouth animation,
exaggerated jaw movement, headphones stay fixed, comic energy.
Dialogue: "बजाओ बजाओ! मिनी डीजे तैयार है!"
```

> 💡 Agar tool lipsync support nahi karta (Kling free / CapCut), to **chehre pe camera push-in** rakho aur dialogue voice-over se chalao — log 90% baar notice nahi karte.

---

## 🎛️ MODEL-WISE SETTINGS (kya choose karna hai)

| Tool | Kaam | Recommended settings | Kiske liye best |
|---|---|---|---|
| **Google Veo 3 (Flow)** | Image→Video + dialogue | 8s, "Cinematic", 1080p, audio ON | Lip-sync / dialogue shots |
| **Kling AI** | Image→Video | 5s, "Professional / Standard" mode, Creativity 0.4, CFG 0.5 | Sabse smooth motion, product shots |
| **Runway Gen-4** | Image→Video | 5s, camera control "Push In / Orbit" | Camera-first shots |
| **Hailuo MiniMax** | Image→Video | 6s, "Director" mode, motion 4-5 | Character action |
| **Vidu / Pika / Luma** | Image→Video | 4s, motion low | Free options, b-roll |
| **CapCut → AI Video** | Image→Video | 4s, "Zoom in" preset | Mobile-only editing |

**Resolution:** 1080p pe generate karo (720p pe bhi chalega, upscale CapCut me kar dena).
**FPS:** 24-30 fps theek hai, 60fps waley model me 60.

---

## 🔁 BONUS PROMPTS

### A. Seamless Loop (YouTube live / DJ loop ke liye)
```
Making a perfectly seamless loop: the turntable spins continuously at constant speed, the LED light
pulses in a smooth breathing rhythm, the VU meter needles bounce in a repeating cycle, smoke drifts
sideways and resets, camera completely static. The first frame and the last frame are identical.
```

### B. Truck drive-in (intro ka strong opener)
```
The miniature cardboard DJ pickup truck drives slowly from the left into the frame and stops in the
centre, tyres rotate realistically, dust and smoke puff under the wheels, LED lights on the truck pulse
magenta, the camera stays low and static, slight vibration of the load. Grounded, weighty, smooth motion.
```

### C. 360° Orbit (product/hero shot)
```
The camera orbits a full 360 degrees around the miniature cardboard DJ pickup truck at a constant
speed, the LED lights stay glowing steadily, smoke drifts slowly, the floor reflection follows the truck,
uniform studio lighting, no zoom, no speed change.
```

### D. Macro Explosion of lights (bumper ke liye)
```
Extreme macro shot: the LED strip ignites and light races down the strip like a wave, colour changing
from magenta to cyan to orange, sparks bloom at the ignition point, dust particles illuminate, camera
pushes in extremely slowly. Slow-motion feel, 120fps look.
```

---

## 🆓 Free Jugaad — Agar AI video credits khatam ho gaye

**2.5D Parallax (CapCut / After Effects):**
1. Image ko 3 parts me mask karo — background, mid (truck), foreground.
2. Har layer pe alag scale keyframe: background 100% → 104%, mid 100% → 110%, foreground 100% → 118%.
3. PNG cutout me subject ko alag layer banao aur halka horizontal drift do.
4. Upar se **glow / light-leak / particle overlay** lagao (CapCut: "Light leak" + "Sparkle") — 100% AI video jaisa lagta hai.

**Aur 3 saste tricks:**
- **Push-in + shake** har image pe → slided video ban jaati hai
- **Zoom-punch cut** (har 0.6s pe alternate zoom) → montage
- **Transitions:** Whip pan, Spin blur, Flash white 3 frames → energy

---

## ✅ Clip check karne ka checklist (export se pehle)

- [ ] Face same hai (pehli keyframe jaisa)?
- [ ] Pixels ka "melting" nahi ho raha?
- [ ] Lights steady hain (flicker nahi)?
- [ ] Ungliyan 5 hain? 😄
- [ ] Camera ki direction agle shot se match karti hai?
- [ ] Clip ka pehla aur aakhri frame agle clip se jodne layak hai?
