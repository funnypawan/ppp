#!/usr/bin/env python3
"""
Generates the launcher icons and splash artwork for the Android build.

Everything is drawn from scratch with a tiny pure-python PNG writer so the
repository stays free of opaque binary asset drops and the artwork can be
regenerated at any size.

Usage:  python3 tools/make_icons.py
"""

import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

BG_TOP = (18, 32, 40)
BG_BOTTOM = (8, 16, 20)
BUS_BODY = (224, 84, 58)
BUS_BODY_DARK = (176, 60, 40)
BUS_TRIM = (250, 244, 230)
GLASS = (120, 190, 214)
WHEEL = (26, 28, 30)
LAMP = (255, 226, 150)
GREEN = (67, 209, 122)


def write_png(path, width, height, pixels):
    """pixels: list of rows, each row a list of (r, g, b, a) tuples."""
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filter type 0
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", header)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(png)


def blend(dst, src, alpha):
    return tuple(int(dst[i] * (1 - alpha) + src[i] * alpha) for i in range(3))


def rounded_rect_alpha(x, y, w, h, radius, px, py):
    """Signed coverage test for a rounded rectangle."""
    cx = min(max(px, x + radius), x + w - radius)
    cy = min(max(py, y + radius), y + h - radius)
    dx = px - cx
    dy = py - cy
    return math.hypot(dx, dy) <= radius


def draw_icon(size, foreground=False):
    """Draw the bus icon at the requested size."""
    pixels = []
    scale = size / 108.0  # adaptive icon canvas is 108dp
    for py in range(size):
        row = []
        for px in range(size):
            x = px / scale
            y = py / scale
            if foreground:
                color = (0, 0, 0)
                alpha = 0
            else:
                t = y / max(1.0, size / scale)
                color = (
                    int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t),
                    int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t),
                    int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t),
                )
                alpha = 255
                # subtle road stripe
                if 88 < y < 96 and abs(x - 54) % 16 < 8:
                    color = blend(color, GREEN, 0.22)

            # Bus body
            if rounded_rect_alpha(18, 26, 72, 50, 10, x, y):
                color = BUS_BODY
                alpha = 255
            # Lower skirt
            if rounded_rect_alpha(18, 62, 72, 14, 6, x, y):
                color = BUS_BODY_DARK
                alpha = 255
            # Windscreen
            if rounded_rect_alpha(62, 33, 24, 22, 5, x, y):
                color = GLASS
                alpha = 255
            # Side windows
            if rounded_rect_alpha(24, 33, 34, 20, 4, x, y):
                color = GLASS
                alpha = 255
            # Window divider
            if 40 < x < 43 and 33 < y < 53:
                color = BUS_TRIM
            # Roof band
            if 26 < y < 31 and 18 < x < 90:
                color = BUS_TRIM
            # Headlight
            if 82 < x < 89 and 56 < y < 62:
                color = LAMP
            # Wheels
            if (math.hypot(x - 34, y - 78) < 9) or (math.hypot(x - 74, y - 78) < 9):
                color = WHEEL
            if (math.hypot(x - 34, y - 78) < 4) or (math.hypot(x - 74, y - 78) < 4):
                color = (210, 214, 220)
            row.append((color[0], color[1], color[2], alpha))
        pixels.append(row)
    return pixels


def draw_splash(width, height):
    pixels = []
    for py in range(height):
        row = []
        t = py / max(1, height)
        base = (
            int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t),
            int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t),
            int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t),
        )
        for px in range(width):
            color = base
            # Road band with dashes.
            if py > height * 0.78:
                color = blend(color, (40, 60, 50), 0.6)
                if (px // max(1, int(width * 0.06))) % 2 == 0:
                    color = blend(color, GREEN, 0.5)
            row.append((color[0], color[1], color[2], 255))
        pixels.append(row)
    return pixels


def main():
    densities = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    for name, size in densities.items():
        folder = os.path.join(RES, "mipmap-" + name)
        icon = draw_icon(size)
        write_png(os.path.join(folder, "ic_launcher.png"), size, size, icon)
        # Round variant: clip to a circle.
        round_pixels = []
        r = size / 2.0
        for py in range(size):
            row = []
            for px in range(size):
                d = math.hypot(px - r + 0.5, py - r + 0.5)
                if d > r:
                    row.append((0, 0, 0, 0))
                else:
                    row.append(icon[py][px])
            round_pixels.append(row)
        write_png(os.path.join(folder, "ic_launcher_round.png"), size, size, round_pixels)
        # Adaptive foreground (108dp canvas with the bus in the safe zone).
        fg_size = int(size * 108 / 48)
        fg = draw_icon(fg_size, foreground=True)
        write_png(os.path.join(folder, "ic_launcher_foreground.png"), fg_size, fg_size, fg)

    # Splash artwork (drawn at a modest resolution, scaled by Android).
    splash = draw_splash(720, 1280)
    write_png(os.path.join(RES, "drawable-nodpi", "splash_logo.png"), 360, 640, draw_splash(360, 640))
    print("icons + splash written to", RES)


if __name__ == "__main__":
    main()
