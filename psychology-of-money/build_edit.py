"""Build a gap-free edit plan: every audio second has a picture.

Writes work/blocks.json, work/edit.json, work/timeline.tsv
"""
import json, math, os, re, subprocess

FF = subprocess.run(
    ['python3', '-c', 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())'],
    capture_output=True, text=True).stdout.strip()
ROOT = os.path.dirname(os.path.abspath(__file__))
IMG, WORK = os.path.join(ROOT, 'img'), os.path.join(ROOT, 'work')
os.makedirs(WORK, exist_ok=True)


def dur(path):
    r = subprocess.run([FF, '-i', path, '-f', 'null', '-'], capture_output=True, text=True).stderr
    h, m, s, cs = map(int, re.search(r'time=\s*(\d+):(\d+):(\d+)\.(\d+)', r).groups())
    return h * 3600 + m * 60 + s + cs / 100.0


IMGS = {}
for f in sorted(os.listdir(IMG)):
    m = re.match(r'clip(\d\d)-(\d\d)\.jpg', f)
    if m:
        IMGS.setdefault(int(m.group(1)), []).append(os.path.join(IMG, f))

BLOCKS = {}
AUD0, acc = {}, 0.0
for i in sorted(IMGS):
    ls = [l for l in open(os.path.join(ROOT, 'clip%02d.txt' % i), encoding='utf-8').read().strip().split('\n') if l.strip()]
    d = dur(os.path.join(ROOT, 'clip%02d.mp3' % i))
    tot = sum(len(x) for x in ls) or 1
    out, t = [], 0.0
    for n, l in enumerate(ls):
        dd = d * len(l) / tot
        out.append({'i': n + 1, 'text': l, 'start': t, 'dur': dd, 'chars': len(l)})
        t += dd
    BLOCKS[i] = {'audio_dur': d, 'lines': out, 'imgs': IMGS[i]}
    AUD0[i] = acc
    acc += d
AUDIO = acc
json.dump({'aud0': AUD0, 'audio': AUDIO, 'blocks': BLOCKS},
          open(os.path.join(WORK, 'blocks.json'), 'w'), ensure_ascii=False, indent=1)

CARDS = {
    1: dict(title='दो आदमी। एक कहानी।', sub='The Psychology of Money  ·  8 सबक', style='title'),
    2: dict(title='Ronald Read', sub='janitor · petrol pump attendant',
            right='Richard Fuscone', rsub='Harvard MBA · Citigroup vice chairman', style='versus'),
    3: dict(title='अमीर कौन मरा?', sub='', style='question'),
    4: dict(title='$8 million', sub='मार्च 2014  ·  सफ़ाई कर्मचारी की दौलत', style='stat'),
    5: dict(title='"I currently have no income."', sub='Fuscone — bankruptcy court, 2008', style='quote'),
    6: dict(title='पैसे का खेल IQ का नहीं — behaviour का है', sub='Morgan Housel  ·  The Psychology of Money', style='title'),
    7: dict(title='Lesson 1', sub='कोई पागल नहीं है', en="No One's Crazy", style='lesson'),
    8: dict(title='Lesson 2', sub='Luck और Risk — एक ही सिक्के के दो पहलू', en='Luck & Risk', style='lesson'),
    9: dict(title='Pattern देखो, एक hero की story नहीं', sub='survivorship bias', style='stat'),
    10: dict(title='Lesson 3', sub='“काफ़ी” कितना है?', en='Never Enough', style='lesson'),
    11: dict(title='Rajat Gupta', sub='McKinsey CEO  →  $100M  →  जेल', style='stat'),
    12: dict(title='Lesson 4', sub='Compounding का जादू time में है, return में नहीं', en='Confounding Compounding', style='lesson'),
    13: dict(title='₹3 करोड़', sub='25 साल  ·  ₹5,000/माह SIP  ·  12%', style='stat'),
    14: dict(title='₹90 लाख', sub='उसी SIP में 10 साल की देरी', style='stat'),
    15: dict(title='Lesson 5', sub='अमीर बनना vs अमीर बने रहना — दो अलग skills', en='Getting vs Staying Wealthy', style='lesson'),
    16: dict(title='Survival is the strategy.', sub='compounding तभी, जब तक तुम game में हो', style='quote'),
    17: dict(title='Lesson 6', sub='पैसे का असली return = अपने time पर काबू', en='Freedom', style='lesson'),
    18: dict(title='Lesson 7', sub='Wealth वो है जो दिखती नहीं', en="Wealth is what you don't see", style='lesson'),
    19: dict(title='BMW = $0 wealth', sub='जो ख़रीद ली, वो ख़र्च हो चुकी', style='stat'),
    20: dict(title='Lesson 8', sub='ग़लती की गुंजाइश रखो — margin of safety', en='Room for Error', style='lesson'),
    21: dict(title='8 सबक, एक वाक्य', sub='', style='title'),
    22: dict(title='पैसे का खेल behaviour का है।\nऔर behaviour सीखा जा सकता है।', sub='', style='title'),
    23: dict(title='कौन सा lesson सबसे कड़वा लगा?', sub='comment में number लिखो  ·  1 से 8', style='cta'),
}

