#!/usr/bin/env python3
"""Generate the pleasant reminder tones that ship in app/src/main/res/raw.

Pure standard library: writes 44.1 kHz / 16-bit mono PCM WAV files.
Re-run with `python3 tools/make_sounds.py` to regenerate.
"""
import math
import os
import struct
import wave

SR = 44100


def env_attack_decay(t, dur, attack=0.008, decay_tau=0.35):
    a = min(1.0, t / attack) if attack > 0 else 1.0
    return a * math.exp(-t / decay_tau)


def bell(t, dur, freq, amp, partials, tau):
    """Additive bell: a few inharmonic partials with independent decay."""
    v = 0.0
    for ratio, gain, tscale in partials:
        v += gain * math.sin(2 * math.pi * freq * ratio * t) * math.exp(-t / (tau * tscale))
    return amp * v * min(1.0, t / 0.004)


def write(name, samples):
    path = os.path.join(os.path.dirname(__file__), "..", "app", "src", "main", "res", "raw", name)
    path = os.path.normpath(path)
    peak = max(abs(s) for s in samples) or 1.0
    gain = 0.82 / peak
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = int(max(-1.0, min(1.0, s * gain)) * 32767)
            frames += struct.pack("<h", v)
        w.writeframes(bytes(frames))
    print("wrote %s (%.1f KB, %.2fs)" % (path, os.path.getsize(path) / 1024.0, len(samples) / SR))


def mix(parts, length):
    out = [0.0] * int(SR * length)
    for offset, buf in parts:
        start = int(offset * SR)
        for i, s in enumerate(buf):
            if start + i < len(out):
                out[start + i] += s
    return out


def tone(freq, dur, amp, tau=0.4, partials=None):
    n = int(SR * dur)
    partials = partials or [(1.0, 1.0, 1.0)]
    return [bell(i / SR, dur, freq, amp, partials, tau) for i in range(n)]


def main():
    # ---------------------------------------------------------------- chime
    # Bright, gentle rising arpeggio (C5 E5 G5 C6) with bell timbre.
    bell_p = [(1.0, 1.0, 1.0), (2.01, 0.42, 0.62), (3.02, 0.22, 0.42), (4.16, 0.12, 0.3)]
    notes = [(523.25, 0.00), (659.25, 0.20), (783.99, 0.40), (1046.50, 0.60)]
    write("chime.wav", mix([(o, tone(f, 2.6, 0.34, 0.75, bell_p)) for f, o in notes], 3.6))

    # ----------------------------------------------------------------- bell
    # Two soft strikes of a warm bell (A4 + E5 partials).
    soft_p = [(1.0, 1.0, 1.0), (2.0, 0.5, 0.55), (2.98, 0.24, 0.4), (5.4, 0.08, 0.25)]
    write("bell.wav", mix([
        (0.00, tone(440.00, 2.4, 0.36, 0.62, soft_p)),
        (0.00, tone(660.00, 2.0, 0.16, 0.45, soft_p)),
        (0.85, tone(440.00, 2.4, 0.30, 0.62, soft_p)),
        (0.85, tone(659.25, 2.0, 0.14, 0.45, soft_p)),
    ], 3.4))

    # ------------------------------------------------------------ sunrise pad
    # Slow warm swell: stacked fifths with vibrato-free sine + soft shimmer.
    parts = []
    for f, a in ((261.63, 0.22), (392.00, 0.16), (523.25, 0.13), (783.99, 0.07)):
        n = int(SR * 4.2)
        buf = []
        for i in range(n):
            t = i / SR
            swell = (1.0 - math.exp(-t / 0.9)) * math.exp(-max(0.0, t - 2.6) / 1.1)
            vib = 1.0 + 0.0012 * math.sin(2 * math.pi * 4.6 * t)
            buf.append(a * swell * math.sin(2 * math.pi * f * vib * t))
        parts.append((0.0, buf))
    shimmer = [(1046.5, 0.6), (1318.5, 1.1), (1567.98, 1.7)]
    for f, o in shimmer:
        parts.append((o, tone(f, 1.8, 0.045, 0.55, [(1.0, 1.0, 1.0), (2.0, 0.3, 0.5)])))
    write("sunrise_pad.wav", mix(parts, 4.2))


if __name__ == "__main__":
    main()
