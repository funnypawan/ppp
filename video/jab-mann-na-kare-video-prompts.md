# जब मन न करे, तब भी काम कैसे करें? — Image-to-Video Prompts (सभी 89 इमेज)

**स्रोत स्क्रिप्ट:** `scripts/jab-mann-na-kare-tab-bhi-kaam-kaise-kare.md`
**स्रोत स्टोरीबोर्ड:** `storyboard/jab-mann-na-kare-storyboard.md` (Scene 001–089)
**स्रोत इमेज:** `images/scene-001.jpg … scene-089.jpg` (1920×1080, 16:9)
**कुल वीडियो प्रॉम्प्ट:** 89 — हर इमेज के लिए एक अलग, कॉपी-पेस्ट रेडी प्रॉम्प्ट
**कवरेज:** इस एक डॉक्यूमेंट में IMAGE 1 → IMAGE 89 तक लगातार क्रम, कोई इमेज छूटी नहीं।

---

## GLOBAL VIDEO SPECIFICATIONS (हर क्लिप के लिए)

- **Aspect Ratio:** 16:9 · **Resolution Target:** 1920×1080 Full HD · **Frame Rate:** 24 FPS cinematic (टूल सपोर्ट करे तो)
- **Input:** संबंधित `images/scene-XXX.jpg` को ही source/first-frame image की तरह इस्तेमाल करें
- **Output:** प्रति इमेज एक अलग वीडियो क्लिप
- **Style:** Source image जैसा ही photorealistic cinematic — कोई स्टाइल बदलाव नहीं
- **Motion:** Smooth and natural; कहानी की ज़रूरत के अनुसार, सिर्फ़ हिलाने के लिए नहीं

## इस्तेमाल कैसे करें

1. संबंधित scene की image अपने Image-to-Video टूल (Runway, Kling, Pika, Luma, Veo आदि) में अपलोड करें।
2. **IMAGE-TO-VIDEO PROMPT** कॉपी-पेस्ट करें; टूल में negative prompt का विकल्प हो तो **NEGATIVE PROMPT** भी।
3. Suggested Duration के अनुसार 5s/8s/10s चुनें। यदि टूल सिर्फ़ 5 सेकंड बनाता है, तो प्रॉम्प्ट के **पहले दो action beats** रखें और बाक़ी हटा दें — एक ही गतिविधि दोहराएँ नहीं।
4. हर प्रॉम्प्ट में preservation और avoidance निर्देश पहले से शामिल हैं; इन्हें हटाएँ नहीं।

## GLOBAL PRESERVATION CLAUSE (हर प्रॉम्प्ट में शामिल)

Preserve the original character identity, face and facial features, hairstyle, clothing, body proportions, environment, background, lighting direction, color palette, and object positions unless the scripted action requires movement. Maintain visual continuity with the source image. Do not introduce unrelated objects or additional characters.

---


SCENE 001 → VIDEO PROMPT 001  (IMAGE 1 · source: `images/scene-001.jpg`)

**Scene Title:** रात का संकल्प — छत को देखता चेहरा

**Script Reference:** 'रात के ग्यारह बज रहे हैं। तुम बिस्तर पर लेटे हो, छत को देख रहे हो, और मन में एक ही बात चल रही है — कल से पक्का।'

**Image Analysis:** रात का अंधेरा कमरा; CHARACTER_01 पीठ के बल बिस्तर पर लेटा छत को देख रहा है, हाथ सीने पर; बाईं ओर से टेबल लैंप की गर्म चमक; चेहरे पर गंभीर संकल्प।

**Visual Action:** गहरी धीमी साँस से सीना उठना-गिरना, 2–3 प्राकृतिक पलक झपकना, जबड़े में हल्की कसावट — आँखें छत पर टिकी रहेंगी। कोई बड़ा मूवमेंट नहीं।

**Camera Movement:** Slow Push-in (high angle, लगभग अदृश्य गति)

**Motion Intensity:** LOW

**Suggested Duration:** 5–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a night bedroom, a 22-year-old Indian man in a dark navy T-shirt lies on his back on the bed, eyes open, staring at the ceiling, hands resting on his chest, a warm table-lamp glow reaching him from the left, cool blue-grey darkness elsewhere. Animate: he breathes slowly and deeply, chest rising and falling; he blinks naturally two or three times; his jaw tightens slightly as quiet resolve settles on his face; his eyes stay fixed on the ceiling. Camera: very slow push-in from the high angle above the bed, almost imperceptible. Environment: the lamp glow holds steady, faint dust drifts in the light. Mood: heavy, silent late-night determination. Preserve the original face, hairstyle, clothing, room layout, lamp on the left, lighting direction and color palette. No scene change, no sudden movement, no sitting up.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, sitting up, standing, smiling, phone in hand, second person, readable clock digits

**Voice-over Match:** रात के ग्यारह बजे का 'कल से पक्का' वाला खामोश संकल्प — नींद न आना, बस छत को देखना।

---


SCENE 002 → VIDEO PROMPT 002  (IMAGE 2 · source: `images/scene-002.jpg`)

**Scene Title:** अलार्म और नौ मिनट की नींद

**Script Reference:** 'अलार्म बजता है, तुम उसे नौ मिनट के लिए टाल देते हो। फिर दस मिनट। फिर आँख खुलती है तो पौने ग्यारह बज चुके हैं।'

**Image Analysis:** अगली सुबह का धुँधला प्रकाश; बिस्तर के किनारे रखा फ़ोन; CHARACTER_01 आधी नींद में हाथ बढ़ाकर स्नूज़ दबा रहा है; स्क्रीन पर सिर्फ़ धुँधली चमक, कोई अंक नहीं।

**Visual Action:** उँगली स्क्रीन पर एक धीमा टैप (स्नूज़), हाथ का ढीलापन — नींद भरा भारी हाथ; फ़ोन वापस किनारे पर रखना; कंधा हल्का सा हिलना।

**Camera Movement:** Slow Push-in (over-the-shoulder close-up)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: early morning, over-the-shoulder close-up of a half-awake young Indian man reaching for a phone at the edge of the bed, his thumb pressing the screen which shows only a soft blurred glow with no readable digits, face partially visible in soft focus. Animate: his heavy sleepy thumb presses the screen once in a slow tap, the hand hesitates a moment, then lowers the phone back onto the bed edge; his shoulder shifts slightly, eyes still half closed. Camera: slow gentle push-in on the hand and screen. Environment: dim morning light barely changes. Mood: groggy surrender to the snooze. Preserve the original face, hair, clothing, bedding, phone position, lighting and palette. No readable numbers or app icons on the screen, no scene change, no sudden movement.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable digits on screen, app icons, bright screen content, fully waking up, sitting up

**Voice-over Match:** अलार्म बजते ही नौ-दस मिनट की स्नूज़ — नींद के आगे हार मानता हाथ।

---


SCENE 003 → VIDEO PROMPT 003  (IMAGE 3 · source: `images/scene-003.jpg`)

**Scene Title:** फ़ोन में खोया एक घंटा

**Script Reference:** 'फ़ोन हाथ में आता है, और एक घंटा यूँ ही निकल जाता है।'

**Image Analysis:** सुबह की रोशनी फैला कमरा; CHARACTER_01 बिस्तर पर आधा उठकर फ़ोन स्क्रॉल कर रहा है; डेस्क पर किताब अनछुई; दरवाज़े की तरफ़ से वाइड शॉट।

**Visual Action:** अंगूठे की धीमी लगातार स्वाइप; चेहरे पर स्क्रीन की हल्की चमक; भारी पलकें; शरीर का बिना ध्यान वाले ढीलापन से झुकना।

**Camera Movement:** Gentle Sideways Dolly (दरवाज़े से, पात्र फ़्रेम में छोटा)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide shot from the room doorway, morning light spread across a small urban Indian bedroom, a young man in a dark navy T-shirt sits half upright on the bed scrolling a phone, the untouched book lying on the desk, he looks small in the larger frame. Animate: his thumb swipes the screen slowly again and again, the faint screen glow flickers softly on his face, heavy eyelids blink slowly, his body slouches a little deeper without him noticing. Camera: gentle slow sideways dolly from the doorway, keeping him small in frame. Environment: soft morning light stays steady, faint dust in the air. Mood: an hour quietly dissolving into the phone. Preserve room layout, character identity and clothing, desk and book positions, lighting direction. No readable screen content, no scene change, no new objects.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, standing up, energetic movement

**Voice-over Match:** फ़ोन हाथ में आया और एक घंटा यूँ ही निकल गया — अनछुई किताब गवाह है।

---


SCENE 004 → VIDEO PROMPT 004  (IMAGE 4 · source: `images/scene-004.jpg`)

**Scene Title:** मुझसे क्यों नहीं होता?

**Script Reference:** 'फिर वही पुराना सवाल — मुझसे क्यों नहीं होता? क्या मैं कमज़ोर हूँ?'

**Image Analysis:** बिस्तर के किनारे बैठा CHARACTER_01, एक हाथ में फ़ोन लटका, सिर झुका; खिड़की की सुबह की रोशनी चेहरे पर; साइड प्रोफ़ाइल क्लोज़-अप।

**Visual Action:** लटके फ़ोन की बहुत हल्की हिलना; सिर का धीरे से एक बार हिलना (इनकार खुद से); नज़र फ़र्श पर टिकी; एक गहरी साँस।

**Camera Movement:** Slow Push-in (side profile, eye level)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: side profile medium close-up at eye level, a young Indian man sits on the edge of the bed, head lowered, a phone dangling loosely in one hand, soft morning light from the window on his face. Animate: the dangling phone sways very slightly, he takes one slow heavy breath, his head shakes once in a small self-denial, eyes stay fixed on the floor, brow slightly creased with a quiet old question. Camera: slow steady push-in on his profile. Environment: window light holds steady, nothing else moves. Mood: self-doubt, 'why can't I do this'. Preserve the original face, hairstyle, navy T-shirt, phone in hand, bed and room, lighting direction and palette. No scene change, no standing up, no exaggerated crying.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, crying, standing up, phone dropping, second person

**Voice-over Match:** 'मुझसे क्यों नहीं होता?' — ख़ुद पर उठता वही पुराना सवाल, झुके सिर में सिमटा।

---


SCENE 005 → VIDEO PROMPT 005  (IMAGE 5 · source: `images/scene-005.jpg`)

**Scene Title:** खाली कुर्सी, खुली किताब

**Script Reference:** 'आज की बात सीधी है। तुम आलसी नहीं हो। बस तुम एक गलत चीज़ का इंतज़ार कर रहे हो।'

**Image Analysis:** दिन के प्रकाश में कमरा; डेस्क पर किताब-नोटबुक, कुर्सी खाली; पीछे CHARACTER_01 बिस्तर पर बैठा खाली दीवार देख रहा है।

**Visual Action:** खाली कुर्सी स्थिर; पात्र पीछे हल्की साँस और एक बार दीवार से नज़र हटाकर डेस्क की तरफ़ देखना, फिर वापस; बहुत सूक्ष्म गति।

**Camera Movement:** Controlled Rack Focus (खाली कुर्सी से पीछे पात्र पर)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a daylit small Indian bedroom, a wide shot focused on the empty wooden chair and the desk with a book and notebook waiting, the young man in a navy T-shirt sits small on the bed in the background staring at a blank wall. Animate: the empty chair and desk stay perfectly still; in the background he breathes slowly, once shifts his gaze from the wall toward the waiting desk, then lets it fall back; a subtle posture slump. Camera: slow controlled rack focus from the empty chair in the foreground to his face in the background. Environment: steady daylight, faint dust in the light. Mood: the gap between the ready desk and the unmoving body. Preserve room layout, object positions, character identity and clothing, lighting. No scene change, no person appearing at the desk, no new objects.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person sitting at desk, moving chair, objects shifting

**Voice-over Match:** कुर्सी खाली, किताब खुलने को तैयार — तुम आलसी नहीं, बस गलत चीज़ का इंतज़ार कर रहे हो।

---


SCENE 006 → VIDEO PROMPT 006  (IMAGE 6 · source: `images/scene-006.jpg`)

**Scene Title:** सोचते-सोचते थक जाना

**Script Reference:** 'क्या तुम्हारे साथ भी ऐसा होता है कि काम के बारे में सोचते-सोचते तुम इतना थक जाते हो, जितना काम करके भी न थकते?'

**Image Analysis:** CHARACTER_01 डेस्क के सामने बैठा; किताब बंद, हाथ में पेन नहीं; एक हाथ माथे पर, नज़रें भटकी हुईं; हल्का लो-एंगल मीडियम शॉट।

**Visual Action:** माथे से हाथ का धीरे नीचे खिसकना; एक लंबी थकी साँस; नज़र का किताब पर जाकर फिर हट जाना; उँगलियों का बेमन से टेबल पर टिकना।

**Camera Movement:** Slow Push-in (slightly low angle)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: slightly low-angle medium shot from across the desk, a young Indian man sits facing a closed book with no pen in hand, one hand pressed on his forehead, eyes drifting away from the desk. Animate: his hand slides slowly down from his forehead, he exhales a long tired breath, his gaze drops to the closed book and drifts away again, fingers tap the table once without intent. Camera: slow subtle push-in from across the desk. Environment: room light steady, nothing else moves. Mood: exhausted by thinking about the work, not by the work. Preserve the original face, clothing, closed book position, desk layout, lighting and palette. No scene change, no book opening, no pen appearing, no exaggerated gesture.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, book opening, pen appearing in hand, standing up

**Voice-over Match:** काम के बारे में सोचते-सोचते इतना थक जाना, जितना काम करके भी न थकते।

---


SCENE 007 → VIDEO PROMPT 007  (IMAGE 7 · source: `images/scene-007.jpg`)

**Scene Title:** सब प्लान हो गया, काम कुछ नहीं

**Script Reference:** 'किताब खोली नहीं, लेकिन दिमाग़ में ये तय कर लिया कि कौन-सा चैप्टर पढ़ना है... सब प्लान हो गया। और फिर... कुछ नहीं हुआ।'

**Image Analysis:** टॉप-डाउन डेस्क: खुली किताब, नोटबुक, तीन पेन क्रम में, लैंप — कोई हाथ नहीं, कोई गतिविधि नहीं; सब कुछ तैयार पर छुआ नहीं गया।

**Visual Action:** कोई पात्र नहीं — सिर्फ़ लैंप की रोशनी में बहुत हल्का बदलाव और हवा में धूल के कण तैरना; वस्तुएँ पूरी तरह स्थिर।

**Camera Movement:** Slow Push-in (top-down, बेहद धीमी)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a top-down detail shot of a desk surface with an open book, a notebook and three pens arranged neatly in a row, a table lamp glowing at the edge, no hands and no person visible. Animate: keep every object perfectly still; only the lamp glow breathes with the faintest natural variation and tiny dust particles drift slowly through the light. Camera: very slow top-down push-in toward the open book. Mood: everything planned, nothing started — a silent accusation. Preserve the exact positions of the book, notebook, pens and lamp, the desk texture, lighting direction and palette. No hands entering frame, no objects moving or appearing, no scene change, no readable text becoming legible.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hands entering frame, person, objects moving, pens rolling, readable handwriting

**Voice-over Match:** दिमाग़ में सब प्लान हो गया — चैप्टर, क्रम, पेन — और असल में कुछ नहीं हुआ।

---


SCENE 008 → VIDEO PROMPT 008  (IMAGE 8 · source: `images/scene-008.jpg`)

**Scene Title:** एक वीडियो के बाद दूसरा वीडियो

**Script Reference:** 'सोचते हैं, पहले एक वीडियो देख लूँ, फिर मूड ठीक होगा तो पढ़ लूँगा। वो वीडियो ख़त्म होता है, मूड ठीक नहीं होता, एक और वीडियो चल पड़ता है।'

**Image Analysis:** CHARACTER_01 कुर्सी पर उल्टी तरफ़ झुका फ़ोन पर वीडियो देख रहा है, ऊँगली स्वाइप करती; पीछे डेस्क पर किताब धुँधली; OTS शॉट, स्क्रीन की चमक।

**Visual Action:** ऊँगली की बार-बार स्वाइप; चेहरे पर स्क्रीन चमक का हल्का बदलना; एक वीडियो ख़त्म होते ही तुरंत अगला — बिना रुके वाली लय; खाली नज़रें।

**Camera Movement:** Slow Push-in (over-the-shoulder)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an over-the-shoulder shot from behind a chair, a young Indian man leans backwards watching videos on his phone, finger swiping the glowing screen, the study book blurred on the desk behind him. Animate: his thumb swipes again and again in an endless rhythm, the cool screen glow shifts softly across his face as one video ends and another begins, his expression stays blank and hypnotized, occasional slow blink, body sunk deeper into the chair. Camera: slow steady push-in over his shoulder toward the screen. Environment: background desk stays soft and still. Mood: cheap entertainment replacing real rest. Preserve character identity, clothing, chair and desk layout, lighting. No readable screen content or app UI, no scene change, no sudden movement.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, video UI elements, sitting up straight, book moving

**Voice-over Match:** 'पहले एक वीडियो, फिर मूड ठीक होगा तो पढ़ूँगा' — वीडियो ख़त्म, मूड वहीं का वहीं।

---


SCENE 009 → VIDEO PROMPT 009  (IMAGE 9 · source: `images/scene-009.jpg`)

**Scene Title:** न काम, न सुकून — शाम की बेचैनी

**Script Reference:** 'शाम हो जाती है। और शाम को वही बोझ — आज भी कुछ नहीं किया।... न काम हुआ, न सुकून मिला। बस एक बेचैनी सारा दिन साथ चली।'

**Image Analysis:** शाम का नारंगी-नीला धुँधला प्रकाश; CHARACTER_01 खिड़की के पास खड़ा बाहर देख रहा है, कंधे भारी; सिलहूट वाइड शॉट।

**Visual Action:** भारी कंधों के साथ एक धीमी साँस; सिर का बहुत हल्का झुकना; खिड़की के बाहर धुँधले प्रकाश का धीमा गहरा होना; बाक़ी सब स्थिर।

**Camera Movement:** Slow Pull-back (कमरे के अंदर से)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide evening shot from inside the room, a young Indian man stands silhouetted near the window, shoulders heavy, watching outside in dim orange-blue dusk light. Animate: he takes one slow weighted breath, his shoulders sag a fraction, his head dips very slightly as the evening light outside dims imperceptibly; no other movement. Camera: slow steady pull-back widening the room around him, deepening the loneliness. Environment: dusk light slowly settles, faint dust in the air. Mood: neither work happened nor rest — a restless day ending in burden. Preserve character identity and clothing, window and room layout, lighting direction and dusk palette. No scene change, no turning around, no new objects, no rain unless present.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, turning around, walking away, rain appearing, bright lights

**Voice-over Match:** शाम को वही बोझ — न काम हुआ, न सुकून मिला; बस बेचैनी सारा दिन साथ चली।

---


SCENE 010 → VIDEO PROMPT 010  (IMAGE 10 · source: `images/scene-010.jpg`)

**Scene Title:** एक दिन और खाली गया

**Script Reference:** 'और शाम को वही बोझ — आज भी कुछ नहीं किया।'

**Image Analysis:** रात; CHARACTER_01 डेस्क पर सिर टिकाए बैठा; किताब खुली पर पन्ने अनछुए; लैंप की गर्म रोशनी सिर्फ़ चेहरे तक; शैलो डेप्थ मीडियम क्लोज़-अप।

**Visual Action:** सिर टिकाए धीमी साँस; एक बार आँख खुलना और फिर थकान से बंद होना; खुली किताब बिल्कुल स्थिर — अनछुए पन्ने।

**Camera Movement:** Slow Push-in (eye level, shallow focus)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a night medium close-up at eye level with shallow depth of field, a young Indian man rests his head on the desk, an open book with untouched pages beside him, warm lamp glow reaching only his face, dark room around. Animate: he breathes slowly against his folded arms, his eye opens once with fatigue and closes again, the open book stays perfectly still, lamp glow steady. Camera: very slow push-in toward his face. Environment: darkness holds, faint dust in the lamplight. Mood: another day gone empty, tiredness without work. Preserve face, hair, clothing, book position, desk layout, lamp on the left, night palette. No scene change, no sitting up, no pages turning, no readable text.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, sitting up, pages turning, daylight, second person

**Voice-over Match:** रात को वही बोझ — आज भी कुछ नहीं किया; खुली किताब और अनछुए पन्ने गवाह।

---


SCENE 011 → VIDEO PROMPT 011  (IMAGE 11 · source: `images/scene-011.jpg`)

**Scene Title:** क्या मुझमें कमी है?

