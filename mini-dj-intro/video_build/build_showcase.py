#!/usr/bin/env python3
"""
Vehicle showcase episode — "Kaun si gaadi par banega DJ?"
7 shots (naye tractor / e-rickshaw / auto keyframes + pehle wale) + Hindi VO + BASS-HEAVY music
Run: python3 build_showcase.py both
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_v2 as B

BASE = "/home/user/ppp/mini-dj-intro"
B.WB = f"{BASE}/showcase_build"; B.OUT = f"{BASE}/out"
B.MUSIC = f"{BASE}/video_build/music_bass.wav"
B.MUSIC_VOL_DIALOG, B.MUSIC_VOL_LOGO = 0.062, 0.135      # bass version -> thoda loud

B.SHOTS = [
    ("13_E8_tractor_dj.jpg",        "vo1.mp3", "in",      "Tractor trolley par mini DJ!"),
    ("14_E9_erickshaw_dj.jpg",      "vo2.mp3", "right",   "E-rickshaw wala DJ - dhamakedar!"),
    ("15_E10_auto_dj.jpg",          "vo3.mp3", "left",    "Auto rickshaw me mini DJ!"),
    ("01_hero_truck.jpg",           "vo4.mp3", "in",      "Pickup, truck, auto, ricksha..."),
    ("06_scriptE_truck_lineup.jpg", "vo5.mp3", "right",   "Sabse zyada demand: DJ Truck!"),
    ("02_monkey_dj.jpg",            "vo6.mp3", "in",      "Monkey bhai bole: sab bajao!"),
    ("03_logo_reveal.jpg",          "vo7.mp3", "in_slow", "Comment karo: agla DJ kis gaadi par?"),
]

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    jobs = []
    if which in ("both", "wide"):
        jobs.append(("wide", "mini-dj-showcase-vehicles-16x9.mp4"))
    if which in ("both", "vertical"):
        jobs.append(("vertical", "mini-dj-showcase-vehicles-9x16.mp4"))
    for layout, name in jobs:
        print(f"\n=== SHOWCASE {layout.upper()} ===")
        concat, starts, durs = B.build_segments(layout)
        B.final_mix(layout, concat, starts, durs, name)
