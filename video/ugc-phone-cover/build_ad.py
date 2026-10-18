#!/usr/bin/env python3
"""Build a 10-second 9:16 phone-cover UGC-style ad from the supplied stills/VO.

Requirements: Pillow and imageio-ffmpeg (see requirements.txt).
The cut uses small Ken Burns moves and direct edits; it is an image-based animatic,
not generated live-action footage or lip-synced video.
"""
from __future__ import annotations

import array
import math
import os
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
BUILD = ROOT / "build"
SEGMENTS = BUILD / "segments"
OUTPUT = ROOT / "phone-cover-ugc-ad-10s-vertical.mp4"
WIDTH, HEIGHT, FPS = 1080, 1920, 24
TOTAL_FRAMES = 10 * FPS
SAMPLE_RATE = 24_000

SHOTS = [
    # filename, frame count, zoom amount, overlay
    ("shot-01-hook.jpg", 55, 0.040, "hook"),
    ("shot-02-detail.jpg", 34, 0.040, None),
    ("shot-02b-edge.jpg", 31, 0.035, None),
    ("shot-03a-soft-drop.jpg", 24, 0.025, "demo"),
    ("shot-03b-pickup.jpg", 48, 0.035, "demo"),
    ("shot-04-cta.jpg", 48, 0.035, "cta"),
]

FONT_BOLD_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
]
FONT_REGULAR_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
]


def ffmpeg() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str]) -> None:
    print("$", " ".join(str(x) for x in cmd), flush=True)
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode:
        raise RuntimeError(f"ffmpeg failed ({proc.returncode}):\n{proc.stderr[-4000:]}")


