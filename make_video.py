import subprocess, os

FF = subprocess.check_output(["python3","-c","import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).decode().strip()

IMG = "/home/user/ppp/images"
AUD = "/home/user/ppp/audio"
OUT = "/home/user/ppp/video"
os.makedirs(OUT, exist_ok=True)

FPS = 25
W, H = 1080, 1920
SW, SH = 2160, 3840

def dur(afile):
    r = subprocess.run([FF,"-i",afile], capture_output=True, text=True)
    out = (r.stdout or "") + (r.stderr or "")
    for line in out.splitlines():
        if "Duration:" in line:
            t = line.split("Duration:")[1].split(",")[0].strip()
            h,m,s = t.split(":")
            return int(h)*3600 + int(m)*60 + float(s)
    return 0.0

def make_clip(img, audio, outfile, motion="in", zoom_amt=0.25):
    d = dur(audio)
    frames = max(1, round(d * FPS))
    if motion == "in":
        z = f"1+({zoom_amt}/{frames})*on"
    elif motion == "out":
        z = f"{1+zoom_amt}-({zoom_amt}/{frames})*on"
    else:
        z = "1.1"
    x = "iw/2-(iw/zoom/2)"
    y = "ih/2-(ih/zoom/2)"
    vf = (f"[0:v]scale={SW}:{SH}:force_original_aspect_ratio=increase,"
          f"crop={SW}:{SH},"
          f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s={W}x{H}:fps={FPS}[v]")
    cmd = [FF, "-y", "-loop","1","-framerate",str(FPS), "-i", img, "-i", audio,
           "-filter_complex", vf,
           "-map","[v]","-map","1:a",
           "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
           "-c:a","aac","-b:a","192k","-ar","44100",
           "-t", f"{d:.3f}", "-r", str(FPS),
           "-movflags","+faststart", outfile]
    subprocess.run(cmd, check=True, capture_output=True)
    return outfile

# Scenes mapped EXACTLY to the script order
scenes = [
    (f"{IMG}/scene1_hook.png",         f"{AUD}/scene1_hook.mp3",       "c1", "in",  0.25),  # Hook
    (f"{IMG}/scene2_compass.png",      f"{AUD}/scene2_compass.mp3",    "c2", "out", 0.25),  # Mann kaise kaam karta hai
    (f"{IMG}/scene3_storm.png",        f"{AUD}/scene3_storm.mp3",      "c3", "in",  0.20),  # Tufaan udaharan
    (f"{IMG}/scene4_step1_think.png",  f"{AUD}/step1_soch.mp3",        "c4", "in",  0.20),  # Kadam 1 - Soch
    (f"{IMG}/scene4_step2_words.png",  f"{AUD}/step2_shabd.mp3",       "c5", "in",  0.20),  # Kadam 2 - Shabd
    (f"{IMG}/scene4_step3_action.png", f"{AUD}/step3_karm.mp3",        "c6", "in",  0.20),  # Kadam 3 - Karm
    (f"{IMG}/scene5_balance.png",      f"{AUD}/scene5_balance.mp3",    "c7", "in",  0.15),  # Savdhani
    (f"{IMG}/scene6_seed_tree.png",    f"{AUD}/scene6_conclusion.mp3", "c8", "out", 0.30),  # Nishkarsh
]

clip_files = []
for img, aud, name, motion, zamt in scenes:
    of = f"{OUT}/{name}.mp4"
    print(f"Rendering {name} ({motion}, zoom {zamt})...")
    make_clip(img, aud, of, motion, zamt)
    clip_files.append(of)
    print(f"  -> {of}")

listfile = f"{OUT}/list.txt"
with open(listfile,"w") as f:
    for c in clip_files:
        f.write(f"file '{c}'\n")

final = "/home/user/ppp/video/final_video.mp4"
subprocess.run([FF,"-y","-f","concat","-safe","0","-i",listfile,
                "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
                "-c:a","aac","-b:a","192k","-movflags","+faststart", final],
               check=True, capture_output=True)
print("DONE:", final)
