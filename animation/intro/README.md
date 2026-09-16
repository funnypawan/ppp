# सोच सेठ — YouTube channel intro (5 second)

`sochseth_intro_1080p60.mp4` — 1920×1080, 60 fps, 5.00 s, H.264 + AAC stereo.
Sab kuch code se bana hai (koi video editor nahi): `make_intro.py`.

## Beat sheet (5 s)

| Time | Kya hota hai | Sound |
|---|---|---|
| 0.00–0.44 | glow rise, dust motes, patli light-line | silence → air |
| 0.44–1.30 | letters SOCH / SETH fly-in (stagger 70 ms + scale overshoot + tracking khulta hai) | riser (160→900 Hz) |
| 1.30 | **IMPACT**: flare + spark burst + camera zoom 1.055→1.0 + shake | sub-boom + crack |
| 1.34 | voice sting "सोच सेठ" (AI voice, reverb ke saath) | voice + bell shimmer |
| 1.50–2.15 | gold→teal underline center se grow | shimmer continue |
| 1.62–2.60 | हिन्दी tagline + english kicker upar slide hokar aate hain | — |
| 2.30–3.10 | Sheru mascot bottom-right se pop (squash + overshoot), tail wag | whoosh + boing |
| 3.30–3.95 | wordmark par shine sweep | — |
| 4.05–5.00 | SUBSCRIBE pill pulse + bell wiggle, slow push-in, fade out | 3 ticks → fade |

## Chalao

```bash
cd ppp/animation/intro
../../.venv/bin/python make_intro.py --preview 0.45,1.35,2.5,4.6   # stills -> out/
../../.venv/bin/python make_intro.py --render --gif                # MP4 + preview.gif
```

## Customize (sirf ye lines badlo)

| Kya | Line | Note |
|---|---|---|
| Channel name | `BRAND_A, BRAND_B = "SOCH", "SETH"` | do hisse = do rang (silver + gold→teal) |
| Tagline | `TAG_HI`, `KICKER` | `KICKER` ko letterspaced chalta hai |
| Rang | `GOLD / TEAL / CORAL / LIGHT / BG0 / BG1` | repo ke HTML guide wale hi colors |
| Lambai | `DUR = 5.0` + beat values (`seg(t, a, b)`) | `DUR` badloge to audio bhi apne aap lambi |
| Speed/smoothness | `FPS = 60` | 30 kar do to render aadha |
| Quality/size | `--crf` `make_animation.encode()` me (18 default) | 16 = better, 23 = chhota |
| Voice sting | `audio/voice_sting.wav` | apni awaaz record karke daal do, auto-resample ho jaayegi |

Motion ki timing `seg(t, start, end)` se chalti hai — har feature ke liye ek segment.
`back_out()` overshoot deta hai (letters/pill "thoda" cross karke rukte hain) — yahi
animation ko "professional" lagata hai.

## Video me kaise lagaye

- **CapCut (mobile/PC)**: intro clip ko timeline ke start me rakho → agar cut dikh raha ho to
  Don't-need-his-hissa 6–8 frames trim karo → "Blend: Screen" try karo agar aap bg match karna ho.
- **ffmpeg (batch)**:
  ```bash
  ffmpeg -i sochseth_intro_1080p60.mp4 -i episode.mp4 -filter_complex \
    "[0:v][1:v]concat=n=2:v=1[a];[0:a][1:a]amix=inputs=2:duration=first:weights='1 0'[b]" \
    -map "[a]" -map "[b]" -c:v libx264 -crf 19 -c:a aac -b:a 192k out_with_intro.mp4
  ```
  (intro ke baad episode ka audio正常 rahe, isliye `amix` me weights `1 0` — chaaho to
  `apad` se 5 s silence add karke simple concat bhi kar sakte ho.)
- YouTube → Settings → **Branding → Video watermark** me bhi yahi clip loop karke chalta hai.

Files: `sochseth_intro_1080p60.mp4` · `sochseth_intro_preview.gif` · `sochseth_intro_poster.jpg`
(end-card/thumbnail ke liye still) · `make_intro.py`
