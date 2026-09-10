#!/usr/bin/env python3
"""Main intro ka BASS-HEAVY music version (wide 16:9). Shot timings same rehte hain."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_v2 as B

BASE = "/home/user/ppp/mini-dj-intro"
B.MUSIC = f"{BASE}/video_build/music_bass.wav"
B.MUSIC_VOL_DIALOG, B.MUSIC_VOL_LOGO = 0.062, 0.135

if __name__ == "__main__":
    concat, starts, durs = B.build_segments("wide")
    B.final_mix("wide", concat, starts, durs, "mini-dj-intro-hindi-voice-bass-16x9.mp4")
