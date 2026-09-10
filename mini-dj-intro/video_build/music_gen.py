#!/usr/bin/env python3
"""Mini DJ intro ke liye 145 BPM desi-DJ style background music (copyright-free, code se bana)."""
import numpy as np, wave, os

SR = 44100
BPM = 145.0
BEAT = 60.0 / BPM            # 0.4138 s
BAR = BEAT * 4
BARS = 8          # tight loop, ffmpeg se repeat karenge
DUR = BAR * BARS             # ~30.6 s
N = int(DUR * SR)
L = np.zeros(N); R = np.zeros(N)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    s = sig[: max(0, N - i)]
    lg, rg = gain * (1 - max(pan, 0)), gain * (1 + min(pan, 0))
    L[i:i + len(s)] += s * lg
    R[i:i + len(s)] += s * rg


def env(t, a=0.005, d=0.2):
    return np.where(t < a, t / a, np.exp(-(t - a) / d))


def kick():
    t = np.arange(int(0.4 * SR)) / SR
    f = 130 * np.exp(-t * 22) + 44
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 9)
    click = np.random.randn(len(t)) * np.exp(-t * 320) * 0.35
    return body * 1.0 + click


def clap():
    t = np.arange(int(0.25 * SR)) / SR
    n = np.random.randn(len(t))
    # 3 short bursts = clap feel
    e = (np.exp(-(t % 0.02) * 200) * np.exp(-t * 22))
    return n * e * 0.5


def hat(short=True):
    d = 0.06 if short else 0.13
    t = np.arange(int(d * SR)) / SR
    n = np.random.randn(len(t))
    # crude high-pass: difference
    hp = np.diff(np.concatenate([[0], n]))
    return hp * np.exp(-t * (90 if short else 40)) * 0.22


def saw(f, d, cutoff=2600):
    t = np.arange(int(d * SR)) / SR
    s = 2 * (f * t - np.floor(0.5 + f * t))
    e = np.clip(env(t, 0.008, d * 0.45), 0, 1)
    return s * e * 0.5


def sub(f, d):
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.clip(env(t, 0.006, d * 0.4), 0, 1) * 0.9


def riser(d):
    t = np.arange(int(d * SR)) / SR
    n = np.random.randn(len(t))
    sweep = np.sin(2 * np.pi * (200 + 1400 * (t / d) ** 2) * t)
    return (n * 0.35 + sweep * 0.5) * (t / d) ** 1.6 * 0.55


# chord progression (Am - F - C - G) as roots for bass + stabs
PROG = [("A", 55.00, [220.0, 261.6, 329.6]),
        ("F", 43.65, [174.6, 220.0, 261.6]),
        ("C", 65.41, [261.6, 329.6, 392.0]),
        ("G", 49.00, [196.0, 246.9, 392.0])]

K = kick(); C_ = clap(); H = hat(True); H2 = hat(False)

for bar in range(BARS):
    t0 = bar * BAR
    name, root, chord = PROG[bar % 4]
    full = bar >= 2                     # pehle 2 bar sirf kick + bass (build)
    energy = 1.0 if bar < BARS - 2 else 1.0

    # drums
    for b in range(4):
        add(K, t0 + b * BEAT, 1.0 * energy, 0.0)
    if full:
        add(C_, t0 + 1 * BEAT, 0.85, 0.0)
        add(C_, t0 + 3 * BEAT, 0.85, 0.0)
        for e8 in range(8):
            add(H if e8 % 2 == 0 else H2, t0 + e8 * BEAT / 2, 0.9, 0.15 * ((-1) ** e8))

    # bass: 8th note groove, root with octave jumps
    pattern = [1, 0, 1, 1, 0, 1, 0, 1.5]
    for i, mul in enumerate(pattern):
        if i % 2 == 0 or full:
            add(sub(root * (1 if i % 4 else 2), BEAT * 0.42), t0 + i * BEAT / 2, 0.55 * mul)

    # synth stabs on off-beats (energy)
    if bar >= 4:
        for nb in [0.5, 1.75, 2.5, 3.25]:
            for f in chord[:2]:
                add(saw(f * 2, BEAT * 0.3), t0 + nb * BEAT, 0.16, 0.25 * np.sign(f - 300))
    # (riser alag SFX se aata hai, isliye yahan nahi)

# simple master: soft clip + fades
mix = np.stack([L, R])
mix = np.tanh(mix * 0.8)
peak = np.max(np.abs(mix))
mix = mix / peak * 0.85
fade = int(0.03 * SR)
mix[:, :fade] *= np.linspace(0, 1, fade)
mix[:, -fade:] *= np.linspace(1, 0, fade)   # loop-friendly

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "music.wav")
data = (mix.T * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(data.tobytes())
print(f"✅ {out}  {DUR:.2f}s  peak={peak:.2f}")