**Script Reference:** 'नहीं। कमी तुम्हारे अंदर नहीं है। कमी उस तरीक़े में है जिससे तुम अपने दिमाग़ से सौदा कर रहे हो।'

**Image Analysis:** CHARACTER_01 के चेहरे का एक्सट्रीम क्लोज़-अप, थोड़ा ऑफ़-सेंटर; आँखों में थकान, होठों पर हल्की सिकुड़न — एक खामोश सवाल।

**Visual Action:** धीमी पलकें; भौंहों की बहुत हल्की सिकुड़न फिर ढीला होना; होठों का एक बार दबना; साँस की सूक्ष्म लय — बस।

**Camera Movement:** Static Cinematic Shot (बमुश्किल दिखता माइक्रो पुश-इन)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an extreme close-up of a young Indian man's face, slightly off-centre, tired eyes, lips faintly pressed together, a silent question on his expression. Animate: he blinks slowly, his brows tighten very slightly then release, his lips press once, subtle breathing moves his skin naturally; nothing more. Camera: locked static cinematic frame with an almost invisible micro push-in. Environment: background stays completely soft and unchanged. Mood: 'is something wrong with me?' — vulnerable, quiet. Preserve the exact face identity, skin texture, hairstyle, stubble, lighting direction and color palette. No scene change, no head turning away, no tears, no exaggerated expression, no smile.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, tears, crying, smiling, head turning, zooming out, identity drift

**Voice-over Match:** कमी तुम्हारे अंदर नहीं — कमी उस तरीक़े में है जिससे तुम दिमाग़ से सौदा कर रहे हो।

---

SCENE 012 → VIDEO PROMPT 012  (IMAGE 12 · source: `images/scene-012.jpg`)

**Scene Title:** सबसे भारी हिस्सा — जूते पहनना

**Script Reference:** 'जब तुम जिम जाने का मन नहीं होता, तो सबसे भारी हिस्सा क्या होता है? जूते पहनना। बस जूते पहनना।'

**Image Analysis:** ज़मीन पर बिछी चटाई और कुर्सी के पास रखे खेल के जूते; सुबह की ठंडी रोशनी; कमरे का बाक़ी हिस्सा धुँधला; फ़्लोर-लेवल लो-एंगल डिटेल शॉट। कोई पात्र नहीं।

**Visual Action:** कोई पात्र नहीं — वस्तुएँ स्थिर; सिर्फ़ सुबह की रोशनी में बहुत हल्का बदलाव और धूल के कणों का तैरना।

**Camera Movement:** Slow Push-in (floor level, जूतों की तरफ़)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a floor-level low-angle detail shot of sports shoes kept beside a mat and a chair in a dim room, cold early-morning light, the rest of the room blurred, no person visible. Animate: keep the shoes, mat and chair perfectly still; only the cool morning light brightens imperceptibly and faint dust drifts through the air. Camera: slow low push-in toward the shoes, making them feel like the heaviest thing in the room. Mood: the hardest part is just putting on the shoes. Preserve exact object positions, floor texture, chair legs, lighting direction and cold morning palette. No person entering frame, no shoes moving, no scene change, no invented objects.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person, feet, hands, shoes moving or shifting, warm daylight

**Voice-over Match:** जिम न जाने का सबसे भारी हिस्सा — बस जूते पहनना; जूते वहीं पड़े इंतज़ार करते।

---


SCENE 013 → VIDEO PROMPT 013  (IMAGE 13 · source: `images/scene-013.jpg`)

**Scene Title:** दरवाज़े से अंदर — पहुँच जाना

**Script Reference:** 'और जब तुम एक बार वहाँ पहुँच जाते हो, पाँच-दस मिनट कुछ कर लेते हो...'

**Image Analysis:** जिम का इंटीरियर; CHARACTER_01 दरवाज़े से अंदर घुस रहा है — कंधे पर तौलिया, हाथ में पानी की बोतल; चेहरे पर हल्की जान; वाइड एस्टैब्लिशिंग शॉट।

**Visual Action:** दरवाज़े से अंदर स्वाभाविक क़दम — यथार्थवादी चलन, तौलिया हल्का हिलना, बोतल हाथ में स्थिर; अंदर की तरफ़ एक छोटी सी नज़र; कंधों का खुलना।

**Camera Movement:** Static Cinematic Shot (पात्र फ़्रेम में आगे बढ़ता है)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–7 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide establishing shot of a simple gym interior as a young Indian man in a grey sports jacket enters through the door, towel on his shoulder, water bottle in hand, a faint liveliness returning to his face. Animate: he walks in with realistic natural body mechanics — steady steps, towel swaying slightly with his stride, bottle held firmly, he glances once into the gym, his shoulders open up as he crosses the doorway and moves a few steps inside. Camera: locked wide cinematic frame, letting him travel into the depth of the shot. Environment: gym lights steady, faint dust in the air. Mood: the hardest part is already over — he has arrived. Preserve character identity, jacket, towel, bottle, gym layout and lighting. No scene change, no extra people appearing, no unnatural walking.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, extra gym members, equipment moving, floating towel, warped legs, teleporting

**Voice-over Match:** एक बार पहुँच गए तो आधा काम हो गया — दरवाज़े से अंदर का क़दम ही असली जीत।

---


SCENE 014 → VIDEO PROMPT 014  (IMAGE 14 · source: `images/scene-014.jpg`)

**Scene Title:** शुरू हो गया — काम चल रहा है

**Script Reference:** 'पाँच-दस मिनट कुछ कर लेते हो, तो फिर वापस आते वक़्त अजीब सी ख़ुशी महसूस होती है।'

**Image Analysis:** CHARACTER_01 जिम में हल्का वार्म-अप/स्ट्रेच कर रहा है; माथे पर हल्का पसीना; चेहरे पर एकाग्रता, ख़ुशी नहीं; सेंटर-लेफ़्ट मीडियम शॉट, हल्का लो एंगल।

**Visual Action:** धीमा यथार्थवादी स्ट्रेच — भुजा/कंधे का एक सहज विस्तार, संतुलन के लिए हल्का वज़न बदलना; गहरी साँस; चेहरे पर स्थिर एकाग्रता।

**Camera Movement:** Slow Push-in (slightly low angle)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a slightly low-angle medium shot, the young man in a grey sports jacket warming up in the gym, light sweat on his forehead, face concentrated but not joyful, framed centre-left. Animate: he performs one slow realistic stretch — arms and shoulders extending smoothly, weight shifting subtly for balance, chest rising with a controlled breath, sweat sheen holding steady on his forehead, eyes focused ahead. Camera: slow steady push-in from the low angle, giving quiet weight to the effort. Environment: gym background stays soft and still. Mood: work in motion before motivation arrives. Preserve character identity, jacket, gym equipment positions, lighting and palette. No exaggerated exercise, no jumping, no extra people, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, jumping, fast workout, extra people, equipment moving, smiling broadly

**Voice-over Match:** पाँच-दस मिनट कुछ कर लेते हो — शरीर चल पड़ा, मन पीछे-पीछे आ रहा है।

---


SCENE 015 → VIDEO PROMPT 015  (IMAGE 15 · source: `images/scene-015.jpg`)

**Scene Title:** ख़ुशी काम के बाद आई

**Script Reference:** 'ये जो ख़ुशी है, ये पहले नहीं आई थी। ये काम के बाद आई।'

**Image Analysis:** वर्कआउट के बाद CHARACTER_01 जिम की बड़ी खिड़की के पास खड़ा; तौलिये से चेहरा पोंछ रहा है; कंधे ढीले, हल्की मुस्कान; विंडो से बैकलिट मीडियम क्लोज़-अप।

**Visual Action:** तौलिये से एक धीमा चेहरा पोंछना; कंधों का स्पष्ट ढीला पड़ना; एक संतुष्ट साँस; हल्की मुस्कान का धीरे उभरना — नाटकीय नहीं।

**Camera Movement:** Slow Pull-back (backlit)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a backlit medium close-up, the young man stands by the gym's large window after his workout, wiping his face with the towel, shoulders loose, a faint smile on his tired face. Animate: he lowers the towel slowly from his face, his shoulders drop with visible relief, he exhales a satisfied breath, and the small smile deepens just slightly — natural, not theatrical; window backlight glows steadily around him. Camera: slow gentle pull-back letting the window light widen around him. Mood: the happiness that came after the work, not before it. Preserve character identity, jacket, towel, window frame, gym background and backlight. No scene change, no laughing, no exaggerated celebration, no extra people.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, laughing, celebrating with fists, extra people, harsh light flare

**Voice-over Match:** ये ख़ुशी पहले नहीं थी — ये काम के बाद आई; motivation शुरुआत का नतीजा है।

---


SCENE 016 → VIDEO PROMPT 016  (IMAGE 16 · source: `images/scene-016.jpg`)

**Scene Title:** पहले क़दम, फिर मन

**Script Reference:** 'यानी motivation अक्सर शुरुआत का कारण नहीं होती — शुरुआत का नतीजा होती है। पहले क़दम, फिर मन।'

**Image Analysis:** फ़र्श पर दो वस्तुएँ एक फ़्रेम में: एक तरफ़ रखे खेल के जूते, दूसरी तरफ़ डेस्क पर खुली किताब; बीच में खाली जगह; कोई पात्र नहीं — 'पहले क़दम, फिर मन' का स्टिल-लाइफ़ प्रतीक।

**Visual Action:** कोई पात्र नहीं; वस्तुएँ स्थिर; कैमरा जूतों से किताब तक धीरे सरकता है — दोनों के बीच का खालीपन साफ़ दिखे।

**Camera Movement:** Gentle Sideways Dolly (जूतों → किताब)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide still-life composition across two areas of the same room — sports shoes kept on the floor on one side, an open book on the desk on the other, empty space between them, no person. Animate: keep both objects perfectly still; only faint dust drifts through the steady daylight. Camera: one slow smooth sideways dolly traveling from the shoes to the open book, holding the empty space between them in clear view — the visual link from first step to willing mind. Mood: quiet, symbolic, resolved. Preserve exact positions of shoes, book, desk and floor, room layout, lighting direction and palette. No person entering frame, no objects moving, no scene change, no readable text.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person, feet, hands, objects shifting, camera stopping abruptly, readable pages

**Voice-over Match:** Motivation अक्सर शुरुआत का कारण नहीं, नतीजा होती है — पहले क़दम, फिर मन।

---


SCENE 017 → VIDEO PROMPT 017  (IMAGE 17 · source: `images/scene-017.jpg`)

**Scene Title:** मौसम का इंतज़ार

**Script Reference:** 'हम motivation को मौसम की तरह मान लेते हैं। जैसे बारिश का इंतज़ार करते हैं — आएगी तो निकल पड़ेंगे।'

**Image Analysis:** CHARACTER_01 कुर्सी पर बैठा खिड़की की तरफ़ देख रहा है; बाहर बादल घिरे हैं, बारिश नहीं; OTS शॉट खिड़की की ओर।

**Visual Action:** बाहर बादलों का बहुत धीमा खिसकना; पात्र का हल्का सिर हिलाना और एक ठंडी साँस; भीतर का शरीर लगभग स्थिर — इंतज़ार की मुद्रा।

**Camera Movement:** Slow Push-in (OTS, खिड़की की तरफ़)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an over-the-shoulder shot from behind a young Indian man seated on his chair, looking toward the window where clouds have gathered outside but no rain is falling. Animate: outside, the clouds drift very slowly across the grey sky; inside, he breathes once and gives a tiny head movement, body otherwise still in a waiting posture; his fingers rest motionless. Camera: slow push-in over his shoulder toward the window. Environment: clouds moving gently is the only environmental motion; light stays flat and overcast. Mood: waiting for motivation like people wait for weather. Preserve character identity, clothing, chair, window frame, room layout and overcast palette. No rain starting, no scene change, no standing up.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, rain, sun breaking through, standing up, birds flying in

**Voice-over Match:** हम motivation को मौसम मान लेते हैं — आएगी तो निकल पड़ेंगे; बादल घिरे हैं, काम रुका है।

---


SCENE 018 → VIDEO PROMPT 018  (IMAGE 18 · source: `images/scene-018.jpg`)

**Scene Title:** रोज़ का नया बहाना

**Script Reference:** 'ये तुम्हारा दिमाग़ है, जो काम से बचने के लिए हर रोज़ एक नया बहाना बनाता है।'

**Image Analysis:** खाली कमरा: खाली कुर्सी, खुली किताब, बंद दरवाज़ा — वही सेटअप, पर कोई मौजूद नहीं; वाइड एम्प्टी-रूम शॉट।

**Visual Action:** कोई पात्र नहीं; सब स्थिर — सिर्फ़ रोशनी में धूल के कण और बहुत हल्का प्रकाश-बदलाव; खालीपन ही कहानी है।

**Camera Movement:** Slow Pull-back (कमरा और खाली होता जाता)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide empty-room shot — an empty wooden chair, an open book on the desk, a closed door, the same small Indian bedroom with nobody present. Animate: keep every object perfectly still; only faint dust floats in the steady light and the ambient brightness shifts imperceptibly. Camera: very slow pull-back, making the empty room feel larger and more accusatory. Mood: the brain invents a new excuse daily while the desk waits. Preserve room layout, chair, book, door positions, lighting direction and palette. No person appearing, no door opening, no objects moving, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person appearing, door opening, objects moving, chair shifting

**Voice-over Match:** दिमाग़ हर रोज़ काम से बचने का नया बहाना बनाता है — और कुर्सी खाली रह जाती है।

---


SCENE 019 → VIDEO PROMPT 019  (IMAGE 19 · source: `images/scene-019.jpg`)

**Scene Title:** धुँधला वाक्य, भारी बोझ

**Script Reference:** 'अपने दिमाग़ में ये वाक्य बोलो — मुझे पढ़ाई करनी है। अब क्या हुआ? कुछ नहीं हुआ।'

**Image Analysis:** CHARACTER_01 बिस्तर के किनारे बैठा; माथे पर हल्की शिकन, हाथ खाली; सोच में डूबा, कोई दिशा नहीं; फ़्रंट थ्री-क्वार्टर मीडियम शॉट।

**Visual Action:** बेचैन उँगलियों का आपस में धीरे रगड़ना; नज़र का बिना दिशा इधर-उधर टिकना; एक भरी हुई साँस; शिकन गहरी होना।

**Camera Movement:** Slow Push-in (front three-quarter)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a front three-quarter medium shot, a young Indian man sits on the edge of the bed, empty hands on his knees, a light crease on his forehead, lost in vague thought with no direction. Animate: his fingers rub together slowly in quiet restlessness, his gaze drifts without settling anywhere, he takes one heavy breath, the crease on his forehead deepens slightly. Camera: slow push-in from the front. Environment: room and light stay unchanged. Mood: the vague sentence 'I have to study' — creating weight but no movement. Preserve face identity, clothing, bed and room layout, lighting. No scene change, no standing up, no objects appearing in hands.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, standing up, phone or book appearing in hands, exaggerated gestures

**Voice-over Match:** धुँधला वाक्य 'मुझे पढ़ाई करनी है' — कुछ नहीं होता; दिमाग़ को दिशा ही नहीं मिली।

---


SCENE 020 → VIDEO PROMPT 020  (IMAGE 20 · source: `images/scene-020.jpg`)

**Scene Title:** विशिष्ट पहला क़दम

**Script Reference:** 'डेस्क पर बैठकर भौतिकी की किताब का तीसरा चैप्टर खोलूँगा और सिर्फ़ पहला सवाल हल करूँगा।'

**Image Analysis:** डेस्क पर खुली किताब का साफ़ पन्ना, बग़ल में नोटबुक और पेन; एक हाथ किनारे टिका हुआ — अब दिशा स्पष्ट; क्लोज़-अप डिटेल शॉट।

**Visual Action:** टिका हुआ हाथ हल्का सा आगे खिसकना; उँगलियों का पन्ने के किनारे पर स्थिर होना; पन्ना बहुत हल्का हिलना; निर्णय की स्थिरता।

**Camera Movement:** Static Cinematic Shot + micro push-in

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up detail shot over an open book with a clean visible page, a notebook and pen beside it, a hand resting at the edge of frame — direction now clear. Animate: the resting hand shifts slightly forward with quiet resolve, fingers settling firm on the page corner, the page lifts and settles with the faintest movement, everything else stays still. Camera: locked frame with a micro push-in toward the page. Environment: desk light steady. Mood: the specific first step — 'chapter three, the first question' — replacing vague weight. Preserve hand anatomy, book and notebook positions, desk surface, lighting and palette. No readable text becoming legible, no page turning fully, no new objects, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable handwriting or print, page flipping, pen grabbing, warped fingers, extra hands

**Voice-over Match:** विशिष्ट वाक्य — कौन-सी किताब, कौन-सा चैप्टर, कौन-सा सवाल; दिमाग़ को रास्ता दिख गया।

---


SCENE 021 → VIDEO PROMPT 021  (IMAGE 21 · source: `images/scene-021.jpg`)

**Scene Title:** पहला सवाल, पेन की नोक

**Script Reference:** 'दिमाग़ को पता है कि शरीर को कहाँ जाना है, हाथ से क्या करना है, और कब रुकना है।'

**Image Analysis:** एक्सट्रीम क्लोज़-अप: CHARACTER_01 का हाथ किताब का पन्ना पलट रहा है; दूसरे हाथ का पेन पन्ने पर रुका; नज़रें नीची (आंशिक चेहरा)।

**Visual Action:** पन्ने का एक सहज पलटाव; पेन का नीचे उतरना और एक छोटा स्ट्रोक लगाना (बिना पढ़ने योग्य अक्षर); उँगलियों की यथार्थवादी पकड़ और संपर्क।

