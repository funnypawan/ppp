#!/usr/bin/env python3
"""
BASS-HEAVY version of the Mini DJ track — 145 BPM, sidechain-ducked bass, deep sub.
Alag buffers: drums vs tonal -> kick pe bass duck hota hai (asli DJ/EDM feel).
Output: music_bass.wav
"""
import numpy as np, wave, os

SR = 44100
BPM = 145.0
BEAT = 60.0 / BPM
BAR = BEAT * 4
BARS = 8
DUR = BAR * BARS
N = int(DUR * SR)

DRUM_L = np.zeros(N); DRUM_R = np.zeros(N)      # kick/clap/hat
TON_L = np.zeros(N); TON_R = np.zeros(N)        # bass + synth stabs


def add(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    s = sig[: max(0, N - i)]
    L, R = buf
    L[i:i + len(s)] += s * gain * (1 - max(pan, 0))
    R[i:i + len(s)] += s * gain * (1 + min(pan, 0))


def env(t, a=0.005, d=0.2):
    return np.where(t < a, t / a, np.exp(-(t - a) / d))


def kick():
    t = np.arange(int(0.55 * SR)) / SR
    f = 150 * np.exp(-t * 20) + 38
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 6.5) * 1.15 + np.random.randn(len(t)) * np.exp(-t * 300) * 0.3


def clap():
    t = np.arange(int(0.25 * SR)) / SR
    return (np.random.randn(len(t)) * np.exp(-(t % 0.02) * 200) * np.exp(-t * 22)) * 0.5


def hat(short=True):
    d = 0.06 if short else 0.13
    t = np.arange(int(d * SR)) / SR
    hp = np.diff(np.concatenate([[0], np.random.randn(len(t))]))
    return hp * np.exp(-t * (90 if short else 40)) * 0.2


def sub(f, d, decay=0.35):
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.clip(env(t, 0.004, d * decay), 0, 1) * 1.25


def saw(f, d):
    t = np.arange(int(d * SR)) / SR
    s = 2 * (f * t - np.floor(0.5 + f * t))
    return s * np.clip(env(t, 0.008, d * 0.45), 0, 1) * 0.42


PROG = [("A", 55.00, [220.0, 261.6, 329.6]),
        ("F", 43.65, [174.6, 220.0, 261.6]),
        ("C", 65.41, [261.6, 329.6, 392.0]),
        ("G", 49.00, [196.0, 246.9, 392.0])]

K, CL, H, H2 = kick(), clap(), hat(True), hat(False)

for bar in range(BARS):
    t0 = bar * BAR
    _, root, chord = PROG[bar % 4]
    full = bar >= 2

    # ---- drums ----
    for b in range(4):
        add((DRUM_L, DRUM_R), K, t0 + b * BEAT, 1.0)
    if full:
        add((DRUM_L, DRUM_R), CL, t0 + 1 * BEAT, 0.85)
        add((DRUM_L, DRUM_R), CL, t0 + 3 * BEAT, 0.85)
        for e8 in range(8):
            add((DRUM_L, DRUM_R), H if e8 % 2 == 0 else H2,
                t0 + e8 * BEAT / 2, 0.9, 0.15 * ((-1) ** e8))

    # ---- bass: ek octave neeche + lambi notes = heavy ----
    pattern = [2.0, 0, 1.0, 1.0, 0, 1.5, 0, 1.0]      # (octave multiplier per 8th)
    for i, mul in enumerate(pattern):
        if mul == 0:
            continue
        add((TON_L, TON_R), sub(root * 0.5 * (2 if i % 4 == 0 else 1), BEAT * 0.62, 0.40),
            t0 + i * BEAT / 2, 0.62)

    # ---- off-beat synth stabs ----
    if bar >= 4:
        for nb in [0.5, 1.75, 2.5, 3.25]:
            for f in chord[:2]:
                add((TON_L, TON_R), saw(f * 2, BEAT * 0.28), t0 + nb * BEAT, 0.13,
                    0.25 * np.sign(f - 300))

# ---- sidechain ducking: kick ke waqt tonal part dab jaata hai ----
duck = np.ones(N)
for bar in range(BARS):
    for b in range(4):
        tb = (bar * BAR + b * BEAT)
        i0 = int(tb * SR); i1 = min(N, i0 + int(0.30 * SR))
        if i0 < N:
            x = np.arange(i1 - i0) / SR
            duck[i0:i1] = np.minimum(duck[i0:i1], 1 - 0.62 * np.exp(-x / 0.085))
TON_L *= duck; TON_R *= duck

L = DRUM_L * 0.9 + TON_L
R = DRUM_R * 0.9 + TON_R

# ---- bass boost: low-pass (one-pole @ ~110 Hz) wapas add karo ----
def lowpass(x, fc=110.0):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):            # slow but one-time
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y

mix = np.stack([L, R])
mix += 0.55 * np.stack([lowpass(L), lowpass(R)])
mix = np.tanh(mix * 0.85)               # glue + soft saturation
mix = mix / np.max(np.abs(mix)) * 0.92
f = int(0.03 * SR)
mix[:, :f] *= np.linspace(0, 1, f)
mix[:, -f:] *= np.linspace(1, 0, f)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music_bass.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print(f"✅ {out}  {DUR:.2f}s  bass-heavy (ducked)")