# (clip, block, card, hold_seconds)
OVERLAYS = [
    (1, 1, 2, 4.6),
    (1, 2, 3, 3.4),
    (1, 3, 4, 3.8),
    (1, 4, 5, 4.2),
    (1, 6, 6, 4.6),
    (2, 1, 7, 3.6),
    (3, 1, 8, 3.6),
    (3, 2, 9, 3.8),
    (4, 2, 10, 3.6),
    (5, 1, 11, 3.8),
    (5, 3, 12, 3.6),
    (6, 1, 13, 3.8),
    (6, 2, 14, 3.8),
    (7, 1, 15, 3.6),
    (7, 4, 16, 4.2),
    (8, 1, 17, 3.6),
    (9, 1, 18, 3.6),
    (9, 3, 19, 3.8),
    (10, 3, 20, 3.6),
    (11, 1, 21, 3.4),
    (11, 3, 22, 4.4),
    (12, 1, 23, 4.6),
]

# lesson bug: (clip, block_start, clip_end, block_end, label)
BUGS = [
    (2, 1, 3, 1, 'LESSON 1  ·  कोई पागल नहीं है'),
    (3, 1, 4, 2, 'LESSON 2  ·  Luck & Risk'),
    (4, 2, 5, 3, 'LESSON 3  ·  Never Enough'),
    (5, 3, 7, 1, 'LESSON 4  ·  Compounding'),
    (7, 1, 8, 1, 'LESSON 5  ·  Survive'),
    (8, 1, 9, 1, 'LESSON 6  ·  Freedom'),
    (9, 1, 10, 3, 'LESSON 7  ·  Unseen wealth'),
    (10, 3, 11, 1, 'LESSON 8  ·  Room for error'),
]


def abs_t(clip, block, frac=0.0):
    line = BLOCKS[clip]['lines'][block - 1]
    return AUD0[clip] + line['start'] + line['dur'] * frac


segments = []
# even spread of every image across the full stem, split so no still holds > MAX
MAX_HOLD, MIN_HOLD = 8.6, 3.8
for clip in sorted(IMGS):
    imgs = IMGS[clip]
    d = BLOCKS[clip]['audio_dur']
    max_hold = 12.5 if clip == 12 else MAX_HOLD
    n = max(len(imgs), int(math.ceil(d / max_hold)))
    n = min(n, max(1, int(d / MIN_HOLD)))
    n = max(n, 1)
    per = d / n
    t0 = AUD0[clip]
    for j in range(n):
        segments.append(dict(
            kind='shot', clip=clip, file=imgs[j % len(imgs)],
            start=round(t0 + j * per, 3), end=round(t0 + (j + 1) * per, 3),
            dur=round(per, 3), pan=j % 4, dir=1 if j % 2 == 0 else -1,
            fx='slide' if (clip == 1 and j == 0) else 'kb'))

overlays = []
# opening title skipped — versus card is the hook
for clip, block, card, hold in OVERLAYS:
    st = abs_t(clip, block, 0.08)
    overlays.append(dict(kind='overlay', clip=clip, card=card, start=round(st, 3),
                         end=round(st + hold, 3), dur=hold, **CARDS[card]))

bugs = []
for c0, b0, c1, b1, label in BUGS:
    st = abs_t(c0, b0, 0.0) + 3.4   # after the lesson plate
    en = abs_t(c1, b1, 0.0) - 0.4
    if en > st + 2:
        bugs.append(dict(kind='bug', start=round(st, 3), end=round(en, 3), label=label))

segments.sort(key=lambda s: s['start'])
shots = [s for s in segments if s['kind'] == 'shot']
gaps = [(a['end'], b['start'], b['start'] - a['end'])
        for a, b in zip(shots, shots[1:]) if abs(b['start'] - a['end']) > 0.04]
used = {s['file'] for s in shots}
unused = [os.path.basename(f) for i in sorted(IMGS) for f in IMGS[i] if f not in used]

overlays.sort(key=lambda o: o['start'])
for a, b in zip(overlays, overlays[1:]):
    if b['start'] < a['end'] - 0.05:
        a['end'] = round(b['start'] - 0.12, 3)
        a['dur'] = round(a['end'] - a['start'], 3)
overlays = [o for o in overlays if o['dur'] >= 1.6]

plan = dict(video_dur=round(AUDIO, 3), audio_dur=round(AUDIO, 3), fps=25, w=1920, h=1080,
            unused_images=unused, gaps=gaps, segments=segments, overlays=overlays, bugs=bugs)
json.dump(plan, open(os.path.join(WORK, 'edit.json'), 'w'), ensure_ascii=False, indent=1)

with open(os.path.join(WORK, 'timeline.tsv'), 'w', encoding='utf-8') as f:
    f.write('kind\tstart\tend\tdur\tclip\tfile / card\n')
    for s in segments:
        f.write('shot\t%.2f\t%.2f\t%.2f\t%s\t%s\n' % (
            s['start'], s['end'], s['dur'], s['clip'], os.path.basename(s['file'])))
    for s in overlays:
        f.write('card\t%.2f\t%.2f\t%.2f\t%s\tCARD %d: %s\n' % (
            s['start'], s['end'], s['dur'], s.get('clip', ''), s['card'],
            s['title'].replace('\n', ' / ')))

print('shots %d  overlays %d  bugs %d' % (len(shots), len(overlays), len(bugs)))
print('video %.2fs  audio %.2fs  gaps %s' % (AUDIO, AUDIO, gaps))
print('shot dur min/avg/max: %.1f / %.1f / %.1f' % (
    min(s['dur'] for s in shots), sum(s['dur'] for s in shots) / len(shots),
    max(s['dur'] for s in shots)))
print('unused', unused)
print('covers %.2f → %.2f' % (shots[0]['start'], shots[-1]['end']))
