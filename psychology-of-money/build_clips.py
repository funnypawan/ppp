"""Rebuild per-clip spoken-text files + voiceover.txt from script-final.md.

Clip 01-10 are RECORDED (clipNN.wav / .mp3) in this exact order.
Clips 11-13 are QUEUED (text ready, audio not generated yet - clip limit per turn).
"""
import os, glob

md = open('script-final.md').read().split('## Appendix A')[0]
lines, blocks, cur = md.split('\n'), [], []
def close():
    global cur
    if cur and ' '.join(cur).strip(): blocks.append(' '.join(cur).strip())
    cur = []
for ln in lines:
    s = ln.strip()
    if s.startswith('[VO]'):
        close(); r = s[4:].strip()
        if r: cur = [r]
    elif cur is not None:
        if s.startswith('[') or s.startswith('#') or s.startswith('---') or s.startswith('**'): close()
        elif s: cur.append(s)
close()
B = [' '.join(b.split()) for b in blocks if b.strip() and not b.startswith('> Marking')]

# [VO] block index -> clip number. Block 14 is left unvoiced (on-screen text beat).
MAP = {
 1: [1, 2, 3, 4, 5, 6],          # hook + intro
 2: [7, 8, 9, 10],               # lesson 1
 3: [11, 12],                    # lesson 2 (Gates / Kent Evans)
 4: [13, 15, 16, 17],            # lesson 2 tail + lesson 3 (Heller)
 5: [18, 19, 20, 21, 22],        # Gupta + Buffett + SIP maths
 6: [23, 24],                    # lesson 4 tail
 7: [25, 26, 27, 28],            # lesson 5
 8: [29, 30, 31, 32, 33],        # lesson 6
 9: [34, 35, 36, 37],            # lesson 7
 10: [38, 39, 40, 41, 42],       # lesson 7 tail + lesson 8
 11: [43, 44, 45],               # recap + the one thing  (QUEUED)
 12: [46, 47],                   # CTA + sign-off          (QUEUED)
}
RECORDED = set(range(1, 11))
for f in glob.glob('clip*.txt'): os.remove(f)
rows = []
for n in sorted(MAP):
    txt = '\n'.join(B[i - 1] for i in MAP[n])
    open('clip%02d.txt' % n, 'w').write(txt + '\n')
    rows.append((n, len(txt), 'recorded' if n in RECORDED else 'QUEUED'))
head = ("# The Psychology of Money — spoken text, per voiceover clip\n"
        "Regenerate with `python3 build_clips.py`. Blocks: %d, total spoken chars: %d.\n"
        "Clips 1–10 are recorded (clipNN.wav / clipNN.mp3, joined in voiceover-full-part1.mp3 = 11m43s).\n"
        "Clips 11–12 are queued for the next generation batch. Block 14 (‘पर असली line यह है…’) is\n"
        "deliberately unvoiced — play it as an on-screen text card over B-roll instead.\n\n" % (len(B), sum(len(x) for x in B)))
body = []
for n, ln, st in rows:
    body.append('## CLIP %02d — %d chars (%s)\n\n%s' % (n, ln, st, open('clip%02d.txt' % n).read().strip()))
open('voiceover.txt', 'w').write(head + '\n\n'.join(body) + '\n')
for n, ln, st in rows: print('clip%02d' % n, ln, st)

# SRT for the editor, timed off the recorded wavs
import wave
def fmt(t):
    m, s = divmod(t, 60); h, m = divmod(int(m), 60)
    return "%02d:%02d:%02d,%03d" % (h, m, int(s), int(round((s % 1) * 1000)))
t, cues = 0.0, []
for n in sorted(RECORDED):
    w = wave.open('clip%02d.wav' % n); d = w.getnframes() / w.getframerate()
    part = ' '.join(x for x in open('clip%02d.txt' % n).read().split('\n') if x.strip())
    lines_ = [x for x in part.split('\n') if x.strip()]
    for part_txt in lines_:
        segs, buf = [], ''
        for word in part_txt.split(' '):
            buf = (buf + ' ' + word).strip()
            if len(buf) > 105: segs.append(buf); buf = ''
        if buf: segs.append(buf)
        for sg in segs:
            dd = d * len(sg) / sum(len(x) for x in segs)
            cues.append("%d\n%s --> %s\n%s\n" % (len(cues) + 1, fmt(t), fmt(t + dd), sg)); t += dd
open('voiceover.srt', 'w').write('\n'.join(cues))
print('srt cues', len(cues), 'ends at', fmt(t))