**Camera Movement:** Static / micro push-in (hands और page पर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an extreme close-up on hands and an open book page — one hand turning the page, the other holding a pen poised above it, the man's lowered eyes partially visible. Animate: the fingers turn the page with a natural realistic flick, the page settles flat; the pen descends and makes one small deliberate stroke on the paper, hand-to-pen contact anatomically correct; no legible letters form. Camera: locked tight frame with a barely perceptible push-in. Environment: desk light steady. Mood: the brain now knows where the body goes and what the hand does. Preserve hand anatomy and skin, book texture, pen, sleeve and lighting. No warped hands, no extra fingers, no readable text, no page tearing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable handwriting, warped hands, extra fingers, pen morphing, page tearing, face coming fully into frame

**Voice-over Match:** दिमाग़ को पता है शरीर को कहाँ जाना है, हाथ से क्या करना है, और कब रुकना है।

---


SCENE 022 → VIDEO PROMPT 022  (IMAGE 22 · source: `images/scene-022.jpg`)

**Scene Title:** फ़ैसला पहले ही हो चुका है

**Script Reference:** 'जैसे — अगर रात के आठ बज गए, तो मैं किताब खोलकर बैठ जाऊँगा। फ़ैसला पहले ही हो चुका है।'

**Image Analysis:** डेस्क की दीवार पर एक छोटा सादा नोट चिपका है (कोई पढ़ने योग्य अक्षर नहीं); नीचे बंद किताब और पेन; फ़्रेम में कोई घड़ी/कैलेंडर नहीं — डिटेल शॉट।

**Visual Action:** कोई पात्र नहीं; नोट बिल्कुल स्थिर; सिर्फ़ लैंप/रोशनी की बहुत हल्की साँस और हवा में धूल — 'फ़ैसला पहले ही हो चुका है' की खामोशी।

**Camera Movement:** Slow Push-in (नोट की तरफ़)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a detail shot of a small plain note stuck on the wall beside the desk, no readable letters on it, a closed book and a pen on the desk below, no clock or calendar in frame. Animate: keep the note, book and pen perfectly still; only the warm light breathes faintly and tiny dust particles drift near the note. Camera: slow deliberate push-in toward the note until it fills more of the frame. Mood: the decision was already made earlier — nothing needs deciding now. Preserve note position and blankness, wall texture, book and pen placement, lighting direction. No text appearing on the note, no objects moving, no hand entering, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, text appearing on note, handwriting forming, hand entering frame, clock appearing

**Voice-over Match:** Implementation intention — 'जब रात के आठ बजेंगे, तो मैं किताब खोलकर बैठ जाऊँगा'; फ़ैसला पहले ही हो चुका।

---

SCENE 023 → VIDEO PROMPT 023  (IMAGE 23 · source: `images/scene-023.jpg`)

**Scene Title:** रात के आठ बजे — बस बैठना होगा

**Script Reference:** 'अगर रात के आठ बज गए, तो मैं किताब खोलकर बैठ जाऊँगा।'

**Image Analysis:** शाम/रात: CHARACTER_01 डेस्क की कुर्सी खींचकर बैठ रहा है, हाथ में किताब — फ़ैसला लिया नहीं, निभाया जा रहा है; साइड से मीडियम वाइड शॉट।

**Visual Action:** कुर्सी हल्का खिसकाना → सहज बैठना → किताब डेस्क पर रखना → खोलना; हर हरकत बिना हिचकिचाहट, रोज़मर्रा जैसी।

**Camera Movement:** Static wide + हल्का Slow Push-in

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium wide shot from the side of the desk at evening, a young Indian man pulls out his chair to sit down, a book in his hand — the decision is not being made, it is being honored. Animate: he slides the chair back slightly, sits down naturally with realistic body mechanics, places the book on the desk and opens it in one unhurried practiced sequence, face calm and routine. Camera: mostly locked wide frame with a gentle slow push-in as he settles. Environment: warm lamp glow steady, evening room unchanged. Mood: automatic execution of a pre-made decision. Preserve character identity, clothing, chair, desk and book positions, lighting and palette. No hesitation acting, no scene change, no extra objects, no readable text.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hesitation, standing back up, extra objects, readable pages

**Voice-over Match:** रात के आठ बजे — बस बैठना होगा; तय समय आया और शरीर अपने आप कुर्सी तक चला गया।

---


SCENE 024 → VIDEO PROMPT 024  (IMAGE 24 · source: `images/scene-024.jpg`)

**Scene Title:** खड़ी गाड़ी और धक्का

**Script Reference:** 'किसी भी काम को शुरू करने के लिए जो ताक़त चाहिए, वो काम जारी रखने के लिए चाहिए उससे कहीं ज़्यादा होती है। जैसे गाड़ी खड़ी है तो धक्का देने में सबसे ज़्यादा ज़ोर लगता है।'

**Image Analysis:** संकीर्ण गली में पुरानी खड़ी कार; एक अकेला युवक पिछले हिस्से पर दोनों हाथ रखे धक्का देने में झुका हुआ; लो-एंगल वाइड — मेहनत साफ़ दिखती।

**Visual Action:** पूरे शरीर से ज़ोर लगाना — झुकी पीठ, कसी मांसपेशियाँ, ज़मीन पर टिके पैर; कार अपनी जगह से हिलती भर है, चलती नहीं; साँस भारी।

**Camera Movement:** Slow Push-in (low angle, पीछे से)

**Motion Intensity:** HIGH

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a low-angle wide shot from behind an old parked car in a narrow lane, a lone young man bent over with both hands on the rear, pushing with visible effort. Animate: he strains with his whole body — back bent, legs braced, arms locked, muscles tensed, breathing hard; the car shudders and rocks slightly under the force but does not roll yet; his feet press and adjust against the ground realistically. Camera: slow push-in from the low rear angle, amplifying the weight of starting. Environment: lane walls and background stay still, faint dust shaken loose near the tyres. Mood: maximum effort at zero speed — activation energy. Preserve the man's identity, clothing, car shape and position, lane environment and lighting. No car suddenly moving fast, no extra people, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, car rolling away quickly, extra people helping, wheels spinning, exaggerated cartoonish strain

**Voice-over Match:** काम शुरू करने की ताक़त जारी रखने से कहीं ज़्यादा चाहिए — जैसे खड़ी गाड़ी को धक्का देना।

---


SCENE 025 → VIDEO PROMPT 025  (IMAGE 25 · source: `images/scene-025.jpg`)

**Scene Title:** चल पड़ी तो हल्के हाथ से

**Script Reference:** 'एक बार चल पड़ी तो फिर हल्के हाथ से भी चलती रहती है।'

**Image Analysis:** वही कार अब धीरे चल पड़ी; वही युवक बग़ल में चल रहा है, एक हाथ हल्के से कार पर, शरीर सीधा और ढीला; साइड व्यू ट्रैकिंग-स्टाइल शॉट।

**Visual Action:** कार की धीमी लुढ़कन, पहियों की सहज घूमन; युवक का बग़ल में आराम से चलना — एक हाथ हल्का टिका, कंधे ढीले; मेहनत से सहजता में बदलाव।

**Camera Movement:** Slow Tracking Shot (side, कार के साथ)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: the same old car now rolling slowly along the narrow lane, the same young man walking beside it with one hand resting lightly on the body, posture upright and relaxed. Animate: the car rolls smoothly at walking pace, wheels turning realistically, the man strides alongside with an easy gait, his hand barely guiding, shoulders loose, breathing calm — the effort has visibly become effortless. Camera: slow smooth side tracking shot moving with the car. Environment: lane background slides past naturally, light dust behind the tyres. Mood: once moving, momentum carries it. Preserve the man's identity and clothing, the car's exact look, lane environment and lighting. No car speeding up, no extra people or vehicles, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, car accelerating, engine smoke, extra vehicles, people appearing, running

**Voice-over Match:** एक बार चल पड़ी तो हल्के हाथ से भी चलती रहती है — शुरुआत के बाद काम अपना वज़न खो देता है।

---


SCENE 026 → VIDEO PROMPT 026  (IMAGE 26 · source: `images/scene-026.jpg`)

**Scene Title:** दो मिनट — सिर्फ़ किताब खोलनी है

**Script Reference:** 'दो मिनट का नियम इसीलिए काम आता है — पहले दिन सिर्फ़ किताब खोलनी है, बस।'

**Image Analysis:** डार्क कमरे में सिर्फ़ डेस्क पर रोशनी; CHARACTER_01 के दोनों हाथ बंद किताब को खोल रहे हैं; क्लोज़-अप डिटेल शॉट।

**Visual Action:** कवर पर हाथ का टिकना → धीरे खोलना → पन्नों का खुद बराबर होना → उँगलियों का पन्ने पर थामना; दो मिनट के नियम की न्यूनतम क्रिया।

**Camera Movement:** Slow Push-in / micro tilt-down (पन्ने पर)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up detail shot in a dark room lit only at the desk, two hands of the young man opening a closed book under the lamplight. Animate: the hands rest on the cover, open it slowly and deliberately, the pages fan and settle naturally, fingertips press gently on the open page to hold it — the smallest possible action, done. Camera: slow push-in with a micro tilt-down onto the opened page. Environment: darkness around holds steady, lamp glow warm and stable, faint dust in the light. Mood: the two-minute rule — today only the book has to open. Preserve hand anatomy, book cover and page texture, desk surface, lamp light direction. No readable text becoming legible, no page tearing, no extra objects, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, pages tearing, extra objects appearing, hands morphing, room lights turning on

**Voice-over Match:** दो मिनट का नियम — पहले दिन सिर्फ़ किताब खोलनी है, बस; इतना छोटा काम कि मना करना अजीब लगे।

---


SCENE 027 → VIDEO PROMPT 027  (IMAGE 27 · source: `images/scene-027.jpg`)

**Scene Title:** एक दिन कुछ नहीं, एक दिन पूरा छोड़ना

**Script Reference:** 'एक दिन कुछ नहीं करना और एक दिन पूरा छोड़ देना — इन दोनों में फ़र्क़ बहुत बड़ा है।'

**Image Analysis:** दीवार के सादे कैलेंडर पर एक दिन पर हल्का निशान; बाक़ी पन्ने साफ़; कोई संख्या/महीना पढ़ने योग्य नहीं; डिटेल शॉट।

**Visual Action:** कोई पात्र नहीं; कैलेंडर स्थिर; रोशनी का बहुत धीमा बदलाव निशान पर ज़ोर देता; धूल के कण तैरते।

**Camera Movement:** Slow Push-in (निशान की तरफ़)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a detail shot of a plain wall calendar with one faint mark on a single day, the remaining squares clean, no readable numbers or month names. Animate: keep the calendar perfectly still; only the ambient light shifts imperceptibly to emphasize the lone mark while faint dust drifts past. Camera: slow steady push-in toward the marked square. Mood: one day of doing nothing and one day of quitting entirely are very different things — this mark is the difference. Preserve the calendar's blank legibility state, mark position, wall texture and lighting. No numbers becoming readable, no new marks appearing, no hand entering, no page flipping, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable numbers or month names, new marks appearing, hand entering, calendar page flipping

**Voice-over Match:** एक दिन कुछ नहीं करना और एक दिन पूरा छोड़ देना — फ़र्क़ इस एक हल्के निशान का है।

---


SCENE 028 → VIDEO PROMPT 028  (IMAGE 28 · source: `images/scene-028.jpg`)

**Scene Title:** अधूरा काम सिर में घूमता रहता है

**Script Reference:** 'शुरू किया और बीच में छोड़ा, तो दिमाग़ उसे बार-बार वापस खींचता है। इसीलिए पाँच मिनट काम करके उठ जाना, बिल्कुल काम न करने से बेहतर है।'

**Image Analysis:** CHARACTER_01 कमरे में टहल रहा है; डेस्क पर आधा खुला पन्ना पीछे छूटा; उसकी नज़र बार-बार डेस्क की तरफ़ जाती है; मीडियम वाइड शॉट।

**Visual Action:** धीमी बेचैन टहलना — यथार्थवादी क़दम और मुड़ना; हर चक्कर में नज़र का डेस्क की तरफ़ खिंचना; एक बार रुककर देखना, फिर चल पड़ना।

**Camera Movement:** Gentle Pan (टहलते पात्र का पीछा)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium wide shot, the young man paces the room while a half-open book page waits on the desk behind him, his gaze repeatedly pulled back toward the desk. Animate: he paces with slow restless realistic steps, turns at the room's edge with natural body mechanics; each time he passes, his eyes flick toward the desk, once he pauses mid-step to look at the open book, then resumes pacing — an unfinished task tugging at him. Camera: gentle slow pan following his path, keeping the desk in background view. Environment: room and light stay steady. Mood: the Zeigarnik pull — started work refuses to leave the head. Preserve character identity and clothing, desk and book positions, room layout, lighting. No scene change, no sitting down, no exaggerated gesturing.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, sitting down, book closing, fast running, exaggerated arm waving

**Voice-over Match:** शुरू किया और बीच में छोड़ा तो दिमाग़ बार-बार वापस खींचता है — पाँच मिनट काम, शून्य से बेहतर।

---


SCENE 029 → VIDEO PROMPT 029  (IMAGE 29 · source: `images/scene-029.jpg`)

**Scene Title:** तुम्हारा फ़ोन कहाँ है?

**Script Reference:** 'सच बोलो — तुम्हारा फ़ोन कहाँ है इस वक़्त?'

**Image Analysis:** अंधेरे कमरे में CHARACTER_01 के हाथ/गोद में फ़ोन; स्क्रीन की ठंडी नीली चमक सीधे चेहरे पर; क्लोज़-अप।

**Visual Action:** चेहरे पर नीली चमक का हल्का बदलना (स्क्रीन बदलने जैसा, बिना UI); आँखों का स्क्रीन को ट्रैक करना; धीमी पलकें; स्थिर शरीर।

**Camera Movement:** Static Cinematic Shot (बमुश्किल माइक्रो पुश)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up of the young man's face in a dark room, lit only by the cold blue glow of a phone held in his lap, screen content unreadable. Animate: the blue glow shifts subtly across his face as if the screen content changes, his eyes track the screen slowly, he blinks a few times, his body stays sunk and still — attention fully captured. Camera: locked cinematic frame with an almost invisible micro push-in. Environment: the dark room holds, no other light changes. Mood: 'be honest — where is your phone right now?' — caught red-handed. Preserve face identity, stubble, hair, phone position, blue-cold lighting ratio. No readable screen content, no scene change, no looking up at camera.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, app UI, looking at camera, room lights turning on

**Voice-over Match:** सच बोलो — तुम्हारा फ़ोन इस वक़्त कहाँ है? जवाब चेहरे पर नीली चमक बनकर दिख रहा है।

---


SCENE 030 → VIDEO PROMPT 030  (IMAGE 30 · source: `images/scene-030.jpg`)

**Scene Title:** हर पाँच मिनट एक फ़ैसला

**Script Reference:** 'तुम हर पाँच मिनट में एक छोटा सा फ़ैसला ले रहे हो — उठाऊँ या न उठाऊँ।'

**Image Analysis:** ओवरहेड शॉट: टेबल के निकट आधे हिस्से में फ़ोन, दूर आधे में किताब — एक ही फ़्रेम में दोनों; पीछे धुँधले में किताब की तरफ़ बढ़ता एक हाथ; खिंचाव दिखता।

**Visual Action:** हाथ का फ़ोन और किताब के बीच ठहरना — एक बार फ़ोन की ओर झुकना, फिर मुड़कर किताब की उँगलियों से छूना; फ़ैसले का शारीरिक ड्रामा।

**Camera Movement:** Static overhead + slow push-in

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an overhead shot of a desk split in halves — a phone lying in the near half, a book in the far half, and one hand in the blurred background reaching toward the book, a visible tug-of-war in one frame. Animate: the hand hovers between the two halves, drifts slightly toward the phone, hesitates, then turns decisively and settles on the book's edge; the phone stays perfectly still and untouched. Camera: locked overhead frame with a slow subtle push-in. Environment: desk light steady. Mood: every five minutes you make the same small decision — pick up or not pick up. Preserve hand anatomy, phone and book positions, desk surface and lighting. No phone lighting up, no hand grabbing phone, no readable text, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone lighting up, hand touching phone, readable text, warped fingers, extra hands

**Voice-over Match:** हर पाँच मिनट एक छोटा फ़ैसला — उठाऊँ या न उठाऊँ; यही फ़ैसले दिन भर की थकान बनाते हैं।

---


SCENE 031 → VIDEO PROMPT 031  (IMAGE 31 · source: `images/scene-031.jpg`)

**Scene Title:** शाम की थकान — कहाँ से आई?

**Script Reference:** 'इंसान का दिमाग़ बार-बार फ़ैसले लेने से थकता है... इसीलिए रात को हम वही करते हैं जो सबसे कम मेहनत माँगता है।'

**Image Analysis:** शाम; CHARACTER_01 कुर्सी पर ढीला पड़ा, सिर पीछे टिका, आँखें बंद; हाथ से फ़ोन छूटकर गोद में; डेस्क पर काम अधूरा; हाई-एंगल मीडियम शॉट।

**Visual Action:** गहरी थकी साँसों से शरीर का ढीला उठना-गिरना; सिर का एक तरफ़ लुढ़कना; गोद में पड़ा फ़ोन स्थिर; उँगलियाँ बिल्कुल शिथिल।

**Camera Movement:** Slow Push-in (slightly high angle)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a slightly high-angle medium shot looking down at the young man slumped in his chair, head tilted back, eyes closed, the phone slipped loose into his lap, unfinished work on the desk. Animate: his chest rises and falls in slow exhausted breaths, his head rolls very slightly to one side, fingers stay completely limp, the phone rests motionless in his lap; the unfinished pages on the desk stay still. Camera: slow push-in from above, compressing the fatigue. Environment: evening light holds dim and steady. Mood: decision fatigue — the brain defaults to whatever asks the least effort. Preserve character identity, slumped posture, phone position, desk state, lighting. No waking up, no phone grabbing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, waking up suddenly, grabbing phone, sitting upright, daylight shift

**Voice-over Match:** बार-बार फ़ैसले लेने से दिमाग़ थकता है — रात को वही करते हैं जो सबसे कम मेहनत माँगे।

---


SCENE 032 → VIDEO PROMPT 032  (IMAGE 32 · source: `images/scene-032.jpg`)

**Scene Title:** ग़लत चीज़ को पहुँच से बाहर

**Script Reference:** 'इसका हल ये नहीं है कि तुम ख़ुद को कसकर पकड़ो। हल ये है कि ग़लत चीज़ को पहुँच से बाहर कर दो। फ़ोन को दूसरे कमरे में रख दो।'

**Image Analysis:** CHARACTER_01 कमरे के खुले दरवाज़े पर खड़ा, फ़ोन को बाहर की तरफ़ रख रहा है — फ़ोन अब पहुँच से बाहर; अंदर से दरवाज़े की ओर मीडियम शॉट।

**Visual Action:** दरवाज़े तक क़दम → झुककर फ़ोन बाहर रखना → हाथ खाली लौटना → एक पल ठहरकर दरवाज़ा देखना; हरकत में राहत, दुख नहीं।

**Camera Movement:** Slow Push-in (कमरे के अंदर से दरवाज़े की ओर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot from inside the room toward the open doorway, the young man standing at the threshold placing his phone outside on the far side — out of arm's reach. Animate: he bends slightly and sets the phone down with a deliberate calm motion, straightens up with empty hands, pauses one beat looking at the doorway, then turns back into the room with visible lightness in his shoulders. Camera: slow push-in from inside the room toward the doorway. Environment: room light steady, corridor dim. Mood: the solution is not gripping harder — it is moving the temptation out of reach. Preserve character identity, clothing, doorframe and room layout, phone position after placement, lighting. No phone buzzing or lighting, no scene change, no extra people.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone lighting up, person walking out of room, door slamming, extra people in corridor

**Voice-over Match:** हल ख़ुद को कसकर पकड़ना नहीं — फ़ोन को दूसरे कमरे में रख देना; पहुँच से बाहर, झगड़ा ख़त्म।

---


SCENE 033 → VIDEO PROMPT 033  (IMAGE 33 · source: `images/scene-033.jpg`)

**Scene Title:** दराज में बंद फ़ोन

**Script Reference:** 'दराज में बंद फ़ोन और मेज़ पर रखा फ़ोन — ये दो अलग-अलग दुनिया हैं।'

**Image Analysis:** खुली दराज के अंदर फ़ोन स्क्रीन-नीचे रखा; बाहर डेस्क की किनारी और धुँधली रोशनी; क्लोज़-अप डिटेल शॉट।

**Visual Action:** कोई पात्र नहीं; फ़ोन और दराज स्थिर; दराज के अंदर की रोशनी का बहुत धीमा गहरा होना — बंद होने का अहसास बिना दराज हिलाए; बाहर हल्की धूल।

**Camera Movement:** Slow Push-in (दराज के अंदर)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up detail shot inside an open drawer where a phone lies face-down, the desk edge and dim room light visible outside the drawer. Animate: keep the phone and drawer perfectly still; the light inside the drawer dims very slowly as if evening deepens, faint dust drifts near the desk edge; nothing moves physically. Camera: slow push-in into the drawer, the face-down phone filling more of the frame. Mood: a phone closed in a drawer and a phone lying on the table are two different worlds. Preserve phone position and orientation, drawer interior, desk edge, lighting direction and palette. No hand entering, no drawer closing, no phone lighting up, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hand entering frame, drawer sliding, phone screen lighting, phone vibrating

**Voice-over Match:** दराज में बंद फ़ोन और मेज़ पर रखा फ़ोन — ये दो अलग-अलग दुनिया हैं।

---

SCENE 034 → VIDEO PROMPT 034  (IMAGE 34 · source: `images/scene-034.jpg`)

**Scene Title:** किताब तकिए के नीचे

**Script Reference:** 'किताब को तकिए के नीचे मत रखो।'

**Image Analysis:** बिस्तर पर तकिए के नीचे आधा दबा किनारा निकालती किताब — छिपी, अनदेखी; डिटेल शॉट; कोई पात्र नहीं।

**Visual Action:** कोई पात्र नहीं; तकिया और किताब स्थिर; सिर्फ़ रोशनी की बहुत हल्की साँस — छिपी किताब का खामोश पड़ा रहना ही कहानी है।

**Camera Movement:** Slow Push-in (किताब के किनारे पर)

**Motion Intensity:** LOW

**Suggested Duration:** 4–5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a detail shot on the bed and pillow — a book half-hidden under the pillow with only its edge sticking out, ignored, no person visible. Animate: keep the book, pillow and bedding completely still; only the ambient light breathes faintly and a speck or two of dust drifts across the frame. Camera: slow push-in on the protruding book edge. Mood: hiding the book changes nothing — it stays unseen where it lies. Preserve the exact position of book, pillow and blanket folds, lighting direction and palette. No hand pulling the book, no person appearing, no bedding shifting, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hand entering, person appearing, book sliding out, blanket moving

**Voice-over Match:** किताब को तकिए के नीचे मत रखो — छिपी चीज़ इंतज़ार ही करती है, काम नहीं बनती।

---


SCENE 035 → VIDEO PROMPT 035  (IMAGE 35 · source: `images/scene-035.jpg`)

**Scene Title:** खुली किताब, वही पन्ना

**Script Reference:** 'उसे खोली हुई हालत में डेस्क पर रखो, जिस पन्ने पर कल रुके थे वहीं। अगली सुबह तुम्हें फ़ैसला नहीं लेना पड़ेगा — बस बैठना होगा।'

**Image Analysis:** सुबह की पहली रोशनी; डेस्क पर किताब खुली पड़ी, पन्ने पर पेन रखा; कुर्सी खाली, कमरा शांत; वाइड मॉर्निंग शॉट।

**Visual Action:** कोई पात्र नहीं; सुबह की रोशनी का बहुत धीरे बढ़ना और फ़ैलना; खुले पन्ने पर रोशनी का सरकना; बाक़ी सब स्थिर।

**Camera Movement:** Slow Push-in / gentle drift (डेस्क की ओर)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide quiet morning shot of the prepared desk — an open book with a pen resting on the page in the first morning light, the chair empty, the room calm, no person. Animate: the room stays perfectly still while the soft morning light slowly strengthens and creeps across the open page; faint dust floats in the growing light. Camera: one slow gentle drift/push-in toward the waiting desk. Mood: tomorrow morning no decision will be needed — just sit down. Preserve book, pen and chair positions, desk layout, window light direction and warm-morning palette. No person entering, no pages turning, no readable text, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person entering, pages turning, pen rolling, readable text, light flickering

**Voice-over Match:** रात में खोलकर रखी किताब, वही पन्ना — सुबह बस बैठना होगा, फ़ैसला नहीं लेना होगा।

---


SCENE 036 → VIDEO PROMPT 036  (IMAGE 36 · source: `images/scene-036.jpg`)

**Scene Title:** जिम की ड्रेस और भरी बोतल

**Script Reference:** 'जिम की ड्रेस रात को ही निकालकर कुर्सी पर टाँग दो। पानी की बोतल भरकर रख दो।'

**Image Analysis:** रात: कुर्सी की पीठ पर टँगा हल्का स्पोर्ट्स जैकेट, नीचे रखे जूते; डेस्क के किनारे भरी पानी की बोतल; मीडियम डिटेल शॉट।

**Visual Action:** कोई पात्र नहीं; जैकेट का हवा से न होकर बिल्कुल हल्का स्थिर रहना; बोतल और जूते स्थिर; रात की रोशनी में सूक्ष्म बदलाव — तैयारी की खामोशी।

**Camera Movement:** Gentle Sideways Dolly (जैकेट → बोतल)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium detail shot at night — a light sports jacket hanging on the chair back, shoes kept on the floor below, a filled water bottle at the desk edge, no person. Animate: everything stays perfectly still; only the night light shifts imperceptibly across the jacket fabric and faint dust drifts near the lamp. Camera: one slow smooth sideways dolly from the hanging jacket to the filled bottle, cataloguing the quiet preparations. Mood: discipline as boring preparation, not bravery. Preserve jacket folds, shoe positions, bottle and desk layout, night palette and lamp glow from the left. No person appearing, no clothing moving in wind, no objects shifting, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person, jacket swinging, shoes moving, bottle falling, daylight

**Voice-over Match:** जिम की ड्रेस रात को ही निकालकर टाँग दो, बोतल भरकर रख दो — अनुशासन अक्सर बोरिंग तैयारी है।

---


SCENE 037 → VIDEO PROMPT 037  (IMAGE 37 · source: `images/scene-037.jpg`)

**Scene Title:** अनुशासन = बोरिंग तैयारी

**Script Reference:** 'अनुशासन ज़्यादातर एक बहादुरी का काम नहीं होता। वो अक्सर बोरिंग तैयारी का काम होता है।'

**Image Analysis:** रात; CHARACTER_01 शांत भाव से डेस्क सजा रहा है — किताब सीधी करना, पेन रखना, लैंप जलाना; कोई नाटकीयता नहीं; आई-लेवल मीडियम शॉट।

**Visual Action:** तीन सहज क्रम: किताब को हाथ से सीधा करना → पेन उसके ऊपर/किनारे रखना → लैंप ऑन (रोशनी का गर्म होना); चेहरा रोज़मर्रा-शांत, रिचुअल जैसा।

**Camera Movement:** Static + micro push-in (हरकत पर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an eye-level medium night shot, the young man calmly tidying his desk — straightening the book, setting down the pen, switching on the table lamp, no drama on his face. Animate: in one unhurried practiced sequence he squares the book with both hands, lays the pen neatly beside it, reaches over and switches on the lamp so warm light blooms across the desk, his expression staying calm and routine throughout. Camera: mostly locked frame with a micro push-in during the lamp switch. Environment: the lamp glow is the main light change; room otherwise steady. Mood: discipline as a quiet everyday ritual. Preserve character identity and clothing, desk objects and their final positions, lamp on the left, night palette. No scene change, no extra objects, no exaggerated expressions, no readable text.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, exaggerated gestures, extra objects appearing, readable text, lights flickering

**Voice-over Match:** अनुशासन बहादुरी का काम नहीं — रोज़ की बोरिंग तैयारी का काम है; किताब सीधी, पेन रखा, लैंप जला।

---


SCENE 038 → VIDEO PROMPT 038  (IMAGE 38 · source: `images/scene-038.jpg`)

**Scene Title:** मन नहीं करता — एक तथ्य की तरह

**Script Reference:** 'मन नहीं करता — ये वाक्य हम ऐसे कहते हैं जैसे ये कोई तथ्य हो।'

**Image Analysis:** शाम; CHARACTER_01 बिस्तर पर बैठा, कंधे गिरे, दोनों हाथ घुटनों पर; चेहरे पर हार मानने जैसे भाव; फ़्रंट मीडियम शॉट, सादा बैकग्राउंड।

**Visual Action:** कंधों का और थोड़ा गिरना; एक भारी साँस; नज़र का नीचे टिके रहना; हाथ घुटनों पर स्थिर — 'मन नहीं करता' को तथ्य मान लेना।

**Camera Movement:** Slow Push-in (straight-on)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a straight-on medium shot with a plain background, the young man sits on the bed in the evening, shoulders dropped, both hands resting on his knees, a defeated expression as if stating a fact. Animate: his shoulders sink a fraction lower, he lets out one heavy audible-looking sigh, his gaze stays fixed downward, hands remain still on his knees; only breathing moves him. Camera: slow steady frontal push-in. Environment: evening light holds flat and dim. Mood: surrender dressed up as a fact — 'I don't feel like it'. Preserve face identity, clothing, bed and room, lighting and palette. No standing up, no crying, no phone, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, standing up, crying, phone appearing, smiling, dramatic head drop

**Voice-over Match:** 'मन नहीं करता' — हम ये वाक्य ऐसे कहते हैं जैसे कोई तथ्य हो; हार मानने वाली मुद्रा।

---


SCENE 039 → VIDEO PROMPT 039  (IMAGE 39 · source: `images/scene-039.jpg`)

**Scene Title:** किसे कहते हो 'मन'?

**Script Reference:** 'जरा इस वाक्य को तोड़कर देखो। मन नहीं करता — किसका मन? किस वक़्त का मन?'

**Image Analysis:** CHARACTER_01 के चेहरे का टाइट क्लोज़-आधा हिस्सा; आँखें थोड़ी सिकुड़ी, सोचती हुई; रोशनी दो अलग दिशाओं से — सवाल की दोधारी छाया।

**Visual Action:** आँखों का धीरे सिकुड़ना-खुलना; नज़र का सोचते हुए एक बिंदु से दूसरे बिंदु जाना; भौंह की एक हल्की उठन; बाक़ी चेहरा स्थिर।

**Camera Movement:** Static / micro push-in (टाइट)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a tight close-up on half of the young man's face — eyes slightly narrowed in thought, lit from two different directions casting a split quality of shadow. Animate: his eyes narrow and widen slowly in thinking, his gaze shifts from one unseen point to another, one eyebrow lifts faintly as the old sentence is examined; the rest of the face stays still. Camera: locked tight frame with an invisible micro push-in. Environment: both light sources stay constant. Mood: breaking the sentence apart — whose mind? the mind of which moment? Analytical, not emotional. Preserve exact facial identity, stubble, skin texture, dual lighting setup and palette. No head turning away, no scene change, no expression swing to smile or anger.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, head turning away, smiling, angry expression, lighting change, identity drift

**Voice-over Match:** इस वाक्य को तोड़कर देखो — मन नहीं करता: किसका मन? किस वक़्त का मन? सवाल चेहरे पर साफ़।

---


SCENE 040 → VIDEO PROMPT 040  (IMAGE 40 · source: `images/scene-040.jpg`)

**Scene Title:** मूड सब कुछ अपने रंग में दिखाता है

**Script Reference:** 'जब तुम उदास या थके हुए होते हो, तो काम ज़्यादा भारी लगता है, तुम्हारी क़ाबिलियत कम लगती है, और भविष्य धुँधला लगता है।'

**Image Analysis:** CHARACTER_01 डेस्क के सामने बैठा; कमरा उसके चारों ओर असामान्य रूप से गहरा और धुँधला — किताब के पन्ने अंधेरे में डूबे; मूड का रंग सब कुछ रंगता; वाइड शॉट।

**Visual Action:** पात्र छोटा और स्थिर; उसके चारों ओर का अंधेरा बहुत धीरे गहरा होता/सरकता महसूस हो; उसकी नज़र नीची, कंधे झुके; कोई तेज़ हरकत नहीं।

**Camera Movement:** Slow Pull-back (अलगाव बढ़ाने के लिए)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide shot of the young man at his desk with the room around him rendered unusually deep and hazy, the book pages sinking into shadow — mood coloring the entire world. Animate: he stays small and still, gaze lowered, shoulders curved inward; the darkness around him seems to thicken and creep very slowly closer, the hazy edges of the room breathing subtly; dust hangs heavy in the dim air. Camera: very slow pull-back, widening the oppressive space around him. Mood: when tired or sad, the work looks heavier and the future looks blurred. Preserve character identity and clothing, desk and book positions, the exaggerated-darkness look and palette. No sudden light change, no person moving away, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, brightening light, standing up, objects moving, horror elements, monsters

**Voice-over Match:** उदास/थके मूड में काम ज़्यादा भारी, क़ाबिलियत कम, भविष्य धुँधला लगता है — मूड सब कुछ रंग देता।

---


SCENE 041 → VIDEO PROMPT 041  (IMAGE 41 · source: `images/scene-041.jpg`)

**Scene Title:** आराम भी काम का हिस्सा है

**Script Reference:** 'अगर शरीर सच में थका हुआ है, अगर नींद पूरी नहीं हुई... तो आराम करना भी काम का हिस्सा है।'

**Image Analysis:** रात; CHARACTER_01 बिस्तर पर करवट लेकर सो रहा, कंबल कंधे तक; हल्की रात की रोशनी; डेस्क पर किताब बंद — आराम भी काम का हिस्सा; वाइड शांत शॉट।

**Visual Action:** सोते हुए शरीर की धीमी साँस-लय; कंबल का साँस के साथ बहुत हल्का उठना-गिरना; चेहरा शांत, बिना तनाव; बाक़ी कमरा स्थिर।

**Camera Movement:** Static / very slow push-in

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide quiet night shot of the young man sleeping on his side in bed, blanket pulled to his shoulders, soft night light in the room, the closed book waiting on the desk. Animate: his body breathes in a slow even sleep rhythm, the blanket rises and falls barely perceptibly with each breath, his face stays relaxed and untroubled; the closed book and the rest of the room remain perfectly still. Camera: locked or very slow push-in, respectful and quiet. Environment: night light holds steady. Mood: real rest as part of the work, not escape from it. Preserve character identity even in sleep, bedding folds, desk and book positions, night palette. No tossing and turning, no waking, no scene change, no dramatic shadows.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, waking up, tossing, eyes opening, daylight, dramatic lightning

**Voice-over Match:** शरीर सच में थका है, नींद पूरी नहीं — तो आराम करना भी काम का हिस्सा है।

---


SCENE 042 → VIDEO PROMPT 042  (IMAGE 42 · source: `images/scene-042.jpg`)

**Scene Title:** थका हूँ या बोर हो रहा हूँ?

**Script Reference:** 'मैं थका हुआ हूँ और मुझे बोरियत हो रही है और आसान चीज़ चाहिए — ये दो अलग-अलग बातें हैं।'

**Image Analysis:** CHARACTER_01 कुर्सी पर बैठा एक हाथ से चेहरा दबाए; दूसरा हाथ डेस्क पर खुली किताब के पास; नज़र किताब पर नहीं, खिड़की पर; फ़ोरग्राउंड में किताब का कोना।

**Visual Action:** चेहरे दबाए हाथ का धीरे नीचे खिसकना; नज़र का खिड़की से मुड़कर किताब पर आना और फिर भटकना; थकान बनाम बोरियत की पहचान करने वाला ठहराव।

**Camera Movement:** Slow Push-in (फ़ोरग्राउंड किताब के साथ)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot with the open book in the foreground corner, the young man sits with one hand pressed over his face, the other hand near the book, eyes pointed at the window instead of the pages. Animate: the hand over his face slides slowly down, he turns his gaze from the window toward the open book, holds it a beat, then it drifts away again; a small tired exhale moves his shoulders. Camera: slow push-in keeping the foreground book softly in frame. Environment: room light steady. Mood: 'I am tired' and 'I am bored' — two different things, confusion on the face. Preserve character identity and clothing, hand positions, book and desk layout, lighting. No phone appearing, no standing up, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone appearing, standing up, book closing, exaggerated frustration

**Voice-over Match:** 'मैं थका हुआ हूँ' और 'मुझे आसान चीज़ चाहिए' — दो अलग बातें हैं; पहचानने वाला ठहराव।

---


SCENE 043 → VIDEO PROMPT 043  (IMAGE 43 · source: `images/scene-043.jpg`)

**Scene Title:** पाँच मिनट का सौदा

**Script Reference:** 'बोलो — मैं सिर्फ़ पाँच मिनट करूँगा। अगर पाँच मिनट बाद सच में बर्दाश्त नहीं हो रहा, तो छोड़ दूँगा।'

**Image Analysis:** CHARACTER_01 कुर्सी पर आगे झुका, एक उँगली उठी जैसे ख़ुद से वादा कर रहा हो; डेस्क पर किताब खुली, कोई फ़ोन नहीं; फ़्रंट थ्री-क्वार्टर मीडियम क्लोज़-अप।

**Visual Action:** उठी उँगली के साथ हल्का सिर हिलाना (ख़ुद से वादा); आगे झुककर डेस्क की तरफ़ होना; चेहरे पर सौदे की शांत गंभीरता; उँगली का एक बार हल्का थिरकना।

**Camera Movement:** Slow Push-in (फ़्रंट थ्री-क्वार्टर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a front three-quarter medium close-up, the young man leans forward on the chair with one finger raised as if making a promise to himself, the open book on the desk, no phone anywhere. Animate: with the raised finger he gives himself one small firm nod, his finger trembles slightly with emphasis, then he leans further forward toward the desk, expression settling into calm seriousness — the five-minute deal is struck. Camera: slow steady push-in from the front. Environment: room and light unchanged. Mood: a negotiation with the self, quiet and decisive. Preserve character identity, clothing, raised-hand anatomy, book and desk positions, lighting. No phone appearing, no exaggerated pointing at camera, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone appearing, pointing at camera, extra people, warped fingers

**Voice-over Match:** पाँच मिनट का सौदा — 'सिर्फ़ पाँच मिनट करूँगा, बर्दाश्त न हुआ तो छोड़ दूँगा'; उँगली उठी, वादा हुआ।

---


SCENE 044 → VIDEO PROMPT 044  (IMAGE 44 · source: `images/scene-044.jpg`)

**Scene Title:** पाँच मिनट बाद — रुका नहीं

**Script Reference:** 'ज़्यादातर बार पाँच मिनट के बाद क्या होता है? तुम रुकते नहीं।'

**Image Analysis:** CHARACTER_01 अब पूरी तरह काम में डूबा; पेन चल रहा, नोटबुक पर हल्की धुँधली रेखाएँ, किताब के पन्ने मुड़े; साइड मीडियम शॉट।

**Visual Action:** लगातार सहज लिखना — पेन की सतत लय; एक बार पन्ना पलटना; बीच में नज़र किताब पर जाना; फ़ोकस वाली सूक्ष्म भाव-मुद्राएँ।

**Camera Movement:** Slow Push-in (side)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium side shot, the young man now fully absorbed in work — pen moving across the notebook in soft blurred strokes, book pages folded, face in quiet focus. Animate: he writes in a steady natural rhythm, glances down at the open book, turns one page with his free hand, then continues writing without breaking flow; small absorbed micro-expressions, breathing even. Camera: slow push-in from the side, drawing the viewer into the flow. Environment: desk light steady, room quiet. Mood: five minutes passed — and he did not stop. Preserve character identity and clothing, notebook and book positions, desk layout, lighting. No readable handwriting forming, no phone, no scene change, no sudden stop.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable handwriting, phone appearing, stopping work abruptly, standing up

**Voice-over Match:** ज़्यादातर बार पाँच मिनट के बाद तुम रुकते नहीं — शुरुआत ही असली दीवार थी।

---

SCENE 045 → VIDEO PROMPT 045  (IMAGE 45 · source: `images/scene-045.jpg`)

**Scene Title:** डर का वज़न, काम का नहीं

**Script Reference:** 'मन न करना ज़्यादातर काम का असली वज़न नहीं बताता। वो सिर्फ़ शुरुआत के डर का वज़न बताता है।'

**Image Analysis:** CHARACTER_01 हाथ में हल्की खुली किताब उठाए खड़ा — किताब स्पष्ट रूप से हल्की, चेहरा अब शांत; पीछे डेस्क; लो-एंगल मीडियम शॉट।

**Visual Action:** किताब को सहजता से हल्का सा उठाना-बैठाना (वज़न का अहसास); नज़र का किताब से ऊपर उठना; कंधों का ढीला होना; एक शांत साँस।

**Camera Movement:** Slow Push-in (low angle)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a low-angle medium shot, the young man stands holding an open book easily in one hand — the book is visibly light, his face now calm, his desk behind him. Animate: he lifts and settles the book effortlessly in his hand to show its real lightness, raises his gaze slowly from the pages, his shoulders release tension, one calm steady breath; no strain anywhere. Camera: slow push-in from the low angle. Environment: room and desk stay still. Mood: not-feeling-like-it rarely reports the real weight of the work — only the weight of the fear of starting. Preserve character identity and clothing, book in hand, desk behind, lighting and palette. No book dropping, no exaggerated lifting effort, no extra objects, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, book dropping, straining to lift, extra objects, weights appearing

**Voice-over Match:** मन न करना काम का असली वज़न नहीं बताता — सिर्फ़ शुरुआत के डर का वज़न; किताब तो हल्की थी।

---


SCENE 046 → VIDEO PROMPT 046  (IMAGE 46 · source: `images/scene-046.jpg`)

**Scene Title:** नहीं यार, मैं डाइट पर हूँ

**Script Reference:** 'पहले को कोई केक खिलाता है। वो कहता है — नहीं यार, मैं डाइट पर हूँ।'

**Image Analysis:** रसोई-टेबल सेटअप, दो पात्र: CHARACTER_03 की ओर से बढ़ाई केक की प्लेट; CHARACTER_01 हाथ उठाकर मना कर रहा — चेहरे पर दबाव और झिझक; मीडियम टू-शॉट।

**Visual Action:** बढ़ी प्लेट की तरफ़ CHARACTER_01 का हाथ उठना और हल्का इनकार; चेहरे पर खिंचाव — भौंह तनना, हल्का सिर हिलाना; CHARACTER_03 का प्लेट थोड़ा आगे बनाए रखना; तनाव भरा ठहराव।

**Camera Movement:** Static two-shot + micro push-in

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium two-shot at a kitchen table — an acquaintance holds out a plate of cake while the young man raises a hand to refuse, pressure and hesitation visible on his face. Animate: the young man's raised hand makes a small declining gesture, his head shakes slightly, his brow tightens with visible inner effort; the other person keeps the plate extended, tilting their head in quiet insistence; both stay in the same positions, the tension held between them. Camera: locked two-shot with a micro push-in. Environment: kitchen light steady. Mood: refusing by willpower — it costs something. Preserve both character identities, clothing, cake plate and table setting, kitchen layout, lighting. No cake being eaten, no plate dropping, no extra people, no scene change, no readable text.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, cake eaten, plate dropping, third person appearing, laughing, identity swap between characters

**Voice-over Match:** पहला आदमी केक मना करता है — 'नहीं यार, मैं डाइट पर हूँ'; नियम से इनकार, चेहरे पर दबाव साफ़।

---


SCENE 047 → VIDEO PROMPT 047  (IMAGE 47 · source: `images/scene-047.jpg`)

**Scene Title:** नहीं, शुक्रिया — मैं ऐसा नहीं खाता

**Script Reference:** 'दूसरा कहता है — नहीं, शुक्रिया। मैं ऐसा नहीं खाता।'

**Image Analysis:** वही रसोई दृश्य दोबारा; पर अब मुख्य पात्र शांत और सहज — हाथ हल्का, चेहरे पर आत्मविश्वास, कोई खिंचाव नहीं; वही टू-शॉट फ़्रेमिंग।

**Visual Action:** सहज हल्का हाथ का इशारा; शांत सिर हिलाना; हल्की विनम्र मुस्कान; कंधे ढीले — इनकार आसान और पहचान से आता हुआ; दूसरा पात्र प्लेट पीछे लेता।

**Camera Movement:** Static two-shot + slow push-in (मुख्य पात्र पर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: the same kitchen two-shot repeated, but now the young man is calm and at ease — a light relaxed hand, quiet confidence on his face, no strain at all. Animate: he declines with one easy unhurried hand gesture and a gentle head shake, a small polite smile on his face, shoulders loose; the other person lowers the plate back naturally; the moment costs him nothing. Camera: locked two-shot with a slow push-in favoring the young man's calm face. Environment: kitchen light steady, same setting. Mood: identity-based refusal — 'I don't eat this kind of food' — effortlessness. Preserve both character identities and clothing exactly, cake plate, table and kitchen layout, lighting. No tension acting, no cake eaten, no extra people, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, strained expression, arguing, cake eaten, third person, identity swap

**Voice-over Match:** दूसरा कहता है — 'नहीं, शुक्रिया, मैं ऐसा नहीं खाता'; पहचान से इनकार, बिना खिंचाव।

---


SCENE 048 → VIDEO PROMPT 048  (IMAGE 48 · source: `images/scene-048.jpg`)

**Scene Title:** पहचान नियम से मज़बूत

**Script Reference:** 'पहचान नियम से मज़बूत होती है। क्योंकि नियम को तोड़ने में सिर्फ़ कमज़ोरी लगती है, पहचान को तोड़ने में शर्म।'

**Image Analysis:** CHARACTER_01 डाइनिंग टेबल से उठकर खिड़की की तरफ़ मुड़ता; पीछे अधखाली प्लेट; चेहरे पर शांत संतोष; साइड प्रोफ़ाइल मीडियम शॉट।

**Visual Action:** कुर्सी से सहज उठना → खिड़की की तरफ़ मुड़ना → एक-दो शांत क़दम; कंधों में हल्कापन; अधखाली प्लेट पीछे स्थिर; संतोष बिना जश्न।

**Camera Movement:** Slow Pan (उठते-मुड़ते पात्र के साथ)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a side-profile medium shot, the young man rises from the dining table and turns toward the window, a half-empty plate left behind, calm satisfaction on his face. Animate: he pushes back lightly and stands up with natural body mechanics, turns toward the window, takes one or two unhurried steps, shoulders carrying a new lightness, a faint contented expression; the plate and table setting stay exactly as left behind. Camera: slow gentle pan following his rise and turn. Environment: room light steady. Mood: identity is stronger than rules — breaking a rule feels like weakness, breaking an identity feels like shame. Preserve character identity and clothing, plate and table positions, window and room layout, lighting. No scene change, no looking at camera, no extra people.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, looking at camera, dishes moving, extra people, exaggerated celebration

**Voice-over Match:** पहचान नियम से मज़बूत — टेबल से उठता शांत आदमी, जिसने नियम नहीं, ख़ुद को निभाया।

---


SCENE 049 → VIDEO PROMPT 049  (IMAGE 49 · source: `images/scene-049.jpg`)

**Scene Title:** हर छोटा काम एक वोट

**Script Reference:** 'पहचान एक दिन में नहीं बनती। वो वोटों से बनती है। हर छोटा काम एक वोट है।'

**Image Analysis:** दीवार के सादे कैलेंडर पर अब तीन-चार हल्के निशान; पास में डेस्क पर खुली किताब; कोई संख्या पढ़ने योग्य नहीं; डिटेल शॉट।

**Visual Action:** कोई पात्र नहीं; कैलेंडर स्थिर; रोशनी धीरे निशानों पर सरकती — हर निशान एक वोट; धूल के कण।

**Camera Movement:** Slow Push-in (निशानों पर)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a detail shot of the plain wall calendar now carrying three or four faint marks, the open book visible on the desk nearby, no readable numbers. Animate: keep the calendar and book completely still; the ambient light slides slowly across the marks, quietly counting them, faint dust drifting through the air. Camera: slow steady push-in onto the cluster of marks. Mood: identity is built by votes — every small act is one. Preserve mark positions and count, calendar blankness of numbers, book and desk placement, lighting direction. No new marks appearing, no hand entering, no numbers becoming readable, no page flipping, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, new marks appearing, hand entering, readable numbers, calendar flipping

**Voice-over Match:** पहचान एक दिन में नहीं बनती — वोटों से बनती है; हर छोटा काम एक निशान, एक वोट।

---


SCENE 050 → VIDEO PROMPT 050  (IMAGE 50 · source: `images/scene-050.jpg`)

**Scene Title:** दस मिनट पढ़ा — फिर भी वोट

**Script Reference:** 'कल भी दस मिनट — दूसरा वोट।... जिस तरफ़ वोट ज़्यादा जाते हैं, इंसान धीरे-धीरे उधर ही चलने लगता है।'

**Image Analysis:** रात; CHARACTER_01 डेस्क पर बैठा किताब बंद कर रहा — काम थोड़ा ही हुआ, पर चेहरे पर सुकून, हार नहीं; मीडियम शॉट।

**Visual Action:** पन्नों पर हाथ फेरकर किताब बंद करना; पेन किताब पर रखना; एक सुकून भरी साँस; हल्की थकान में संतोष — दस मिनट का दूसरा वोट।

**Camera Movement:** Slow Push-in (medium)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a night medium shot, the young man sits at the desk closing his book — only a little work was done, but his face shows peace rather than defeat. Animate: he smooths the pages once with his hand, closes the book gently, lays the pen on top of it, then exhales with quiet satisfaction, a faint tired smile touching his face for a moment. Camera: slow push-in at eye level. Environment: warm lamp glow steady, night room unchanged. Mood: ten minutes still counts as a vote. Preserve character identity and clothing, book, pen and desk positions, lamp on the left, night palette. No readable text, no lamp switching off unless natural, no scene change, no exaggerated joy.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, exaggerated celebration, lamp flickering out, extra objects

**Voice-over Match:** कल भी दस मिनट — दूसरा वोट; थोड़ा काम भी पहचान की तरफ़ गया हुआ वोट है।

---


SCENE 051 → VIDEO PROMPT 051  (IMAGE 51 · source: `images/scene-051.jpg`)

**Scene Title:** बड़ा वादा, टूटा भरोसा

**Script Reference:** 'कल से रोज़ चार घंटे पढ़ूँगा — ये वादा एक ही दिन में टूटता है, और टूटने के बाद तुम ख़ुद पर भरोसा भी खो देते हो।'

**Image Analysis:** हाई-एंगल: CHARACTER_01 डेस्क पर बिखरी चीज़ों के बीच बैठा, सिर नीचे, हाथ माथे पर; एक साथ ढेर सारी किताबें निकाली हुई — बोझ साफ़।

**Visual Action:** माथे पर हाथ का धीरे फिसलना; कंधों का और झुकना; नज़र का बिखरे ढेर पर घूमना और थककर रुक जाना; एक भारी साँस।

**Camera Movement:** Slow Push-in (high angle)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a high-angle medium shot looking down at the overwhelmed desk — the young man sits amid scattered items and many books pulled out all at once, head lowered, hand on his forehead. Animate: his hand slides slowly down from his forehead, shoulders slump deeper, his tired gaze travels once across the scattered pile and stops nowhere, one heavy breath; nothing is picked up. Camera: slow push-in from above, pressing the weight down. Environment: desk clutter stays exactly as scattered. Mood: the big promise broken — 'four hours every day' collapsed in one day, and self-trust with it. Preserve character identity, clothing, every object's scattered position, lighting. No tidying up, no book opening, no scene change, no new objects.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, tidying the desk, picking up books, new objects appearing, standing up

**Voice-over Match:** बड़ा वादा एक दिन में टूटा — चार घंटे का ढेर, बिखरी किताबें, और खोता भरोसा।

---


SCENE 052 → VIDEO PROMPT 052  (IMAGE 52 · source: `images/scene-052.jpg`)

**Scene Title:** सुबह उठते ही फ़ोन

**Script Reference:** 'सुबह उठते ही सबसे पहला काम क्या करते हो? ज़्यादातर जवाब होगा — फ़ोन।'

**Image Analysis:** बिस्तर पर लेटा CHARACTER_01, आँखें आधी खुली; हाथ तकिए के पास से फ़ोन उठा रहा; सुबह की हल्की रोशनी; हाई-एंगल क्लोज़-अप।

**Visual Action:** हाथ का तकिए के पास टटोलना → फ़ोन पकड़ना → चेहरे के पास लाना; आधी खुली आँखें; स्क्रीन की चमक (बिना पढ़ने योग्य कंटेंट) चेहरे पर पड़ना।

**Camera Movement:** Slow Push-in (high angle, above bed)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a high-angle close-up from above the bed, the young man lies with half-open eyes while his hand reaches for the phone near the pillow, soft morning light in the room. Animate: his hand fumbles slightly by the pillow, closes around the phone and lifts it toward his face; the screen's cool glow lights up his drowsy features; his eyes stay half open, blinking slowly against the light — the very first action of the day. Camera: slow push-in from above the bed. Environment: morning light steady. Mood: the day begins with the cheapest reward. Preserve character identity, bedding, phone position and glow, morning palette. No readable screen content, no sitting up, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, sitting up, bright daylight, second person in bed

**Voice-over Match:** सुबह उठते ही सबसे पहला काम — फ़ोन; दिन की पहली जीत फ़ोन को मिल जाती है।

---


SCENE 053 → VIDEO PROMPT 053  (IMAGE 53 · source: `images/scene-053.jpg`)

**Scene Title:** हर स्वाइप पर कुछ नया

**Script Reference:** 'फ़ोन पर हर स्वाइप के साथ कुछ नया मिलता है... कुछ भी पक्का नहीं, हर बार कुछ अलग।'

**Image Analysis:** फ़ोन स्क्रीन की ठंडी चमक में डूबा चेहरा; ऊँगली लगातार स्वाइप करती; आँखों में थकी हुई चमक; एक्सट्रीम क्लोज़-अप अंगूठे और चेहरे पर।

**Visual Action:** अंगूठे की लगातार ऊपर की स्वाइप — लयबद्ध, बिना रुके; चेहरे पर चमक का हर स्वाइप पर हल्का बदलना; खाली पर चिपकी नज़रें; धीमी पलकें।

**Camera Movement:** Static / micro push-in

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an extreme close-up of the face bathed in cold phone-screen glow, thumb swiping continuously, a tired shine in the eyes. Animate: the thumb swipes upward again and again in an endless rhythm, each swipe subtly shifting the cold glow across his face, his eyes stay locked on the screen with a hollow tired shine, blinking slowly; no other movement. Camera: locked extreme close-up with a micro push-in. Environment: darkness around holds. Mood: every swipe delivers something new — nothing certain, always different. Preserve facial identity, skin texture, phone glow color, lighting ratio. No readable screen content, no head turning, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, app UI, head turning away, smiling broadly

**Voice-over Match:** हर स्वाइप पर कुछ नया — कुछ भी पक्का नहीं, हर बार अलग; यही चिपकाए रखता है।

---


SCENE 054 → VIDEO PROMPT 054  (IMAGE 54 · source: `images/scene-054.jpg`)

**Scene Title:** हर बार का नतीजा पता नहीं

**Script Reference:** 'ठीक वैसे ही जैसे जुआ खेलने वाला इसलिए लगा रहता है क्योंकि हर बार का नतीजा पता नहीं होता।'

**Image Analysis:** क्लोज़-अप: फ़ोन स्क्रीन की अनिश्चित चमक आँखों में परावर्तित; चेहरा प्रतीक्षा में — जुआरी वाली लत का यथार्थवादी प्रतीक।

**Visual Action:** आँखों में चमक का धीमे-तेज़ बदलना; प्रतीक्षा में शरीर का मामूली आगे झुकना; पलकों का कम झपकना; साँस की पकड़ी हुई लय।

**Camera Movement:** Slow Push-in (आँखों की तरफ़)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up of the young man's waiting face with an uncertain phone-screen glow reflecting in his eyes, no readable screen content. Animate: the glow in his eyes brightens and dims unpredictably, his body leans a fraction closer in anticipation, blinks slow down, his breath holds in a small suspended rhythm — the gambler's trance, realistic and quiet. Camera: slow push-in toward the reflecting eyes. Environment: dark room holds steady. Mood: he keeps going because the next result is unknown. Preserve facial identity, screen-glow color, lighting ratio, palette. No readable screen content, no sudden expression change, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, sudden laughter, screen flashing wildly, identity drift

**Voice-over Match:** जुआरी इसलिए लगा रहता है क्योंकि हर बार का नतीजा पता नहीं होता — वही फ़ोन पर हो रहा।

---


SCENE 055 → VIDEO PROMPT 055  (IMAGE 55 · source: `images/scene-055.jpg`)

**Scene Title:** धीरा इनाम — किताब और प्रोजेक्ट

**Script Reference:** 'दूसरी तरफ़ तुम्हारा काम है। किताब। प्रोजेक्ट। पढ़ाई। इसमें इनाम देर से मिलता है, और धीरे मिलता है।'

**Image Analysis:** टॉप-डाउन: खुली किताब, नोटबुक और पेन डेस्क पर शांत पड़े; मध्यम रोशनी, कोई चमक नहीं — फ़ोन की चमक के विपरीत; धीरा इनाम।

**Visual Action:** कोई पात्र नहीं; सब स्थिर; रोशनी में बहुत हल्की स्थिरता और धूल के कण — चमक के अभाव वाला शांत कंट्रास्ट।

**Camera Movement:** Very slow push-in (top-down)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a top-down detail shot of quiet study materials — an open book, a notebook and a pen lying calmly on the desk in moderate light, no glow anywhere, the opposite of the phone's shine. Animate: keep everything perfectly still; only faint dust drifts slowly through the steady light and the page corner lifts once in a barely-there breath of air. Camera: very slow top-down push-in. Mood: the slow reward — books and projects pay late and pay slowly, and that is exactly why they look boring. Preserve exact positions of book, notebook and pen, desk texture, neutral lighting. No glowing light, no hand entering, no readable text, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, glowing light, hand entering, readable text, objects moving, phone appearing

**Voice-over Match:** दूसरी तरफ़ काम — किताब, प्रोजेक्ट, पढ़ाई; इनाम देर से और धीरे मिलता है, इसलिए फीका लगता है।

---

SCENE 056 → VIDEO PROMPT 056  (IMAGE 56 · source: `images/scene-056.jpg`)

**Scene Title:** सुबह की तेज़ ख़ुशी के बाद किताब फीकी

**Script Reference:** 'जब तुम सुबह उठकर पहले तीस-चालीस मिनट फ़ोन चला लेते हो... तो वो किताब बोरिंग नहीं है।'

**Image Analysis:** OTS शॉट डेस्क की ओर: CHARACTER_01 किताब के सामने बैठा पर नज़र भटकी; एक हाथ अब भी फ़ोन की तरफ़; चेहरे पर सुस्ती।

**Visual Action:** नज़र का पन्ने पर टिकने की कोशिश में भटकना; फ़ोन की तरफ़ बढ़ते हाथ का बीच में रुकना; सुस्त साँस; कंधों का भारीपन।

**Camera Movement:** Slow Push-in (OTS)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an over-the-shoulder medium shot toward the desk, the young man sits in front of the open book with a wandering gaze, one hand still angled toward his phone, lethargy on his face. Animate: his eyes try to settle on the page and slide away twice, the hand near the phone twitches and starts to reach, then stops mid-air and withdraws slightly, his shoulders stay heavy with a slow lethargic breath. Camera: slow push-in over his shoulder toward the book. Environment: morning light steady. Mood: the book is not boring — the morning was already spent on the phone. Preserve character identity and clothing, book, phone and desk positions, lighting. No readable text, no phone grabbed, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone grabbed, readable text, sudden energy, standing up

**Voice-over Match:** सुबह के तीस-चालीस मिनट फ़ोन को देने के बाद किताब बोरिंग नहीं — तुम्हारा तुलना-स्तर बदल चुका।

---


SCENE 057 → VIDEO PROMPT 057  (IMAGE 57 · source: `images/scene-057.jpg`)

**Scene Title:** पहले मज़ा आता था, अब नहीं

**Script Reference:** 'यही वजह है कि लोग कहते हैं — पहले पढ़ाई में मज़ा आता था, अब नहीं आता।'

**Image Analysis:** चेहरे का क्लोज़-अप; आँखें नीचे धुँधली किताब पर, पर चेहरे पर दिलचस्पी नहीं; हल्की उदासी, शिकायत नहीं; निचले फ़्रेम में किताब धुँधली।

**Visual Action:** धीमी बेज़ार पलकें; नज़र का पन्नों पर टिके रहना बिना कुछ उतारे; एक हल्की उदास साँस; भाव लगभग स्थिर।

**Camera Movement:** Static / micro push-in

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up of the young man's face with the soft-blurred open book in the lower frame, eyes on the pages but no interest on the face, a gentle sadness without complaint. Animate: he blinks slowly and flatly, his gaze rests on the pages without absorbing anything, one small sad exhale moves his lips faintly; expression otherwise nearly still. Camera: locked close-up with a micro push-in. Environment: light steady. Mood: 'studying used to be fun, now it is not' — a quiet loss, not drama. Preserve facial identity, skin texture, stubble, blurred book position, lighting and palette. No tears, no scene change, no looking at camera, no expression swing.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, tears, looking at camera, smiling, book coming into sharp focus, identity drift

**Voice-over Match:** 'पहले मज़ा आता था, अब नहीं' — असली कारण किताब नहीं, सुबह का फ़ोन-तुलना है।

---


SCENE 058 → VIDEO PROMPT 058  (IMAGE 58 · source: `images/scene-058.jpg`)

**Scene Title:** हल क्रम बदलना है

**Script Reference:** 'इसका हल फ़ोन पूरी तरह छोड़ देना नहीं है... हल क्रम बदलना है।'

**Image Analysis:** टॉप-डाउन स्टिल-लाइफ़: किताब आगे और खुली, फ़ोन पीछे उल्टा रखा; क्रम साफ़; कोई पात्र नहीं।

**Visual Action:** कोई पात्र नहीं; वस्तुएँ स्थिर; रोशनी धीरे किताब पर केंद्रित होती महसूस हो — नए क्रम की घोषणा; धूल के कण।

**Camera Movement:** Slow Push-in (किताब पर, फ़ोन को फ़्रेम में रखते हुए)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a top-down detail shot showing the new order of objects — the book open and placed forward, the phone lying face-down behind it, no person. Animate: keep both objects perfectly still; the light very slowly settles brighter over the open book while the phone stays in its dimmer place; faint dust drifts across. Camera: slow push-in that keeps both objects in frame, favoring the book. Mood: the solution is not quitting the phone — it is changing the order. Preserve exact positions of book and phone, desk surface, lighting direction. No hand entering, no phone moving or lighting, no readable text, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hand entering, phone lighting or moving, readable text, objects swapping places

**Voice-over Match:** हल फ़ोन छोड़ना नहीं, क्रम बदलना है — किताब आगे, फ़ोन पीछे; यही पूरा फ़र्क़।

---


SCENE 059 → VIDEO PROMPT 059  (IMAGE 59 · source: `images/scene-059.jpg`)

**Scene Title:** काम पहले, इनाम बाद में

**Script Reference:** 'दिन का सबसे ज़रूरी काम सबसे पहले। फ़ोन उसके बाद। इनाम को मेहनत के पीछे रखो, आगे नहीं।'

**Image Analysis:** वाइड शॉट: CHARACTER_01 सुबह डेस्क पर बैठकर लिख रहा; फ़ोन पीछे दराज के पास उल्टा पड़ा — दूर, पर फ़्रेम में; काम पहले, इनाम बाद।

**Visual Action:** स्थिर लिखने की लय; बीच में एक बार सिर उठाकर सोचना, फिर झुकना; पीछे पड़ा फ़ोन बिल्कुल स्थिर और अछूता; फ़ोकस बना रहना।

**Camera Movement:** Slow Push-in (फ़ोन के पास से होते हुए पात्र की ओर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide morning shot, the young man sits writing at the desk in the foreground of the frame's action while his phone lies face-down far behind near the drawer — distant but visible in frame. Animate: he writes in a steady rhythm, pauses once to lift his head and think, then leans back into the work; the distant phone never moves, never lights up, stays ignored. Camera: one slow push-in traveling past the out-of-focus phone region toward the working figure, visually placing work before reward. Environment: soft morning light steady. Mood: the most important work of the day goes first. Preserve character identity, clothing, desk layout, phone's distant position, lighting. No readable handwriting, no phone glowing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone lighting up, readable handwriting, person reaching for phone, daylight flicker

**Voice-over Match:** दिन का सबसे ज़रूरी काम सबसे पहले, फ़ोन बाद में — इनाम को मेहनत के पीछे रखो।

---


SCENE 060 → VIDEO PROMPT 060  (IMAGE 60 · source: `images/scene-060.jpg`)

**Scene Title:** फ़ोन उठाने की इच्छा कहाँ से आई

**Script Reference:** 'मैं क्या कर रहा था जब मुझे फ़ोन उठाने की इच्छा हुई? ज़्यादातर बार जवाब होगा — कोई मुश्किल हिस्सा आया था।'

**Image Analysis:** क्लोज़-अप: पेन रोककर एक पन्ने पर अटका CHARACTER_01; माथे पर शिकन; हाथ फ़ोन की तरफ़ नहीं, बस रुका हुआ — इच्छा का जन्म-बिंदु।

**Visual Action:** पेन का पन्ने से थोड़ा ऊपर ठहरना; उँगलियों का हल्का कसना; शिकन गहरी होना; नज़र का उसी कठिन पंक्ति पर टिके रहना; साँस एक पल रुकना।

**Camera Movement:** Slow Push-in (रुके हाथ और चेहरे पर)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up of the stalled hand and confused face — the young man holds his pen paused above a page, brow creased, hand not moving toward any phone, simply stuck. Animate: the pen hovers motionless above one difficult line, his fingers tighten slightly around it, the crease on his forehead deepens, his breath pauses for a beat, eyes locked on the same spot on the page. Camera: slow push-in on the stalled hand, tilting subtly toward his face. Environment: light steady. Mood: the urge to escape was born exactly here — at the hard part. Preserve character identity, pen and page positions, hand anatomy, lighting. No phone appearing, no writing resuming, no scene change, no readable text.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, phone appearing, pen writing, readable text, hand relaxing, smiling

**Voice-over Match:** 'फ़ोन उठाने की इच्छा कहाँ से आई?' — मुश्किल हिस्सा आया था, बस यहीं से।

---


SCENE 061 → VIDEO PROMPT 061  (IMAGE 61 · source: `images/scene-061.jpg`)

**Scene Title:** डर से भागने का रास्ता

**Script Reference:** 'मुझे बोरियत नहीं हो रही। मुझे डर लग रहा है कि ये समझ नहीं आएगा। और डर से भागने का इनाम फ़ोन है।'

**Image Analysis:** टाइट क्लोज़-अप: आधा चेहरा और सामने खुली किताब; किताब की तरफ़ देखते चेहरे पर हल्का डर/बचाव का भाव; निचले फ़्रेम में किताब का किनारा सॉफ़्ट।

**Visual Action:** डरी हुई आँखों का किताब पर टिकना और एक पल को हट जाना; गले के हल्के निगलने जैसा सूक्ष्म भाव; पलकें तेज़-धीमी; बाक़ी स्थिर।

**Camera Movement:** Static / micro push-in (टाइट)

**Motion Intensity:** LOW

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a tight close-up of half the young man's face with the open book in front of him, the book edge soft in the lower frame, a faint fear and defensiveness in his eyes as he looks at the pages. Animate: his eyes hold on the book, flick away for one instant and return, a subtle swallow moves his throat, blinks come slightly faster with quiet apprehension; everything else stays still. Camera: locked tight frame with a micro push-in. Environment: light steady. Mood: 'I am not bored — I am afraid this will not make sense to me.' Preserve facial identity, stubble, skin texture, book position and softness, lighting. No crying, no scene change, no book closing, no exaggerated terror.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, crying, terror, book closing, identity drift, camera pulling away

**Voice-over Match:** बोरियत नहीं, डर — 'कहीं समझ न आए'; और डर से भागने का इनाम फ़ोन है।

---


SCENE 062 → VIDEO PROMPT 062  (IMAGE 62 · source: `images/scene-062.jpg`)

**Scene Title:** छठे दिन — फ़ोन कॉल और निकली शाम

**Script Reference:** 'मान लो तुमने पाँच दिन तक ठीक किया। छठे दिन किसी दोस्त का फ़ोन आया, शाम निकल गई।'

**Image Analysis:** शाम का वाइड शॉट: CHARACTER_01 बिस्तर पर लेटा फ़ोन पर बात कर रहा, एक टांग लटकी, हँसी हल्की; खिड़की के बाहर अंधेरा उतर रहा; डेस्क पर किताब बंद, अनछुई।

**Visual Action:** बातचीत वाले सहज हाथ के इशारे; हल्की हँसी से कंधे हिलना; लटकी टांग का मज़े में झूलना; बाहर का प्रकाश धीरे गहरा होना — शाम का निकल जाना।

**Camera Movement:** Slow Pull-back (पूरा कमरा दिखाते हुए)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide evening shot, the young man lies on the bed talking on the phone, one leg dangling off the edge, light laughter on his face, darkness settling outside the window, the closed book untouched on the desk. Animate: he gestures loosely with his free hand while talking, his shoulders shake with soft laughter, the dangling leg swings gently, and the light outside the window slowly deepens as the evening slips away unnoticed; the closed book stays still. Camera: very slow pull-back revealing the whole room and the ignored desk. Mood: day six — a friend's call and the evening gone. Preserve character identity, clothing, bed and desk layout, book position, evening palette. No readable phone screen, no scene change, no second person in room.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, second person in room, book opening, daylight returning, exaggerated laughing fit

**Voice-over Match:** पाँच दिन ठीक चला; छठे दिन दोस्त का फ़ोन आया और शाम निकल गई — रिलैप्स ऐसे ही होता है।

---


SCENE 063 → VIDEO PROMPT 063  (IMAGE 63 · source: `images/scene-063.jpg`)

**Scene Title:** अब सोमवार से शुरू करेंगे

**Script Reference:** 'अगली सुबह तुम्हारे दिमाग़ में एक ही लाइन आई — चलो, अब सोमवार से फिर शुरू करेंगे। यहीं से असली नुकसान होता है।'

**Image Analysis:** अगली सुबह: CHARACTER_01 बिस्तर पर बैठकर दीवार के कैलेंडर को देख रहा; कैलेंडर पर कई खाली खाने; चेहरे पर टालने वाला सुकून; मीडियम शॉट।

**Visual Action:** कैलेंडर पर टिकी नज़र; हल्का सिर हिलाना (ख़ुद से सहमति); चेहरे पर झूठी शांति का जमना; हाथ घुटने पर थपथपाता एक बार।

**Camera Movement:** Slow Push-in (पात्र और कैलेंडर के बीच)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a morning medium shot, the young man sits on the bed looking at the wall calendar with several empty squares, a postponing kind of comfort on his face. Animate: his gaze stays locked on the calendar, he gives one small nod of self-agreement, his hand pats his knee once lightly, and a false calm settles over his expression — 'fine, we will start again from Monday'. Camera: slow push-in from behind his shoulder line toward the calendar. Environment: soft morning light steady. Mood: the real damage happens here — not the missed day, but the postponed restart. Preserve character identity, clothing, bed and calendar positions, lighting. No readable numbers on calendar, no standing up, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable calendar numbers, standing up, marks appearing, phone in hand

**Voice-over Match:** असली नुकसान छूटे दिन से नहीं — 'अब सोमवार से शुरू करेंगे' वाली अगली सुबह से होता है।

---


SCENE 064 → VIDEO PROMPT 064  (IMAGE 64 · source: `images/scene-064.jpg`)

**Scene Title:** अपराधबोध — मेहनत का नक़ली विकल्प

**Script Reference:** 'एक दिन छूटने के बाद तुम ख़ुद को इतना कोसते हो कि अगले तीन दिन भी निकल जाते हैं।... अपराधबोध मेहनत का नक़ली विकल्प है।'

**Image Analysis:** शाम; हाई-एंगल वाइड: CHARACTER_01 बिस्तर पर घुटनों में सिर दिए बैठा; चेहरे पर ग्लानि; कमरा बिखरा, डेस्क पर किताबें ज्यों की त्यों — अलगाव साफ़।

**Visual Action:** घुटनों में दबा सिर का बहुत हल्का हिलना; कंधों की एक भारी कंपन-भरी साँस; उँगलियों का बालों में कसना; कोई और बड़ी हरकत नहीं।

**Camera Movement:** Slow Push-in (high angle)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a high-angle wide shot emphasizing isolation — the young man sits on the bed in the evening with his head buried in his knees, guilt on his hidden face, the room scattered, books lying untouched on the desk. Animate: his buried head shifts very slightly, one heavy shuddering breath moves his whole back, his fingers tighten briefly in his hair; the scattered room stays perfectly still around him. Camera: slow push-in from the high angle, tightening the isolation. Environment: dim evening light holds. Mood: guilt as the fake substitute for effort — self-scolding burning the next three days too. Preserve character identity, clothing, room clutter positions exactly, lighting. No crying out, no standing up, no tidying, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, standing up, tidying room, wailing, objects moving, daylight

**Voice-over Match:** एक दिन छूटा तो ख़ुद को इतना कोसा कि तीन दिन और निकल गए — अपराधबोध मेहनत का नक़ली विकल्प।

---


SCENE 065 → VIDEO PROMPT 065  (IMAGE 65 · source: `images/scene-065.jpg`)

**Scene Title:** गिरने के बाद छोटी शुरुआत

**Script Reference:** 'गिरने के बाद अगली शुरुआत छोटी होगी, बड़ी नहीं।... बस वही दो मिनट वाला क़दम उठाओ।'

**Image Analysis:** अगली सुबह: CHARACTER_01 डेस्क पर बैठा नोटबुक खोलकर सिर्फ़ एक लाइन लिख रहा; चेहरे पर न ग्लानि न जोश — बस वापसी; साइड मीडियम क्लोज़-अप।

**Visual Action:** नोटबुक खोलना → पेन उठाना → एक छोटी लाइन लिखना (अपठनीय) → पेन रोककर एक शांत साँस; वापसी की सहज लय।

**Camera Movement:** Slow Push-in (side, understated)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a quiet side medium close-up next morning, the young man sits at the desk opening his notebook to write just one line — no guilt, no excitement on his face, only a return. Animate: he opens the notebook, picks up the pen, writes one short line in unreadable strokes, sets the pen down and takes one calm even breath; his face stays steady and uncelebratory throughout. Camera: slow understated push-in from the side. Environment: soft morning light, room calm. Mood: after the fall, the next start is small, not big — just the two-minute step. Preserve character identity, clothing, notebook, pen and desk positions, lighting. No readable handwriting, no smile breaking out, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable handwriting, big smile, celebrating, extra objects, standing up

**Voice-over Match:** गिरने के बाद अगली शुरुआत छोटी होगी — बस वही दो मिनट वाला क़दम; वापसी बिना नाटक।

---


SCENE 066 → VIDEO PROMPT 066  (IMAGE 66 · source: `images/scene-066.jpg`)

**Scene Title:** परफ़ेक्ट टाइम-टेबल, शून्य काम

**Script Reference:** 'पहले पूरी टाइम-टेबल बन जाए, फिर पढ़ूँगा। परफ़ेक्शनिज़म बहुत बार टालमटोल का सबसे सलीक़ेदार कपड़ा होता है।'

**Image Analysis:** टॉप-डाउन: डेस्क पर कई काग़ज़, रंगीन पेन, स्केल से बना सुंदर पर खाली चार्ट जैसा ढाँचा; किताब अब भी बंद किनारे पर; कोई पात्र नहीं।

**Visual Action:** कोई पात्र नहीं; सब स्थिर; कैमरा धीरे 'सुंदर प्लान' से सरककर बंद किताब पर ठहरता — खाली चार्ट बनाम अनछुई किताब का कंट्रास्ट।

**Camera Movement:** Slow drift/push (चार्ट → बंद किताब)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a top-down detail shot of elaborate planning materials — several sheets, colored pens, a beautiful but empty chart framework drawn with a ruler, while the study book still lies closed at the edge, no person. Animate: keep every sheet and pen perfectly still; only faint dust drifts across the desk and the light shifts imperceptibly. Camera: one slow smooth drift from the pretty empty chart to the closed book at the edge, letting the contrast land. Mood: perfectionism as procrastination's most presentable outfit. Preserve exact positions of sheets, pens, chart and closed book, desk texture, lighting. No hand entering, no chart filling in, no book opening, no readable text becoming legible, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hand entering, chart filling with content, book opening, readable text, papers shuffling

**Voice-over Match:** पहले परफ़ेक्ट टाइम-टेबल, फिर पढ़ाई — परफ़ेक्शनिज़म टालमटोल का सबसे सलीक़ेदार कपड़ा।

---

SCENE 067 → VIDEO PROMPT 067  (IMAGE 67 · source: `images/scene-067.jpg`)

**Scene Title:** चलती योजना > सुंदर योजना

**Script Reference:** 'जो योजना चलती है, वो हमेशा उस योजना से बेहतर है जो सिर्फ़ काग़ज़ पर सुंदर है।'

**Image Analysis:** मीडियम शॉट: CHARACTER_01 डेस्क पर छोटे सादे काग़ज़ पर कुछ लिख रहा, साथ में किताब खुली — आधा प्लान, आधा काम, दोनों एक साथ।

**Visual Action:** काग़ज़ पर दो-तीन छोटी अपठनीय लाइनें लिखना → पेन रखना → सीधे खुली किताब की तरफ़ मुड़ना → पन्ने पर हाथ रखना; प्लान और काम की एक ही लय।

**Camera Movement:** Slow Push-in (काग़ज़ और किताब दोनों फ़्रेम में)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot with both a small plain note and the open book in frame, the young man writing briefly on the note while his study book lies open beside it — half plan, half work, together. Animate: he writes two or three short unreadable lines on the note, sets the pen down decisively, turns toward the open book and rests his hand on the page to begin; the shift from planning to doing is smooth and immediate. Camera: slow push-in keeping both note and book in frame. Environment: room light steady. Mood: a plan that runs beats a plan that only looks beautiful. Preserve character identity, clothing, note, pen and book positions, desk layout, lighting. No readable text, no extra papers appearing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, extra papers piling up, hesitation, phone appearing

**Voice-over Match:** जो योजना चलती है, वो काग़ज़ पर सुंदर योजना से बेहतर है — लिखा, मुड़ा, शुरू किया।

---


SCENE 068 → VIDEO PROMPT 068  (IMAGE 68 · source: `images/scene-068.jpg`)

**Scene Title:** क़दम 1 — रात को कल का एक काम लिखो

**Script Reference:** 'एक — रात को कल का एक काम लिख दो। सिर्फ़ एक। तीन नहीं, पाँच नहीं।'

**Image Analysis:** रात; OTS क्लोज़-अप: CHARACTER_01 लैंप की रोशनी में छोटे काग़ज़ पर एक ही लाइन लिख रहा; डेस्क पर सिर्फ़ वही काग़ज़, पेन और बंद किताब — क़दम 1।

**Visual Action:** पेन से एक ठहराव वाली लाइन लिखना (अपठनीय) → पेन ऊपर उठाना → काग़ज़ को एक बार सीधा देखना → डेस्क पर सावधानी से रखना; सिर्फ़ एक काम लिखा गया।

**Camera Movement:** Slow Push-in (OTS, काग़ज़ पर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a night over-the-shoulder close-up, the young man writes a single line on a small sheet of paper under the lamp glow, only that sheet, a pen and a closed book on the desk. Animate: he writes one deliberate unreadable line, lifts the pen, glances down at the sheet for a beat, then places it neatly at the center of the desk — tomorrow's one task, fixed. Camera: slow push-in over his shoulder onto the sheet. Environment: warm lamp glow steady, dark room around. Mood: step one — write tomorrow's one task at night, only one. Preserve character identity, clothing, sheet, pen, closed book positions, lamp on the left, night palette. No readable text, no second sheet appearing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable handwriting, extra papers appearing, list growing, daylight

**Voice-over Match:** क़दम 1 — रात को कल का एक काम लिख दो; सिर्फ़ एक, तीन नहीं, पाँच नहीं।

---


SCENE 069 → VIDEO PROMPT 069  (IMAGE 69 · source: `images/scene-069.jpg`)

**Scene Title:** क़दम 2 — शुरुआत इतनी छोटी

**Script Reference:** 'दो — शुरुआत को इतना छोटा करो कि मना करना अजीब लगे। दो मिनट। एक पन्ना। एक सवाल। एक पुश-अप।'

**Image Analysis:** एक्सट्रीम क्लोज़-अप: खुली किताब का सिर्फ़ एक पन्ना और एक उँगली उस पन्ने की पहली पंक्ति पर रखी — छोटापन साफ़ दिखे; क़दम 2।

**Visual Action:** उँगली का पंक्ति पर हल्का टिकना → एक पंक्ति की चौड़ाई जितना बहुत धीमा सरकना → रुकना; पन्ना स्थिर; न्यूनतम शुरुआत का भौतिक अर्थ।

**Camera Movement:** Static / micro push-in (उँगली और पंक्ति पर)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an extreme close-up detail shot of a single open book page with one finger resting on its first line — the smallness of the start made visible. Animate: the finger presses gently on the line, slides slowly across just the width of that one line, and stops; the page stays flat and steady, only its corner trembles faintly once. Camera: locked macro-like frame with a micro push-in on the fingertip. Environment: desk light steady. Mood: step two — make the start so small that refusing feels absurd. Preserve finger anatomy, page texture and position, lighting. No readable text becoming legible, no page turning, no extra fingers or hands, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, page turning, extra hands, warped finger, pen appearing

**Voice-over Match:** क़दम 2 — शुरुआत इतनी छोटी करो कि मना करना अजीब लगे; एक पन्ना, एक पंक्ति, एक उँगली।

---


SCENE 070 → VIDEO PROMPT 070  (IMAGE 70 · source: `images/scene-070.jpg`)

**Scene Title:** क़दम 3 और 4 — पाँच मिनट, फ़ोन बाहर

**Script Reference:** 'तीन — पाँच मिनट का सौदा करो... चार — उस पाँच मिनट के लिए फ़ोन दूसरे कमरे में।'

**Image Analysis:** मीडियम वाइड: CHARACTER_01 डेस्क पर बैठकर सामने रखे सादे छोटे टाइमर की तरफ़ देख रहा; पीछे दरवाज़े के बाहर शेल्फ़ पर फ़ोन उल्टा रखा दिख रहा — क़दम 3 और 4 एक फ़्रेम में।

**Visual Action:** टाइमर की तरफ़ नज़र → गहरी साँस → हाथ का किताब की तरफ़ बढ़ना; पीछे दूर रखा फ़ोन बिल्कुल स्थिर और अछूता; दोनों शर्तें एक साथ दिखती रहें।

**Camera Movement:** Slow Push-in (टाइमर के पास से पात्र की ओर)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium wide shot, the young man sits at the desk facing a small plain timer on the table, while far behind him his phone lies face-down on a shelf outside the doorway — both steps visible in one frame. Animate: he looks at the timer, takes one settling breath, then moves his hand toward the open book to start; the distant phone stays motionless and untouched, the timer stays exactly where it is. Camera: slow push-in passing the timer in the near foreground toward his face. Environment: room light steady. Mood: the five-minute deal, phone in the other room — conditions arranged before willpower is needed. Preserve character identity, timer and phone positions, doorframe and shelf, desk layout, lighting. No timer digits readable, no phone lighting, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable timer digits, phone lighting up, timer moving, hand grabbing phone

**Voice-over Match:** क़दम 3–4 — पाँच मिनट का सौदा, और उस पाँच मिनट के लिए फ़ोन दूसरे कमरे में।

---


SCENE 071 → VIDEO PROMPT 071  (IMAGE 71 · source: `images/scene-071.jpg`)

**Scene Title:** क़दम 5 — कैलेंडर पर निशान

**Script Reference:** 'पाँच — नापना मत छोड़ो, बस नापने का तरीक़ा बदलो।... जिस दिन तुमने तय किया हुआ छोटा काम किया, उस दिन एक निशान लगा दो।'

**Image Analysis:** मीडियम शॉट: CHARACTER_01 का हाथ दीवार के कैलेंडर पर निशान लगा रहा; कैलेंडर पर पहले से कई निशान; चेहरा आधा फ़्रेम में — क़दम 5।

**Visual Action:** हाथ का कैलेंडर तक उठना → एक छोटा साफ़ निशान लगाना → हाथ नीचे आना → चेहरे का आधा हिस्सा निशानों की क़तार पर हल्का ठहरना; मापन का रिचुअल।

**Camera Movement:** Slow Push-in (हाथ और कैलेंडर पर)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot of the young man's hand marking the wall calendar, several faint marks already on it, half his calm face visible in frame. Animate: his hand rises to the calendar and draws one small clean mark on the current square, lowers the hand, and his half-visible face holds a quiet beat of acknowledgment as the row of marks grows by one; no celebration. Camera: slow push-in on the marking hand, easing toward his face. Environment: room light steady. Mood: step five — keep measuring, just measure differently. Preserve character identity, calendar mark positions and count, wall and room layout, lighting. No readable numbers, no extra marks appearing elsewhere, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable numbers, extra marks multiplying, hand morphing, calendar flipping

**Voice-over Match:** क़दम 5 — नापना मत छोड़ो, तरीक़ा बदलो; छोटा काम किए हर दिन एक निशान, एक वोट।

---


SCENE 072 → VIDEO PROMPT 072  (IMAGE 72 · source: `images/scene-072.jpg`)

**Scene Title:** क़दम 6 — बुरे दिन का न्यूनतम संस्करण

**Script Reference:** 'छह — बुरे दिन के लिए न्यूनतम संस्करण तैयार रखो।... एक पैराग्राफ़। एक पुश-अप। पाँच मिनट। ज़ीरो नहीं।'

**Image Analysis:** लो-एंगल फ़्लोर-लेवल: थका CHARACTER_01 ज़मीन पर अधूरा पुश-अप कर रहा; चेहरे पर थकान पर हार नहीं; डेस्क पर किताब खुली — क़दम 6, न्यूनतम संस्करण।

**Visual Action:** एक धीमा अधूरा पुश-अप — बाहें काँपती हों तब भी; नीचे उतरना, आधा ऊपर आना, फिर ज़मीन पर बैठकर साँस लेना; थका पर टिका हुआ शरीर।

**Camera Movement:** Static / micro push-in (floor level)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a low-angle medium shot at floor level, the exhausted young man performs a partial push-up on the floor, tiredness on his face but no defeat, the open book on the desk nearby. Animate: he completes one slow partial push-up — arms trembling faintly with honest effort — lowers himself and sits back on his heels taking one deep tired breath, jaw set, eyes steady; the open book stays in soft background view. Camera: locked floor-level frame with a micro push-in during the effort. Environment: room light steady. Mood: step six — the bad-day minimum version; one paragraph, one push-up, five minutes, never zero. Preserve character identity, clothing, floor and desk layout, book position, lighting. No full workout, no jumping up, no extra equipment, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, full energetic workout, jumping up, weights appearing, extra people, exaggerated strain

**Voice-over Match:** क़दम 6 — बुरे दिन का न्यूनतम संस्करण तैयार रखो; एक पुश-अप भी ज़ीरो से बेहतर।

---


SCENE 073 → VIDEO PROMPT 073  (IMAGE 73 · source: `images/scene-073.jpg`)

**Scene Title:** क़दम 7 — एक दिन माफ़, दो दिन नहीं

**Script Reference:** 'सात — दो दिन लगातार मत छोड़ो।... इसलिए नियम ये रखो — एक दिन माफ़, दो दिन नहीं।'

**Image Analysis:** कैलेंडर का एक्सट्रीम क्लोज़-अप: एक खाना खाली, उसके आगे वाले खाने पर नया निशान — ज़ंजीर टूटी नहीं, लौटी है; क़दम 7।

**Visual Action:** कोई पात्र नहीं; कैलेंडर स्थिर; रोशनी धीरे खाली खाने से होते हुए नए निशान पर सरकती — टूटन और लौटने की खामोश कहानी।

**Camera Movement:** Micro push-in (दो खानों पर)

**Motion Intensity:** LOW

**Suggested Duration:** 5 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: an extreme close-up of two adjacent calendar squares — one left empty, the next one carrying a fresh mark; the chain broken for a day but returned. Animate: keep the calendar completely still; the light drifts slowly from the empty square onto the newly marked one, faint dust passes through the frame. Camera: micro push-in settling on the new mark. Mood: step seven — never miss twice; one day forgiven, two days not. Preserve mark positions, square boundaries, wall and paper texture, lighting. No new marks appearing, no hand entering, no numbers becoming readable, no page flipping, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, hand entering, new marks appearing, readable numbers, calendar flipping

**Voice-over Match:** क़दम 7 — एक दिन माफ़, दो दिन नहीं; खाली खाने के बाद फिर लगा निशान ही असली अनुशासन।

---


SCENE 074 → VIDEO PROMPT 074  (IMAGE 74 · source: `images/scene-074.jpg`)

**Scene Title:** गिरे तो तरीक़ा देखो, ख़ुद को नहीं

**Script Reference:** 'जब तुम गिरो, तो ख़ुद को कोसना नहीं, तरीक़ा देखना। इस बार क्या गड़बड़ हुई — समय ग़लत था, काम बहुत बड़ा था, या फ़ोन पास था?'

**Image Analysis:** साइड मीडियम: CHARACTER_01 डेस्क पर बैठा छोटे काग़ज़ और डेस्क की चीज़ों को शांत भाव से देख रहा — जाँच करता हुआ, ख़ुद को कोसता नहीं; विश्लेषणात्मक शांति।

**Visual Action:** काग़ज़ उठाना → पढ़ने जैसा देखना (अपठनीय) → डेस्क की चीज़ों पर नज़र घुमाना → काग़ज़ रखकर एक सोच भरा सिर हिलाना; भाव: ख़ुद पर नहीं, तरीक़े पर सवाल।

**Camera Movement:** Slow Push-in (side)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a side medium shot, the young man sits at the desk calmly examining a small paper and the objects around — inspecting the method, not condemning himself, an analytical calm expression. Animate: he lifts the small sheet, looks it over with steady eyes, scans the desk objects one by one as if checking suspects — the time, the size of the task, the phone's usual spot — then sets the sheet down and gives one slow thoughtful nod. Camera: slow push-in from the side. Environment: room light steady. Mood: when you fall, examine the method, not the self. Preserve character identity, clothing, sheet and desk object positions, lighting. No readable text, no self-blame acting, no head dropping, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, crying, head dropping in guilt, objects disappearing

**Voice-over Match:** गिरो तो ख़ुद को मत कोसो, तरीक़ा देखो — समय ग़लत, काम बड़ा, या फ़ोन पास? जाँच शांत है।

---


SCENE 075 → VIDEO PROMPT 075  (IMAGE 75 · source: `images/scene-075.jpg`)

**Scene Title:** सही समय का इंतज़ार

**Script Reference:** 'पहली बात — लोग सही समय का इंतज़ार करते हैं। सोमवार से। अगले महीने से। नए साल से। पर सोमवार कोई जादुई दिन नहीं है।'

**Image Analysis:** वाइड शॉट पीछे से: CHARACTER_01 डेस्क की कुर्सी पर उल्टा बैठकर खिड़की से बाहर देख रहा; डेस्क पर सब तैयार पर इस्तेमाल नहीं हुआ; बाहर साफ़ सुबह — सही समय का इंतज़ार।

**Visual Action:** खिड़की पर टिकी नज़र → धीरे सिर मुड़कर तैयार डेस्क की तरफ़ देखना → एक पल ठहरना → फिर वापस खिड़की; इंतज़ार बनाम मौजूद अवसर।

**Camera Movement:** Slow Push-in (पीछे से, खिड़की की रोशनी में)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide shot from behind, the young man sits backwards on his desk chair gazing out of the window at a clear bright morning, while the fully prepared desk beside him sits unused. Animate: he stares out of the window, slowly turns his head to look at the ready desk, holds the look for one weighted beat, then turns back to the window — waiting for a 'right time' that already exists. Camera: slow push-in from behind toward the window light. Environment: clear morning light steady outside. Mood: Monday is no magical day — today's clear morning is the witness. Preserve character identity, clothing, chair orientation, desk arrangement, window and room layout, lighting. No standing up, no sitting properly at desk, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, standing up, sitting at desk properly, rain outside, extra people

**Voice-over Match:** लोग सही समय का इंतज़ार करते हैं — सोमवार, अगला महीना; पर खिड़की के बाहर सुबह पहले से साफ़ है।

---


SCENE 076 → VIDEO PROMPT 076  (IMAGE 76 · source: `images/scene-076.jpg`)

**Scene Title:** बिना मन के भी ज़रूरी काम

**Script Reference:** 'रसोई में खाना बनाने वाला हर दिन प्रेरित नहीं होता। डॉक्टर हर सुबह उत्साह से नहीं उठता। नौकरी करने वाला हर रोज़ ख़ुश होकर ऑफ़िस नहीं जाता।'

**Image Analysis:** सादे घरेलू रसोई का कोना; मध्यम आयु की भारतीय महिला (CHARACTER_04, साड़ी) बिना उत्साह के रोज़मर्रा का काम कर रही; चेहरा शांत और थका; मीडियम शॉट।

**Visual Action:** दोहराई रसोई की क्रिया — हाथों का अभ्यस्त लयबद्ध काम (जैसे पतीली चलाना/आटा गूँधना, इमेज के अनुसार); कंधों की थकी ढिलाई; चेहरा शांत-थका, न शिकायत न जोश; भाप/आटा जैसा जो इमेज में है वही हल्का हिले।

**Camera Movement:** Slow Push-in (मामूली, सम्मानजनक)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot in a simple home kitchen corner, a middle-aged Indian woman in a saree performs her everyday cooking task without any enthusiasm, her face calm and tired. Animate: her hands continue the practiced routine motion shown in the image — steady, unhurried, muscle-memory rhythm; her shoulders carry tired ease, her expression stays calm without complaint or joy; any natural kitchen element already present in the image, such as faint steam, drifts gently. Camera: very slow respectful push-in. Environment: kitchen light steady. Mood: the cook in the kitchen is not inspired every day — she does it because it must be done. Preserve her exact identity, saree and jewelry, kitchen layout and object positions, lighting. No smiling for camera, no extra people, no new objects, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, smiling at camera, extra people, new kitchen objects, exaggerated gestures, identity drift

**Voice-over Match:** रसोई में खाना बनाने वाला हर दिन प्रेरित नहीं होता — करते हैं क्योंकि किया जाना ज़रूरी है।

---


SCENE 077 → VIDEO PROMPT 077  (IMAGE 77 · source: `images/scene-077.jpg`)

**Scene Title:** CHARACTER_02 — रोज़ की नौकरी

**Script Reference:** 'नौकरी करने वाला हर रोज़ ख़ुश होकर ऑफ़िस नहीं जाता। वे करते हैं, क्योंकि किया जाना ज़रूरी है।'

**Image Analysis:** सादा ऑफ़िस डेस्क; CHARACTER_02 (सफ़ेद शर्ट) स्क्रीन की तरफ़ झुका काम कर रहा; चेहरे पर न खुशी न शिकायत — सिर्फ़ नियमितता; मीडियम वाइड शॉट।

**Visual Action:** लगातार टाइपिंग/लेखन की सतत लय; बीच में एक छोटा posture adjust; स्क्रीन की रोशनी स्थिर; आँखों का पन्ने-स्क्रीन पर अभ्यस्त चलना।

**Camera Movement:** Gentle Sideways Dolly (डेस्क के साथ)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium wide shot of an ordinary office desk, a man in a white shirt (CHARACTER_02) leans toward his screen working, his face showing neither happiness nor complaint — only routine. Animate: his hands type or write in a continuous practiced rhythm, he shifts his posture once slightly, his eyes track the screen steadily, his expression stays flat and professional; the office around him remains still. Camera: one gentle slow sideways dolly along the desk line. Environment: office light even and steady. Mood: the office worker does not go to work happy every day — he goes because it must be done. Preserve CHARACTER_02's identity, white shirt, desk items and screen position, office layout, lighting. No smiling, no colleagues appearing, no readable screen content, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, colleagues appearing, readable screen content, smiling, papers flying, identity drift

**Voice-over Match:** नौकरी करने वाला हर रोज़ ख़ुश होकर ऑफ़िस नहीं जाता — वे करते हैं, क्योंकि ज़रूरी है।

---

SCENE 078 → VIDEO PROMPT 078  (IMAGE 78 · source: `images/scene-078.jpg`)

**Scene Title:** जानकारी बनाम अमल

**Script Reference:** 'दूसरी बात — जानकारी इकट्ठा करना और उस पर अमल करना, दो अलग चीज़ें हैं। हम बहुत पढ़ते हैं, बहुत वीडियो देखते हैं... सबूत ये है कि पिछले हफ़्ते तुमने क्या बदला।'

**Image Analysis:** टॉप-डाउन वाइड: CHARACTER_01 लैपटॉप/किताबों के ढेर के सामने पढ़ रहा; बग़ल में नोटबुक बिल्कुल खाली, पेन ढक्कन बंद — सीखना हो रहा, बदलना नहीं; असंतुलन साफ़।

**Visual Action:** पढ़ने की सतत लय — पन्ना पलटना/स्क्रीन पर नज़र; एक बार नज़र खाली नोटबुक पर जाती है, हाथ पेन की तरफ़ उठकर रुक जाता है; पढ़ना जारी, लिखना नहीं होता।

**Camera Movement:** Slow Push-in (top-down wide)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a top-down wide shot of the desk showing the imbalance — the young man reads in front of a laptop and stacks of books while the notebook beside him lies completely blank and the pen stays capped. Animate: he keeps reading with steady rhythm, turns a page or shifts his gaze across the screen; once his eyes drop to the blank notebook, his hand starts toward the capped pen and stops without lifting it; reading continues, writing never begins. Camera: very slow top-down push-in emphasizing the blank side of the desk. Environment: light steady. Mood: collecting information versus acting on it — two different things. Preserve character identity, clothing, laptop, book stacks, blank notebook and capped pen positions, desk layout, lighting. No readable screen or page text, no notebook getting written in, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, notebook filling with writing, pen uncapped, objects rearranging

**Voice-over Match:** बहुत पढ़ते हैं, बहुत वीडियो देखते हैं — सबूत ये है कि पिछले हफ़्ते तुमने क्या बदला; नोटबुक आज भी खाली।

---


SCENE 079 → VIDEO PROMPT 079  (IMAGE 79 · source: `images/scene-079.jpg`)

**Scene Title:** तुलना — चमकती तस्वीर बनाम बिखरा दिन

**Script Reference:** 'चौथी बात — तुम्हारी तुलना किसी और से नहीं, तुम्हारे कल के संस्करण से होनी चाहिए। सोशल मीडिया पर तुम्हें किसी की चमकती हुई तस्वीर दिखती है, तुम्हारा अपना बिखरा हुआ दिन दिखता है।'

**Image Analysis:** मीडियम शॉट: CHARACTER_01 बिस्तर पर बैठा फ़ोन स्क्रीन देख रहा; स्क्रीन की चमक चेहरे पर; चारों ओर कमरा बिखरा और फीका — चमकती तस्वीर बनाम बिखरा दिन।

**Visual Action:** अंगूठे की धीमी स्क्रॉल; चेहरे पर चमक का बदलना; भाव सपाट-तुलनात्मक; आसपास का बिखरा कमरा स्थिर और फीका — कंट्रास्ट गहरा हो।

**Camera Movement:** Slow Pull-back (कमरा और फीका करते हुए)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot contrasting the bright phone screen with the dull room — the young man sits on the bed watching the screen, its glow on his face, while the scattered lifeless room surrounds him. Animate: his thumb scrolls slowly, the screen glow shifts across his flat envious face, and the messy faded room stays perfectly still around him; the contrast deepens without anything moving. Camera: very slow pull-back widening the dull room around the bright rectangle. Environment: room light stays dim and lifeless. Mood: on social media you see someone's shining picture and your own scattered day. Preserve character identity, clothing, phone and bed positions, room clutter layout, lighting. No readable screen content, no standing up, no tidying, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable screen content, smiling, standing up, room tidying itself

**Voice-over Match:** सोशल मीडिया पर किसी की चमकती तस्वीर और तुम्हारा बिखरा दिन — तुलना का सबसे बेईमान फ़्रेम।

---


SCENE 080 → VIDEO PROMPT 080  (IMAGE 80 · source: `images/scene-080.jpg`)

**Scene Title:** आदत बनने में समय — और वह समय अलग-अलग

**Script Reference:** 'पाँचवीं बात... लंदन के यूनिवर्सिटी कॉलेज के शोधकर्ताओं ने देखा कि नई आदत अपने आप होने लगने में औसतन लगभग दो महीने लगते हैं — और इसमें फ़र्क़ बहुत बड़ा है।'

**Image Analysis:** कैलेंडर पृष्ठ का क्लोज़-अप: आधे खाने हल्के पुराने निशानों से भरे, बाक़ी खाली — प्रगति अधूरी पर दिख रही; समय का फैलाव; कोई पात्र नहीं।

**Visual Action:** कोई पात्र नहीं; पृष्ठ स्थिर; रोशनी बहुत धीरे भरे खानों से खाली खानों की तरफ़ सरकती — समय का फैलाव दिखता; धूल के कण।

**Camera Movement:** Very slow push-in / light drift

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up detail shot of a single calendar page spread with time — half the squares filled with faint old marks, the rest still empty, progress visible but incomplete, no person. Animate: keep the page perfectly still; the light creeps very slowly across from the filled squares toward the empty ones, as if time itself is being shown, faint dust drifting through the frame. Camera: very slow push-in following the light's path. Mood: a new habit takes on average about two months — and the individual range is huge; some squares fill early, some late. Preserve mark positions and counts, page texture, lighting direction. No new marks appearing, no hand entering, no numbers becoming readable, no page flipping, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, new marks appearing, hand entering, readable numbers or month names, page flipping

**Voice-over Match:** नई आदत अपने आप होने में औसतन लगभग दो महीने — और फ़र्क़ बहुत बड़ा; भरे-खाली खाने यही कहते।

---


SCENE 081 → VIDEO PROMPT 081  (IMAGE 81 · source: `images/scene-081.jpg`)

**Scene Title:** कभी-कभी कारण डर होता है

**Script Reference:** 'छठी बात — कभी-कभी मन नहीं करता का असली कारण आलस नहीं होता। कभी वो डर होता है — कि कहीं मेहनत के बाद भी नतीजा अच्छा न आए। इसलिए हम शुरू ही नहीं करते।'

**Image Analysis:** क्लोज़-अप: CHARACTER_01 बंद किताब पर दोनों हाथ रखे बैठा; आँखें किताब पर टिकीं पर हाथ खोल नहीं रहे; चेहरे पर सुस्ती नहीं, डर।

**Visual Action:** हाथों का कवर पर कसना → हल्का काँपना-सा ठहराव → उँगलियों का ढीला होना बिना खोले; आँखें टिकी रहना; गले में एक निगलना; डर बनाम आलस का फ़र्क़ चेहरे पर।

**Camera Movement:** Slow Push-in (हाथों से चेहरे की ओर)

**Motion Intensity:** LOW

**Suggested Duration:** 6–8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a close-up of the young man sitting with both hands resting on the closed book, eyes fixed on it but hands not opening it — his face shows fear, not laziness. Animate: his fingers tighten on the cover, hold with a faint tremor of hesitation, then loosen without opening the book; his eyes stay locked on the closed cover, he swallows once, the fear settling quietly on his face. Camera: slow push-in traveling from the gripping hands up to his face. Environment: light steady. Mood: sometimes 'I don't feel like it' is really 'I fear the result may still be bad after all the effort'. Preserve character identity, clothing, hand anatomy, closed book position, lighting. No book opening, no crying, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, book opening, crying, hands morphing, exaggerated terror, standing up

**Voice-over Match:** कभी-कभी असली कारण आलस नहीं, डर होता है — हाथ किताब पर हैं, पर खोल नहीं रहे।

---


SCENE 082 → VIDEO PROMPT 082  (IMAGE 82 · source: `images/scene-082.jpg`)

**Scene Title:** बिना मन के भी थोड़ा-थोड़ा

**Script Reference:** 'जो बिना मन के भी थोड़ा-थोड़ा कर लेता है, वो धीरे-धीरे इतना आगे निकल जाता है कि लोग उसे क़िस्मत वाला कहने लगते हैं।'

**Image Analysis:** वाइड मॉर्निंग शॉट: CHARACTER_01 सुबह जल्दी डेस्क पर पढ़ रहा; कमरा साफ़-सुथरा, कैलेंडर पर कई निशान; चेहरे पर न जोश न उदासी — स्थिरता।

**Visual Action:** स्थिर पढ़ने-लिखने की रोज़मर्रा लय; पन्ना पलटना; कैलेंडर के निशान स्थिर गवाह; सुबह की रोशनी धीरे बढ़ती; अनुशासन की नीरस सुंदरता।

**Camera Movement:** Gentle Sideways Dolly (पूरा रूटीन दिखाते हुए)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide early-morning shot of a steady working routine — the young man reads at his tidy desk, the marked calendar visible with several faint marks, his face showing neither excitement nor sadness, only consistency. Animate: he reads and writes in a calm practiced rhythm, turns one page, his expression stays even; the morning light slowly strengthens across the clean room while the marked calendar stands as a quiet witness. Camera: one gentle slow sideways dolly across the orderly room. Mood: he who does a little even without feeling like it quietly pulls ahead until people call him lucky. Preserve character identity, clothing, tidy room and desk layout, calendar marks, lighting. No readable text, no visitors, no celebration, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, people entering, celebration, room becoming messy

**Voice-over Match:** जो बिना मन के भी थोड़ा-थोड़ा कर लेता है, वो धीरे-धीरे इतना आगे निकल जाता है कि लोग क़िस्मत वाला कहते।

---


SCENE 083 → VIDEO PROMPT 083  (IMAGE 83 · source: `images/scene-083.jpg`)

**Scene Title:** अनुशासन = भविष्य वाले ख़ुद के लिए एक छोटा काम

**Script Reference:** 'अनुशासन का मतलब ख़ुद को सज़ा देना नहीं है। इसका मतलब है — अपने भविष्य वाले ख़ुद की तरफ़ से आज एक छोटा सा काम कर देना।'

**Image Analysis:** मीडियम शॉट: CHARACTER_01 कल के लिए किताब खोलकर, पन्ने पर पेन रखकर, कुर्सी सीधी करके उठ रहा — एक छोटा सा काम पूरा करके; भविष्य वाले ख़ुद के लिए तोहफ़ा।

**Visual Action:** पूरा सूक्ष्म-क्रम: किताब खोलकर सही पन्ना रखना → पेन पन्ने पर टिकाना → कुर्सी हल्का सीधा करना → शांत भाव से उठ खड़े होना; हर हरकत छोटी और सोची हुई।

**Camera Movement:** Slow Pull-back (उठते पात्र के साथ)

**Motion Intensity:** MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a medium shot of the young man finishing a small thoughtful sequence at his desk — the book opened to tomorrow's page, the pen laid on it, the chair being straightened as he rises. Animate: in one calm sequence he opens the book to the right page, rests the pen neatly on it, nudges the chair straight, and stands up with quiet ease, a small uncelebrated satisfaction on his face. Camera: slow gentle pull-back as he rises, letting the prepared desk stay visible in frame. Environment: room light steady. Mood: discipline is not self-punishment — it is one small favor done today for your future self. Preserve character identity, clothing, book, pen and chair final positions, desk layout, lighting. No readable text, no lamp switching, no scene change, no extra objects.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, objects vanishing, extra objects, exaggerated smile, lamp going off

**Voice-over Match:** अनुशासन सज़ा नहीं — भविष्य वाले ख़ुद की तरफ़ से आज एक छोटा काम; किताब खुली, पेन रखा, कुर्सी सीधी।

---


SCENE 084 → VIDEO PROMPT 084  (IMAGE 84 · source: `images/scene-084.jpg`)

**Scene Title:** तीन शर्तें — छोटा काम, दूर फ़ोन, लौट आना

**Script Reference:** 'बस इतना चाहिए कि तुम काम को इतना छोटा कर दो कि शुरू करना नामुमकिन न रहे, फ़ोन को इतना दूर रख दो कि हर पाँच मिनट में फ़ैसला न लेना पड़े, और एक दिन छूट जाए तो दूसरे दिन ज़रूर लौट आओ।'

**Image Analysis:** साफ़ टॉप-डाउन डेस्क: खुली किताब के एक पन्ने पर उँगली, किनारे पर छोटा टाइमर, और दूर दराज बंद — फ़ोन कहीं नहीं; तीन शर्तें एक फ़्रेम में।

**Visual Action:** उँगली का पन्ने की पहली पंक्ति पर एक हल्का ठहराव; टाइमर और बंद दराज स्थिर; रोशनी सीधी और साफ़ — तीन शर्तों का शांत सारांश।

**Camera Movement:** Slow drift (उँगली → टाइमर → दराज)

**Motion Intensity:** LOW

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a clean top-down detail shot of the desk holding the three practical elements — a finger resting on one page of the open book, a small timer at the edge, and the closed drawer far away with no phone anywhere. Animate: the finger holds still on the first line of the page with a tiny settling press; the timer and drawer stay motionless; light stays clean and direct; faint dust drifts. Camera: one slow smooth drift across the frame linking finger, timer, and closed drawer — the three conditions in one movement. Mood: make the work so small that starting stays possible, the phone so far that no five-minute decision is needed, and always return the next day. Preserve hand anatomy, book, timer and drawer positions, desk surface, lighting. No readable text or timer digits, no phone appearing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable text, timer digits readable, phone appearing, drawer opening, extra hands

**Voice-over Match:** तीन शर्तें — काम इतना छोटा कि शुरू करना मुमकिन रहे, फ़ोन इतना दूर कि फ़ैसला न लेना पड़े, और एक दिन छूटे तो लौट आना।

---


SCENE 085 → VIDEO PROMPT 085  (IMAGE 85 · source: `images/scene-085.jpg`)

**Scene Title:** दो मिनट में शुरुआत

**Script Reference:** 'ये वीडियो बंद करने के बाद अगले दो मिनट में — सिर्फ़ दो मिनट में — वो काम शुरू कर दो जो तुम टाल रहे हो।'

**Image Analysis:** फ़र्स्ट-पर्सन क्लोज़-अप: दोनों हाथ बंद किताब/फ़ाइल खोल रहे; डेस्क साफ़, रोशनी सीधी; चेहरा फ़्रेम में नहीं — दर्शक के अपने हाथ जैसा दृश्य; दो मिनट की अपील।

**Visual Action:** कवर पर हाथों का टिकना → सहज खोलना → पन्नों का बराबर होना → उँगलियों का पहला पन्ना थामना; POV में हल्का स्वाभाविक हाथ-कंपन; सीधी क्रिया, कोई चेहरा नहीं।

**Camera Movement:** Static POV / micro push-in

**Motion Intensity:** MEDIUM

**Suggested Duration:** 5–6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a first-person perspective close-up of two hands opening a closed book or file on a clean desk in direct light, no face in frame. Animate: the hands settle on the cover, open it in one smooth natural motion, the pages fan and level, and the fingertips press the first page flat — as if these are the viewer's own hands starting right now; only natural subtle hand motion, no camera theatrics. Camera: locked POV frame with a micro push-in toward the opening pages. Environment: clean desk, steady direct light. Mood: the two-minute start — after this video ends, begin the thing you have been postponing. Preserve hand anatomy, book and desk appearance, lighting. No readable text, no face appearing, no extra objects, no warped fingers, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, face appearing, readable text, warped fingers, extra objects, camera lifting up

**Voice-over Match:** ये वीडियो बंद करने के बाद अगले दो मिनट में — सिर्फ़ दो मिनट में — टाला हुआ काम शुरू कर दो; हाथ तुम्हारे हैं।

---


SCENE 086 → VIDEO PROMPT 086  (IMAGE 86 · source: `images/scene-086.jpg`)

**Scene Title:** बड़े बदलाव छोटे पलों से

**Script Reference:** 'क्योंकि ये पूरा वीडियो इसी एक पल के बारे में था — वो पल जब मन नहीं करता, और तुम फिर भी शुरू कर देते हो। ज़िंदगी में बड़े बदलाव ऐसे ही पलों से बनते हैं।'

**Image Analysis:** वाइड नाइट शॉट: CHARACTER_01 डेस्क पर झुका लिख रहा, कमरे में सिर्फ़ लैंप की रोशनी; खिड़की के बाहर गहरा अंधेरा — बाहरी दुनिया बड़ी नहीं, यह छोटा पल बड़ा।

**Visual Action:** लगातार शांत लिखना; लैंप के प्रकाश-वृत्त में सिमटा संसार; साँस की लय; खिड़की का अंधेरा स्थिर — एकमात्र गति यह काम करता पल।

**Camera Movement:** Slow Push-in (वाइड से डेस्क की तरफ़)

**Motion Intensity:** LOW

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a wide night shot of a single lit desk in a dark room — the young man leans over writing under the only pool of lamplight, deep darkness beyond the window. Animate: he writes in a slow continuous rhythm inside the small circle of light, his breathing even, the lamp glow holding steady like the only world that exists; the darkness outside stays absolute and still. Camera: very slow push-in from the wide room toward the lit desk. Mood: this whole video was about one moment — the moment you don't feel like it, and start anyway; big changes are built from such moments. Preserve character identity, clothing, desk and lamp positions, window, night palette. No readable handwriting, no lights turning on elsewhere, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable handwriting, room lights turning on, people appearing, daylight leaking

**Voice-over Match:** पूरा वीडियो इसी एक पल के बारे में था — मन नहीं करता, और तुम फिर भी शुरू कर देते हो।

---


SCENE 087 → VIDEO PROMPT 087  (IMAGE 87 · source: `images/scene-087.jpg`)

**Scene Title:** तीस दिन बाद का सवाल

**Script Reference:** 'अगर मैं अगले तीस दिन रोज़ बस थोड़ा सा करता रहूँ, बिना मन के भी, तो तीस दिन बाद मेरा दिन कैसा दिखेगा?'

**Image Analysis:** वही कमरा, अब सुबह की खुली रोशनी में; डेस्क साफ़, किताब खुली, कैलेंडर पर निशानों की लंबी क़तार; CHARACTER_01 खिड़की के पास खड़ा सोच में — तीस दिन बाद का सवाल।

**Visual Action:** खिड़की से धीरे मुड़कर कैलेंडर की क़तार देखना → फिर तैयार डेस्क पर नज़र → हल्का संतुष्ट सिर हिलाना → एक क़दम डेस्क की तरफ़; सोच से कर्म की ओर मुड़ना।

**Camera Movement:** Slow Track (खिड़की से कैलेंडर/डेस्क की ओर)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 8 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: the same room now flooded with open morning light — the desk tidy with the book open, the calendar showing a long row of faint marks, the young man standing thoughtfully near the window. Animate: he turns slowly from the window, his gaze travels to the long row of marks on the calendar, then to the ready desk; he gives one small satisfied nod and takes a single step toward the desk. Camera: one slow smooth track following his look from the calendar to the desk. Environment: bright steady morning light, room unchanged in layout. Mood: 'if I keep doing a little every day for thirty days, what will my day look like then?' — the answer visible on the wall. Preserve character identity, clothing, room layout, calendar marks count, desk arrangement, lighting. No readable numbers, no new marks appearing, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, readable numbers, new marks appearing, extra people, room layout changing

**Voice-over Match:** तीस दिन बाद का सवाल — जवाब दीवार पर निशानों की लंबी क़तार बनकर पहले से खड़ा है।

---


SCENE 088 → VIDEO PROMPT 088  (IMAGE 88 · source: `images/scene-088.jpg`)

**Scene Title:** कमेंट में लिखो — कौन सा काम टाल रहे हो

**Script Reference:** 'एक बात कमेंट में लिख दो — वो कौन सा काम है जिसे तुम सबसे लंबे समय से टाल रहे हो, और आज का तुम्हारा दो मिनट वाला पहला क़दम क्या होगा?'

**Image Analysis:** फ़्रंट-फ़ेसिंग मीडियम क्लोज़-अप: CHARACTER_01 डेस्क पर सीधा बैठा, एक हाथ खुली नोटबुक पर, दूसरा पेन लिए; सीधे सामने देखता — जैसे दर्शक से बात कर रहा हो (पूरी फ़िल्म में एकमात्र सीधा कैमरा-संपर्क)।

**Visual Action:** सीधी आँखों का कैमरा-संपर्क बनाए रखना; एक गर्म हल्का सिर हिलाना; पेन का नोटबुक पर एक हल्का ठहराव; होंठों की बहुत हल्की हिलचल जैसे कुछ कह रहे हों (बिना बुदबुदाहट नाटक); बाक़ी स्थिर।

**Camera Movement:** Static / very slow push-in (सीधा, ईमानदार फ़्रेम)

**Motion Intensity:** LOW–MEDIUM

**Suggested Duration:** 6 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: a front-facing medium close-up, the young man sits upright at his desk, one hand on the open notebook, the other holding a pen, looking straight ahead as if speaking to the viewer — the only direct camera contact in the whole film. Animate: he holds steady honest eye contact with the lens, gives one small warm nod, the pen rests with a light tap on the notebook, his lips move faintly as if finishing a sentence, expression sincere and calm. Camera: locked frontal frame with a very slow push-in, intimate and direct. Environment: room light steady. Mood: a personal request — write in the comments the task you have been postponing longest and your two-minute first step. Preserve character identity, clothing, notebook, pen and desk positions, lighting. No readable text, no looking away, no smile breaking into laugh, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, looking away from camera, readable text, laughing, waving at camera, identity drift

**Voice-over Match:** कमेंट में लिखो — सबसे लंबे समय से टाला काम कौन-सा, और आज का दो मिनट वाला पहला क़दम क्या?

---


SCENE 089 → VIDEO PROMPT 089  (IMAGE 89 · source: `images/scene-089.jpg`)

**Scene Title:** अंतिम दृश्य — खुली किताब, सुबह की रोशनी

**Script Reference:** 'अगर ये बातें काम की लगीं, तो चैनल पर बने रहना — यहाँ हम मोटिवेशन की बातें कम और तरीक़े ज़्यादा करते हैं।'

**Image Analysis:** अंतिम स्टिल-लाइफ़: खाली डेस्क — खुली किताब, पन्ने पर पेन, किनारे छोटा टाइमर, सुबह की सीधी रोशनी; कुर्सी थोड़ी पीछे खिसकी जैसे कोई अभी आने वाला हो; ऊपरी-दाएँ खाली जगह एंड-स्क्रीन के लिए।

**Visual Action:** कोई पात्र नहीं; डेस्क बिल्कुल स्थिर; सुबह की रोशनी धीरे गर्म और फैलती; धूल के कण तैरते; खाली कुर्सी इंतज़ार करती — अगला क़दम दर्शक का।

**Camera Movement:** Slow Pull-back (एंड-स्क्रीन स्पेस छोड़ते हुए)

**Motion Intensity:** LOW

**Suggested Duration:** 8–10 सेकंड

**IMAGE-TO-VIDEO PROMPT:**
Source image: the closing wide still-life of the ready desk — the open book with the pen on its page, the small timer at the edge, direct morning light, the chair pushed slightly back as if someone is about to arrive, empty space in the upper right for an end screen. Animate: keep every object perfectly still; the morning light slowly warms and spreads across the desk, faint dust drifts through the beam, the empty chair waits. Camera: one very slow pull-back settling into the final wide composition with the upper-right area staying clean and empty. Mood: calm quiet confidence — less motivation talk, more method; the seat is ready, the next move belongs to the viewer. Preserve exact positions of book, pen, timer and chair, desk and room layout, warm morning palette. No person entering, no objects moving, no readable text or timer digits, no scene change.

**NEGATIVE PROMPT:**
scene change, cut inside clip, unexpected transition, new characters, extra people, identity change, face morphing, clothing change, hairstyle change, body distortion, warped hands, extra fingers, missing fingers, duplicated limbs, unnatural walking, floating objects, objects appearing or disappearing, background deformation, flickering textures, jitter, unnatural eye movement, exaggerated motion, sudden zoom, fast camera movement, camera shake, speed ramp, readable text, legible letters, subtitles, captions, watermark, logo, blurry, low resolution, person entering or sitting, objects moving, readable text, timer digits, light flickering

**Voice-over Match:** यहाँ मोटिवेशन की बातें कम और तरीक़े ज़्यादा होते हैं — कुर्सी खाली, किताब खुली, अगला क़दम तुम्हारा।

---


# APPENDIX — पूरे वीडियो का सारांश और QC

## कुल आँकड़े

- कुल प्रॉम्प्ट: **89** (Scene 001 → 089, कोई इमेज छूटी नहीं, क्रम अटूट)
- Motion Intensity वितरण: LOW ≈ 45 · LOW–MEDIUM ≈ 22 · MEDIUM ≈ 20 · HIGH = 1 (Scene 024 — खड़ी गाड़ी का धक्का, पूरी फ़िल्म का सबसे भारी शारीरिक क्षण)
- सुझाई कुल क्लिप-अवधि: ≈ 8–10 मिनट कच्चा फ़ुटेज; voice-over (~25.6 मिनट) के नीचे Ken Burns/dissolve/ठहराव के साथ एडिट करने पर 28–30 मिनट का वीडियो (देखें `images/README.md`)
- कैमरा विविधता: Push-in, Pull-back, Pan, Dolly, Track, Rack Focus, POV, Static + micro push — कोई एक मूवमेंट बार-बार थोपा नहीं गया; भावनात्मक क्षणों (011, 039, 064, 088) पर लगभग स्थिर कैमरा

## Continuity नियम (हर क्लिप में लागू)

1. **लैंप हमेशा बाईं ओर** — किसी क्लिप में रोशनी की दिशा न बदलें।
2. CHARACTER_01 की पहचान/कपड़े स्रोत इमेज से locked; जिम दृश्यों (013–015) में ग्रे जैकेट।
3. OBJECT CHAINS सुरक्षित: किताब (007→026→035→089), फ़ोन-दूरी (029→032→033→058→070→084), कैलेंडर-निशान (027→049→071→073→080→082/087), टाइमर (070→084/089)।
4. कोई भी पढ़ने योग्य टेक्स्ट/अंक कहीं नहीं बनना चाहिए — स्क्रीन, पन्ने, कैलेंडर, टाइमर सब धुँधले/सादे।
5. Scene 088 = एकमात्र सीधा कैमरा-संपर्क; Scene 089 के ऊपरी-दाएँ हिस्से को खाली रखें (end screen)।

## FINAL QUALITY CHECK — 10 में से 10 ✅

1. हर इमेज सही स्क्रिप्ट हिस्से से जुड़ी (Script Reference + Voice-over Match फ़ील्ड में) ✅
2. हर क्लिप का एक्शन voice-over के अर्थ से मेल खाता (कार दृश्य = activation energy; दो केक दृश्य = नियम बनाम पहचान; आदि) ✅
3. पात्र पहचान हर प्रॉम्प्ट के preservation निर्देशों में locked ✅
4. गतिविधियाँ स्वाभाविक — blinking, breathing, realistic body mechanics, कोई ज़बरदस्ती नहीं ✅
5. कैमरा मूवमेंट दृश्य की भावना के अनुसार चुना, विविध ✅
6. कोई नई वस्तु/पात्र जोड़ने का निर्देश नहीं — उल्टा हर प्रॉम्प्ट में मना ✅
7. सभी क्लिप 16:9 · 1920×1080 · 24 FPS लक्ष्य के लिए ✅
8. हर इमेज के लिए अलग, self-contained प्रॉम्प्ट ✅
9. 001→089 अटूट क्रम ✅
10. Visual continuity (लैंप, कपड़े, object chains, palette) Appendix नियमों से सुरक्षित ✅

## जनरेटर-टिप्स

- **5-सेकंड वाले टूल (Pika/Runway gen-2 आदि):** प्रॉम्प्ट के पहले दो action beats रखें, बाक़ी हटाएँ।
- **8–10 सेकंड वाले टूल (Kling, Veo, Luma):** पूरा प्रॉम्प्ट जैसा है वैसा चलें।
- Negative prompt सपोर्ट न हो तो प्रॉम्प्ट के अंत की preservation/avoidance पंक्तियाँ ही काफ़ी हैं।
- Motion/creativity slider: LOW intensity दृश्यों पर 3–4/10, MEDIUM पर 5–6/10, HIGH (Scene 024) पर 7/10।
- हर clip को generate करने के बाद पहला फ़्रेम source image से मिलाएँ — पहचान या लैंप-दिशा बदले तो दोबारा generate करें।