def load_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def centered_text(draw: ImageDraw.ImageDraw, xy_center: tuple[int, int], text: str,
                  font: ImageFont.FreeTypeFont, fill: tuple[int, ...]) -> None:
    x, y = xy_center
    box = draw.textbbox((0, 0), text, font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text((x - w / 2, y - h / 2 - box[1]), text, font=font, fill=fill)


def make_overlay(path: Path, kind: str) -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    bold = load_font(FONT_BOLD_CANDIDATES, 44)

    if kind in {"hook", "demo"}:
        x0, y0, x1, y1 = 58, 1512, 1022, 1744
        draw.rounded_rectangle((x0, y0, x1, y1), radius=34,
                               fill=(13, 23, 19, 176),
                               outline=(255, 255, 255, 60), width=2)
        if kind == "hook":
            lines = ["Mera phone har jagah gir jaata tha,",
                     "jab tak ye nahi aaya!"]
        else:
            lines = ["Aur dekho, grip bhi",
                     "ekdum solid hai."]
        centered_text(draw, (WIDTH // 2, 1588), lines[0], bold, (255, 255, 255, 255))
        centered_text(draw, (WIDTH // 2, 1662), lines[1], bold, (255, 255, 255, 255))

    elif kind == "cta":
        x0, y0, x1, y1 = 68, 1450, 1012, 1778
        draw.rounded_rectangle((x0, y0, x1, y1), radius=40,
                               fill=(248, 249, 238, 245),
                               outline=(48, 82, 61, 250), width=4)
        title = load_font(FONT_BOLD_CANDIDATES, 60)
        price = load_font(FONT_BOLD_CANDIDATES, 38)
        centered_text(draw, (WIDTH // 2, 1530), "Abhi order karo", title,
                      (35, 70, 52, 255))
        draw.rounded_rectangle((220, 1600, 860, 1704), radius=46,
                               fill=(66, 108, 77, 255))
        centered_text(draw, (WIDTH // 2, 1652), "OFFER PRICE  •  ₹299", price,
                      (255, 255, 248, 255))
    else:
        raise ValueError(f"unknown overlay: {kind}")

    image.save(path)


def render_segment(index: int, filename: str, frames: int, zoom: float,
                   overlay_kind: str | None) -> Path:
    source = ROOT / filename
    output = SEGMENTS / f"segment-{index:02d}.mp4"
    if not source.exists():
        raise FileNotFoundError(source)

    # Upscale before the subtle crop/zoom so the 1080x1920 output stays clean.
    # A few pixels of smooth drift retain the handheld selfie feel without jitter.
    zoom_expr = f"'1+{zoom:.4f}*on/{max(frames - 1, 1)}'"
    x_expr = "'(iw-iw/zoom)/2+1.5*sin(on*0.31)'"
    y_expr = "'(ih-ih/zoom)/2+1.5*cos(on*0.27)'"
    pan = (f"scale=1188:2112:flags=lanczos,"
           f"zoompan=z={zoom_expr}:x={x_expr}:y={y_expr}:d={frames}:"
           f"s={WIDTH}x{HEIGHT}:fps={FPS},format=yuv420p")

    cmd = [ffmpeg(), "-y", "-i", str(source)]
    if overlay_kind:
        overlay_path = BUILD / f"overlay-{overlay_kind}.png"
        cmd += ["-loop", "1", "-framerate", str(FPS), "-i", str(overlay_path)]
        filter_graph = (
            f"[0:v]{pan}[base];"
            f"[base][1:v]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]"
        )
        cmd += ["-filter_complex", filter_graph, "-map", "[v]"]
    else:
        cmd += ["-vf", pan]
    cmd += [
        "-frames:v", str(frames), "-an", "-r", str(FPS),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-g", str(FPS * 2), "-bf", "0",
        "-movflags", "+faststart", str(output),
    ]
    run(cmd)
    return output


def read_pcm(path: Path) -> tuple[wave._wave_params, bytes]:
    with wave.open(str(path), "rb") as wav:
        params = wav.getparams()
        return params, wav.readframes(wav.getnframes())


def mix_voiceover() -> Path:
    """Place the three chosen lines against the 10-second visual beat sheet."""
    hook_path = ROOT / "voiceover-hi.wav"  # full take: use its first sentence (natural 2.3s hook)
    demo_path = ROOT / "vo-demo.wav"
    cta_path = ROOT / "vo-cta.wav"
    (params, hook_data) = read_pcm(hook_path)
    demo_params, demo_data = read_pcm(demo_path)
    cta_params, cta_data = read_pcm(cta_path)
    if params.framerate != SAMPLE_RATE or params.sampwidth != 2 or params.nchannels != 1:
        raise ValueError("Expected 24 kHz mono 16-bit voiceover WAVs")
    for candidate in (demo_params, cta_params):
        if (candidate.framerate, candidate.sampwidth, candidate.nchannels) != (
                params.framerate, params.sampwidth, params.nchannels):
            raise ValueError("Voiceover WAV formats do not match")

    samples_total = TOTAL_FRAMES * SAMPLE_RATE // FPS
    mix = array.array("h", [0]) * samples_total

    def place(data: bytes, start_seconds: float, duration_seconds: float | None = None) -> None:
        samples = array.array("h")
        samples.frombytes(data)
        start = round(start_seconds * SAMPLE_RATE)
        count = len(samples) if duration_seconds is None else min(
            len(samples), round(duration_seconds * SAMPLE_RATE))
        end = min(samples_total, start + count)
        for i in range(max(0, end - start)):
            # Soft saturating addition is defensive if a future edit overlaps clips.
            mixed = int(mix[start + i]) + int(samples[i])
            mix[start + i] = max(-32768, min(32767, mixed))

    place(hook_data, 0.0, 2.38)
    place(demo_data, 5.0)
    place(cta_data, 8.24)

    out = BUILD / "voiceover-mix.wav"
    with wave.open(str(out), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(mix.tobytes())
    return out


def main() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)
    SEGMENTS.mkdir(parents=True, exist_ok=True)
    for kind in ("hook", "demo", "cta"):
        make_overlay(BUILD / f"overlay-{kind}.png", kind)

    segment_paths: list[Path] = []
    for i, (filename, frames, zoom, overlay) in enumerate(SHOTS, start=1):
        segment_paths.append(render_segment(i, filename, frames, zoom, overlay))

    concat_list = BUILD / "concat.txt"
    concat_list.write_text("".join(f"file '{p.as_posix()}'\n" for p in segment_paths),
                           encoding="utf-8")
    silent_video = BUILD / "video-silent.mp4"
    run([
        ffmpeg(), "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-map", "0:v:0", "-an", "-r", str(FPS), "-t", "10",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(silent_video),
    ])

    audio = mix_voiceover()
    run([
        ffmpeg(), "-y", "-i", str(silent_video), "-i", str(audio),
        "-map", "0:v:0", "-map", "1:a:0", "-t", "10",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2",
        "-af", "afade=t=in:st=0:d=0.03,afade=t=out:st=9.75:d=0.25,loudnorm=I=-16:TP=-1.5:LRA=11",
        "-movflags", "+faststart", str(OUTPUT),
    ])
    print(f"\nDone: {OUTPUT}")


if __name__ == "__main__":
    main()
