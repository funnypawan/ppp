#!/usr/bin/env python3
"""
Story video builder — "Monkey bhai ke birthday ka mini DJ"
8 generated keyframes + Hindi voiceover + 145 BPM music  ->  wide (16:9) + shorts (9:16)

Uses the shared engine in build_v2.py (Ken Burns, voice sync, SFX, mixing).
Run:  python3 build_story.py both
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_v2 as B

BASE = "/home/user/ppp/mini-dj-intro"
B.WB = f"{BASE}/story_build"        # voice files yahan hain
B.OUT = f"{BASE}/out"
B.MUSIC = f"{BASE}/video_build/music.wav"
os.makedirs(B.OUT, exist_ok=True)

# (image, voice, camera move, vertical caption)
B.SHOTS = [
    ("08_E1_broken_dj.jpg",         "vo1.mp3", "in",      "Purana mini DJ band ho gaya!"),
    ("09_E2_papa_purse.jpg",        "vo2.mp3", "out",     "Papa bole: paise nahi hain!"),
    ("06_scriptE_truck_lineup.jpg", "vo3.mp3", "right",   "Mayank bhai + gaadi ka chunav"),
    ("10_E4_speaker_tower.jpg",     "vo4.mp3", "in",      "Oye! Kaise mast speaker hain!"),
    ("11_E5_generator_smoke.jpg",   "vo5.mp3", "in_slow", "Generator kharab ho gaya!"),
    ("07_scriptE_doggy_entry.jpg",  "vo6.mp3", "left",    "Doggy bhai rescue pe aaya!"),
    ("12_E7_monkey_dance_cake.jpg", "vo7.mp3", "out",     "Bajao bajao! Birthday DJ ready"),
    ("03_logo_reveal.jpg",          "vo8.mp3", "in_slow", "MINI DJ - Subscribe karo!"),
]

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    jobs = []
    if which in ("both", "wide"):
        jobs.append(("wide", "mini-dj-story-birthday-16x9.mp4"))
    if which in ("both", "vertical"):
        jobs.append(("vertical", "mini-dj-story-birthday-9x16.mp4"))
    for layout, name in jobs:
        print(f"\n=== STORY {layout.upper()} ({len(B.SHOTS)} shots) ===")
        concat, starts, durs = B.build_segments(layout)
        B.final_mix(layout, concat, starts, durs, name)
