# The Psychology of Money (Hindi) — script + VO + finished video

**Direct download (71 MB, 13:34, 1080p):**
https://github.com/funnypawan/ppp/raw/arena/01a0b360-ppp/psychology-of-money/psychology-of-money.mp4

File page: https://github.com/funnypawan/ppp/blob/arena/01a0b360-ppp/psychology-of-money/psychology-of-money.mp4

Edit is picture-locked to the 12 VO stems: Ken Burns on all 51 stills, cross-faded cuts, cinematic letterbox, gold progress bar, lesson-title cards, versus/stat/quote overlays, and Mukta Devanagari subtitles. Rebuild with:

```
python3 build_edit.py && python3 make_ass.py && python3 render_final.py
```

## Files
| file | what it is |
|---|---|
| `script-final.md` | rewritten shooting script: timestamps, `[VISUAL]`/`[TEXT]` cues, `**Why**` notes per section, plus Appendix A (fact-check of the old draft) and Appendix B (structural changes) |
| `voiceover.txt` | only the spoken words, split per clip (auto-generated — `python3 build_clips.py`) |
| `clip01.wav … clip10.wav` | recorded VO stems, 44.1 kHz mono (one stem per edit beat) |
| `clip01.mp3 … clip10.mp3` | same stems, 112 kbps (small; safe to commit) |
| `clip11.* … clip12.*` | recap + CTA stems — now recorded (1:13 + 0:37) |
| `voiceover-full.mp3` | **listen to this** — all 12 clips joined = 13 min 34 s |
| `voiceover-full-loudnorm.mp3` | same, normalised to −14 LUFS for YouTube (use this one if you don't do a loudness pass in the edit) |
| `voiceover.srt` | 91 cues, timecodes match `voiceover-full-part1.mp3` exactly — drop it on the timeline as your sync map |

## Status
- Images: 51 / 51 generated ✅ (`clip12-01` needed two tries — the model first returned no image; the retake is the good one).
- New: `timeline.csv` (12 VO clips: in/out timecode, section, image list) and `images-timeline.csv` (51 images with a suggested in-point + duration, evenly spread inside each clip — tune by eye).
- Script is fully voiced: hook, intro, lessons 1–8, recap, finale callback, CTA. 13:34 of narration.
- `voiceover.srt` (105 cues) is timed against `voiceover-full.mp3` end to end.
- Block 14 of the script ("पर असली line यह है — decision ऐसे लो कि luck साथ न दे…") is deliberately **not** spoken — run it as a text card over B-roll at ~2:55.

## Images
32-shot prompt sheet in `image-prompts.md`; generated stills in `img/` (check-in status: see the ✅/⏳ column there). Prompts intentionally avoid text, logos and real faces.

## Editing notes for this VO
1. Read the stems as beats: every clip ends on a full stop → 0.4–0.6 s room tone between clips, 1.2 s after the hook and after Rajat Gupta.
2. Music: no bed under the hook (0:00–0:26), soft pad from "किताब के बीस chapters", and drop everything out for "पैसे का खेल IQ का नहीं behaviour का है".
3. Target −14 LUFS integrated for YouTube: this VO sits ~5 dB low, so a gentle `loudnorm=I=-14:TP=-1.5:LRA=11` pass on the master is enough.
4. Any card that shows a number (₹5,000 SIP, 99%, $8M) is on-screen text only — the VO says it in words on purpose, so the visuals must carry the digits.
