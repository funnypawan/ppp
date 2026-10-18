# Phone-cover UGC-style ad

**Deliverable:** `phone-cover-ugc-ad-10s-vertical.mp4` — 10 seconds, vertical 9:16, 1080×1920, 24 fps, H.264/AAC.

The cut follows the requested beats: selfie hook, close-up case details, gentle drop onto bedding and pick-up, then a final CTA. It uses the selected ₹299 offer price, clean burned-in Hinglish captions, and a conversational Hindi voiceover. There is no background music.

## Rebuild

From the repository root, install the small Python dependencies and run the builder:

```bash
python3 -m pip install -r video/ugc-phone-cover/requirements.txt
python3 video/ugc-phone-cover/build_ad.py
```

The build script reads the generated stills and WAVs alongside itself; intermediate overlays and encoded segments go under the ignored `build/` directory.

## Production note

This is an image-based UGC-style animatic: the generated stills receive subtle handheld/zoom motion and are edited to the requested timing. It is not live-action footage and does not include lip-sync animation. The phone/case is a generic unbranded sage-green concept, not a claim about a specific device model or tested drop rating.
