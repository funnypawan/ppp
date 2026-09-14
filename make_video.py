#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atomic Habits video builder:
- Script ko paragraphs me tod kar timestamps nikalta hai
- Har paragraph ko matching images se map karta hai (scene-by-scene)
- Ken Burns effect ke saath final video + audio banata hai
"""
import os, subprocess, sys, shutil

import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

BASE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(BASE, "images")
AUDIO = os.path.join(BASE, "audio", "full_script_clean.mp3")
SEGDIR = os.path.join(BASE, "video_segments")
OUT = os.path.join(BASE, "final_video.mp4")

FPS = 30
W, H = 1920, 1080

# ---- part durations (seconds), from MP3 frame parse ----
PART_DURS = [47.65, 38.26, 38.06, 38.49]

# ---- read script, split paragraphs ----
with open(os.path.join(BASE, "script.txt"), encoding="utf-8") as f:
    text = f.read()
paras = [p.strip() for p in text.split("\n\n") if p.strip()]

# ---- reassemble chunks (same greedy packing used for TTS) ----
chunks = []
cur = ""
for p in paras:
    sep = "\n\n" if cur else ""
    if len(cur) + len(sep) + len(p) <= 1450:
        cur += sep + p
    else:
        chunks.append(cur)
        cur = p
if cur:
    chunks.append(cur)

# ---- per-paragraph timestamps ----
para_meta = []  # (start, end, text)
cum = 0.0
for ci, chunk in enumerate(chunks):
    dur = PART_DURS[ci]
    cparas = [p.strip() for p in chunk.split("\n\n") if p.strip()]
    total_chars = sum(len(p) for p in cparas)
    t = cum
    for p in cparas:
        pdur = dur * len(p) / total_chars
        para_meta.append((t, t + pdur, p))
        t += pdur
    cum += dur

print(f"Paragraphs: {len(para_meta)}, total audio: {cum:.2f}s")

# ---- IMAGE PLAN: per paragraph -> ordered list of images ----
IMAGE_PLAN = [
    ["s01_calendar_flashback.jpg", "s02_determined_promise.jpg"],
    ["s03_gym_signup.jpg", "s04_5am_alarm.jpg", "s05_phone_down.jpg"],
    ["s06_two_weeks_calendar.jpg", "s07_old_routine_lazy.jpg"],
    ["s08_frustrated_self.jpg", "s10_weak_willpower.jpg"],
    ["s11_truth_spotlight.jpg"],
    ["scene04_system_gears.jpg"],
    ["s13_ice_solid.jpg", "s14_ice_minus1.jpg"],
    ["s15_ice_melt_splash.jpg"],
    ["s16_question.jpg", "s17_one_percent_step.jpg"],
    ["scene09_compounding_graph.jpg"],
    ["s18_atomic_book.jpg"],
    ["s19_brain_hologram.jpg", "s20_goal_trap.jpg", "s21_4step_system.jpg"],
    ["s11_identity_mirror.jpg", "s23_chapter_title.jpg"],
    ["s24_kal_se_shuru.jpg"],
    ["s27_motivation_wave.jpg"],
    ["s28_businessman_system.jpg"],
    ["s29_eye_target.jpg", "s30_whiteboard_goals.jpg"],
    ["s31_identical_arrows.jpg"],
    ["s32_olympics_win_lose.jpg", "s33_interview.jpg"],
    ["s34_compass.jpg", "s35_routine_loop.jpg"],
    ["s36_quote_card.jpg"],
    ["s37_falling_levels.jpg"],
    ["s39_tour_de_france.jpg"],
    ["s38_2003_union_jack.jpg", "s40_empty_medal_wall.jpg", "s41_brand_rejection.jpg"],
    ["s42_dave_brailsford.jpg", "s43_marginal_gains_ladder.jpg"],
    ["s44_saddle.jpg", "s45_tire_tread.jpg", "s46_handlebar_paint.jpg", "s47_bedsheets.jpg", "s48_hand_gel.jpg"],
    ["s49_doubt_one_percent.jpg"],
    ["s50_compounding_beam.jpg"],
    ["s51_british_podium.jpg", "s52_trophy_table.jpg"],
    ["s53_atomic_particles.jpg"],
    ["s54_growth_graph.jpg", "s55_decline_graph.jpg"],
    ["s56_two_paths.jpg", "s57_direction_arrows.jpg"],
    ["s58_dark_staircase.jpg", "s59_scale_account.jpg", "s60_demoralized.jpg"],
    ["s61_flat_line.jpg", "s62_valley_disappointment.jpg"],
    ["s63_ice_callback.jpg", "s64_invisible_energy.jpg", "scene10_plateau_breakthrough.jpg"],
    ["s67_silent_lake.jpg", "s68_routine_planner.jpg"],
    ["s69_final_gears.jpg"],
    ["s70_identity_building.jpg", "s71_autopilot_cycling.jpg", "s72_habit_chain.jpg"],
    ["s73_ending_question.jpg", "s74_end_screen.jpg"],
]

assert len(IMAGE_PLAN) == len(para_meta), f"plan {len(IMAGE_PLAN)} != paras {len(para_meta)}"

# ---- build segments ----
segments = []  # (start, end, image_path, zoom_in)
for (st, en, txt), imgs in zip(para_meta, IMAGE_PLAN):
    n = len(imgs)
    span = en - st
    for i, img in enumerate(imgs):
        s = st + span * i / n
        e = st + span * (i + 1) / n
        segments.append((s, e, img, (i % 2 == 0)))  # alternate zoom in/out

print(f"Total segments: {len(segments)}")

# ---- build each segment video ----
os.makedirs(SEGDIR, exist_ok=True)
shutil.rmtree(SEGDIR)
os.makedirs(SEGDIR, exist_ok=True)

def make_segment(idx, img, dur, zoom_in):
    src = os.path.join(IMG, img)
    if not os.path.exists(src):
        print(f"  !! missing {img}, skipping")
        return None
    frames = max(1, int(round(dur * FPS)))
    if zoom_in:
        zexpr = "min(1.0+0.0016*on,1.3)"
    else:
        zexpr = "max(1.3-0.0016*on,1.0)"
    out = os.path.join(SEGDIR, f"seg_{idx:04d}.mp4")
    vf = (
        f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase,"
        f"crop={W*2}:{H*2},"
        f"zoompan=z='{zexpr}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}"
    )
    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-i", src,
        "-vf", vf,
        "-frames:v", str(frames),
        "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        out,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  !! ffmpeg error on {img}:\n{r.stderr[-800:]}")
        return None
    return out

seg_files = []
for idx, (s, e, img, zi) in enumerate(segments):
    dur = e - s
    if dur <= 0.02:
        continue
    f = make_segment(idx, img, dur, zi)
    if f:
        seg_files.append(f)
    if (idx + 1) % 10 == 0:
        print(f"  segment {idx+1}/{len(segments)} done")

print(f"Built {len(seg_files)} segment clips")

# ---- concat ----
listfile = os.path.join(SEGDIR, "concat.txt")
with open(listfile, "w") as f:
    for sf in seg_files:
        f.write(f"file '{os.path.abspath(sf)}'\n")

silent = os.path.join(BASE, "video_silent.mp4")
r = subprocess.run([
    FFMPEG, "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", listfile,
    "-c", "copy", silent,
], capture_output=True, text=True)
print("concat rc:", r.returncode, r.stderr[-500:] if r.returncode else "")

# ---- mux audio ----
r = subprocess.run([
    FFMPEG, "-y", "-loglevel", "error",
    "-i", silent,
    "-i", AUDIO,
    "-map", "0:v", "-map", "1:a",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    OUT,
], capture_output=True, text=True)
print("mux rc:", r.returncode, r.stderr[-500:] if r.returncode else "")
print("FINAL:", OUT, os.path.exists(OUT) and f"{os.path.getsize(OUT)/1e6:.1f} MB")
