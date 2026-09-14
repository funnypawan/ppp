#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v4: correct 6min20s build with crossfade transitions + Ken Burns.
Stages: render -> batches -> merge
"""
import os, subprocess, glob, sys, shutil

import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

BASE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(BASE, "images")
SEGDIR = os.path.join(BASE, "video_segments")
BATCHDIR = os.path.join(BASE, "video_batches")
TRANS_OUT = os.path.join(BASE, "video_transitions.mp4")

FPS = 30
W, H = 1920, 1080
TD = 0.35
BATCH = 9

# ---- correct durations (ffprobe) ----
PART_DURS = [110.38, 88.34, 92.45, 89.38]

def parse_plan():
    with open(os.path.join(BASE, "script.txt"), encoding="utf-8") as f:
        text = f.read()
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks, cur = [], ""
    for p in paras:
        sep = "\n\n" if cur else ""
        if len(cur) + len(sep) + len(p) <= 1450:
            cur += sep + p
        else:
            chunks.append(cur); cur = p
    if cur:
        chunks.append(cur)
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
        ["scene09_compounding_graph.jpg", "s17_one_percent_step.jpg"],
        ["s18_atomic_book.jpg"],
        ["s19_brain_hologram.jpg", "s20_goal_trap.jpg", "s21_4step_system.jpg"],
        ["s11_identity_mirror.jpg", "s23_chapter_title.jpg"],
        ["s24_kal_se_shuru.jpg", "s25_checklist_tomorrows.jpg", "s26_tomorrow_never_comes.jpg"],
        ["s27_motivation_wave.jpg", "scene05_goals_vs_system.jpg"],
        ["s28_businessman_system.jpg"],
        ["s29_eye_target.jpg", "s30_whiteboard_goals.jpg"],
        ["s31_identical_arrows.jpg"],
        ["s32_olympics_win_lose.jpg", "s33_interview.jpg"],
        ["s34_compass.jpg", "s35_routine_loop.jpg", "scene06_olympics.jpg"],
        ["s36_quote_card.jpg"],
        ["s37_falling_levels.jpg"],
        ["s39_tour_de_france.jpg"],
        ["s38_2003_union_jack.jpg", "s40_empty_medal_wall.jpg", "s41_brand_rejection.jpg"],
        ["s42_dave_brailsford.jpg", "s43_marginal_gains_ladder.jpg"],
        ["s44_saddle.jpg", "s45_tire_tread.jpg", "s46_handlebar_paint.jpg", "s47_bedsheets.jpg", "s48_hand_gel.jpg"],
        ["s49_doubt_one_percent.jpg"],
        ["s50_compounding_beam.jpg"],
        ["s51_british_podium.jpg", "s52_trophy_table.jpg"],
        ["s53_atomic_particles.jpg", "s18_atomic_book.jpg"],
        ["s54_growth_graph.jpg", "s55_decline_graph.jpg"],
        ["s56_two_paths.jpg", "s57_direction_arrows.jpg"],
        ["s58_dark_staircase.jpg", "s59_scale_account.jpg", "s60_demoralized.jpg"],
        ["s61_flat_line.jpg", "s62_valley_disappointment.jpg"],
        ["s63_ice_callback.jpg", "s64_invisible_energy.jpg", "scene10_plateau_breakthrough.jpg"],
        ["s67_silent_lake.jpg", "s68_routine_planner.jpg"],
        ["s69_final_gears.jpg", "s17_one_percent_step.jpg"],
        ["s70_identity_building.jpg", "s71_autopilot_cycling.jpg", "s72_habit_chain.jpg"],
        ["s73_ending_question.jpg", "s74_end_screen.jpg"],
    ]
    assert len(IMAGE_PLAN) == len(paras), (len(IMAGE_PLAN), len(paras))
    # per-paragraph timestamps
    para_meta = []
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
    # segments
    segments = []
    for (st, en, txt), imgs in zip(para_meta, IMAGE_PLAN):
        n = len(imgs)
        span = en - st
        for i, img in enumerate(imgs):
            s = st + span * i / n
            e = st + span * (i + 1) / n
            segments.append((s, e, img, (i % 2 == 0)))
    return segments

def probe_dur(path):
    r = subprocess.run([FFMPEG, "-i", path], capture_output=True, text=True)
    for line in r.stderr.split("\n"):
        if "Duration:" in line:
            t = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = t.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0

def xfade_chain(infiles, durations, outpath, extra_final=""):
    n = len(infiles)
    inputs = []
    for f in infiles:
        inputs += ["-i", f]
    labels = [f"[{i}:v]" for i in range(n)]
    prev = labels[0]
    acc = durations[0]
    parts = []
    for k in range(1, n):
        offset = acc - TD
        outl = f"[vx{k}]"
        parts.append(f"{prev}{labels[k]}xfade=transition=fade:duration={TD}:offset={offset:.3f}{outl}")
        prev = outl
        acc = acc + durations[k] - TD
    if extra_final:
        parts.append(f"{prev}{extra_final}[vout]")
    else:
        parts.append(f"{prev}null[vout]")
    fc = ";".join(parts)
    cmd = ([FFMPEG, "-y", "-loglevel", "error"] + inputs +
           ["-filter_complex", fc, "-map", "[vout]",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", outpath])
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode, r.stderr

def render_seg(idx, img, dur, zoom_in):
    src = os.path.join(IMG, img)
    if not os.path.exists(src):
        return None
    frames = max(1, int(round(dur * FPS)))
    zexpr = ("min(1.0+0.0007*on,1.25)" if zoom_in else "max(1.25-0.0007*on,1.0)")
    out = os.path.join(SEGDIR, f"seg_{idx:04d}.mp4")
    vf = (f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase,"
          f"crop={W*2}:{H*2},"
          f"zoompan=z='{zexpr}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")
    r = subprocess.run([
        FFMPEG, "-y", "-loglevel", "error", "-i", src,
        "-vf", vf, "-frames:v", str(frames), "-r", str(FPS),
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21",
        "-pix_fmt", "yuv420p", out,
    ], capture_output=True, text=True)
    return out if r.returncode == 0 else None

def main():
    stage = sys.argv[1] if len(sys.argv) > 1 else "render"
    segments = parse_plan()
    n = len(segments)
    D = [e - s for s, e, _, _ in segments]
    print(f"segments={n}, content_dur={sum(D):.2f}s")

    if stage == "render":
        shutil.rmtree(SEGDIR, ignore_errors=True)
        os.makedirs(SEGDIR, exist_ok=True)
        for i, (s, e, img, zi) in enumerate(segments):
            rd = D[i] + TD if i < n - 1 else D[i]
            render_seg(i, img, rd, zi)
            if (i + 1) % 10 == 0:
                print(f"  rendered {i+1}/{n}")
        print("render done")

    elif stage == "batches":
        shutil.rmtree(BATCHDIR, ignore_errors=True)
        os.makedirs(BATCHDIR, exist_ok=True)
        seg_files = sorted(glob.glob(os.path.join(SEGDIR, "seg_*.mp4")))
        seg_durs = [probe_dur(f) for f in seg_files]
        for b in range(0, (len(seg_files) + BATCH - 1) // BATCH):
            group = seg_files[b * BATCH:(b + 1) * BATCH]
            gd = seg_durs[b * BATCH:(b + 1) * BATCH]
            bout = os.path.join(BATCHDIR, f"batch_{b:02d}.mp4")
            rc, err = xfade_chain(group, gd, bout)
            if rc:
                print(f"batch {b} FAILED rc={rc}\n{err[-1200:]}")
                sys.exit(1)
            print(f"batch {b} ok ({len(group)} clips, {probe_dur(bout):.1f}s)")
        print("batches done")

    elif stage == "merge":
        batch_files = sorted(glob.glob(os.path.join(BATCHDIR, "batch_*.mp4")))
        batch_durs = [probe_dur(x) for x in batch_files]
        total = sum(D)
        extra = (f"fade=t=in:st=0:d=0.5,"
                 f"fade=t=out:st={total-0.6:.2f}:d=0.6,"
                 f"tpad=stop_mode=clone:stop_duration=1.0")
        rc, err = xfade_chain(batch_files, batch_durs, TRANS_OUT, extra_final=extra)
        if rc:
            print(f"merge FAILED rc={rc}\n{err[-1500:]}")
            sys.exit(1)
        print("merge OK:", TRANS_OUT, os.path.getsize(TRANS_OUT) // 1e6, "MB",
              f"dur={probe_dur(TRANS_OUT):.2f}s")

if __name__ == "__main__":
    main()
