"""Styled ASS: captions + cards + lesson bugs. Captions duck under cards."""
import json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(ROOT, 'work')
plan = json.load(open(os.path.join(WORK, 'edit.json'), encoding='utf-8'))
srt = open(os.path.join(ROOT, 'voiceover.srt'), encoding='utf-8').read()

HEADER = r'''[Script Info]
Title: Psychology of Money — Hindi
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1920
PlayResY: 1080
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Mukta,44,&H00F4F1EA,&H000000FF,&H000B0C10,&H900B0C10,0,0,0,0,100,100,0.3,0,3,10,0,2,180,180,72,1
Style: CardTitle,Mukta,78,&H00F4F1EA,&H000000FF,&H00080A0E,&H00000000,1,0,0,0,100,100,0.6,0,1,5,0,5,80,80,0,1
Style: CardSub,Mukta,34,&H00C9DCE8,&H000000FF,&H00080A0E,&H00000000,0,0,0,0,100,100,0.5,0,1,3,0,5,80,80,0,1
Style: StatNum,Mukta,108,&H00E8D5A3,&H000000FF,&H00080A0E,&H00000000,1,0,0,0,100,100,1.2,0,1,5,0,5,80,80,0,1
Style: Quote,Mukta,50,&H00F4F1EA,&H000000FF,&H00080A0E,&H00000000,0,0,0,0,100,100,0.4,0,1,4,0,5,160,160,0,1
Style: LessonNum,Mukta,26,&H00C4A35A,&H000000FF,&H00080A0E,&H00000000,1,0,0,0,100,100,3.0,0,1,2,0,5,80,80,0,1
Style: LessonName,Mukta,62,&H00F4F1EA,&H000000FF,&H00080A0E,&H00000000,1,0,0,0,100,100,0.5,0,1,5,0,5,80,80,0,1
Style: Bug,Mukta,24,&H00E8D5A3,&H000000FF,&H00080A0E,&H00000000,1,0,0,0,100,100,1.6,0,1,2,0,7,56,56,58,1
Style: CTA,Mukta,64,&H00F4F1EA,&H000000FF,&H00080A0E,&H00000000,1,0,0,0,100,100,0.6,0,1,5,0,5,80,80,0,1
Style: Dim,Mukta,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
Style: Gold,Mukta,20,&H00C4A35A,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''


def ass_time(t):
    t = max(0.0, t)
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return '%d:%02d:%05.2f' % (h, m, s)


def wrap(text, n=34):
    text = re.sub(r'\s+', ' ', text).strip()
    if not text:
        return ''
    words, lines, cur = text.split(' '), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if len(trial) > n and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return r'\N'.join(lines[:3])


events = []


def add(layer, start, end, style, text):
    if end - start < 0.12:
        return
    events.append('Dialogue: %d,%s,%s,%s,,0,0,0,,%s' % (
        layer, ass_time(start), ass_time(end), style, text))


def punch(st, en, windows, pad=0.08):
    """Return (start,end) pieces of [st,en] that don't overlap windows."""
    pieces, cursor = [], st
    for a, b in sorted(windows):
        a, b = a - pad, b + pad
        if a >= en:
            break
        if b <= cursor:
            continue
        if a > cursor:
            pieces.append((cursor, min(a, en)))
        cursor = max(cursor, b)
    if cursor < en:
        pieces.append((cursor, en))
    return [(a, b) for a, b in pieces if b - a >= 0.35]


card_windows = [(o['start'], o['end']) for o in plan['overlays']]

# captions — duck under cards so type never fights a plate
blocks = re.split(r'\n\s*\n', srt.strip())
for b in blocks:
    lines = [l for l in b.split('\n') if l.strip()]
    if len(lines) < 2:
        continue
    m = re.match(r'(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)', lines[1])
    if not m:
        continue
    a = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000
    c = int(m[5]) * 3600 + int(m[6]) * 60 + int(m[7]) + int(m[8]) / 1000
    txt = wrap(' '.join(lines[2:]), 34)
    if not txt:
        continue
    for s, e in punch(a, c, card_windows, pad=0.15):
        add(0, s, e, 'Caption', r'{\fad(90,140)}' + txt)

GOLD_RULE = (r'{\an5\pos(960,588)\p1\c&HC4A35A&\alpha&H00&\bord0\shad0}'
             r'm 0 0 l 220 0 l 220 3 l 0 3{\p0}')

for o in plan['overlays']:
    st, en = o['start'], o['end']
    style = o.get('style', 'title')
    title = o.get('title', '').replace('\n', r'\N')
    sub = o.get('sub', '')
    en_ = o.get('en', '')
    fad = r'{\fad(240,260)}'
    # lighter veil — image still readable
    add(5, st, en, 'Dim',
        r'{\fad(200,220)\an5\pos(960,540)\p1\c&H0B0C10&\alpha&H68&\bord0}'
        r'm 0 0 l 1920 0 l 1920 1080 l 0 1080{\p0}')
    # centre panel behind type
    add(5, st, en, 'Dim',
        r'{\fad(200,220)\an5\pos(960,520)\p1\c&H0B0C10&\alpha&H4A&\bord0}'
        r'm 0 0 l 1400 0 l 1400 340 l 0 340{\p0}')

    if style == 'versus':
        add(6, st, en, 'CardSub', fad + r'{\an5\pos(460,395)\fs20\c&HC4A35A&\fsp4}THE JANITOR')
        add(6, st, en, 'CardTitle', fad + r'{\an5\pos(460,468)\fs54}' + o['title'])
        add(6, st, en, 'CardSub', fad + r'{\an5\pos(460,540)\fs26}' + o['sub'])
        add(6, st, en, 'CardSub', fad + r'{\an5\pos(1460,395)\fs20\c&HC4A35A&\fsp4}THE BANKER')
        add(6, st, en, 'CardTitle', fad + r'{\an5\pos(1460,468)\fs54}' + o['right'])
        add(6, st, en, 'CardSub', fad + r'{\an5\pos(1460,540)\fs26}' + o['rsub'])
        add(6, st, en, 'Gold', fad + r'{\an5\pos(960,468)\fs28\c&HC4A35A&}·')
    elif style == 'lesson':
        add(6, st, en, 'LessonNum', fad + r'{\an5\pos(960,418)\fsp6}' + title.upper())
        add(6, st, en, 'Gold', fad + GOLD_RULE)
        add(6, st, en, 'LessonName', fad + r'{\an5\pos(960,548)}' + wrap(o['sub'], 26))
        if en_:
            add(6, st, en, 'CardSub', fad + r'{\an5\pos(960,640)\fs30\c&H8EC8E8&}' + en_)
    elif style == 'stat':
        add(6, st, en, 'StatNum', fad + r'{\an5\pos(960,488)}' + title.replace(r'\N', ' '))
        add(6, st, en, 'Gold', fad + GOLD_RULE.replace('588', '568'))
        if sub:
            add(6, st, en, 'CardSub', fad + r'{\an5\pos(960,628)}' + wrap(sub, 38))
    elif style == 'quote':
        add(6, st, en, 'Quote', fad + r'{\an5\pos(960,490)\fs48}' + wrap(title, 34))
        if sub:
            add(6, st, en, 'CardSub', fad + r'{\an5\pos(960,640)}' + wrap(sub, 40))
    elif style == 'question':
        add(6, st, en, 'CardTitle', fad + r'{\an5\pos(960,540)\fs88}' + title)
    elif style == 'cta':
        add(6, st, en, 'CTA', fad + r'{\an5\pos(960,490)}' + wrap(title, 26))
        add(6, st, en, 'Gold', fad + GOLD_RULE)
        if sub:
            add(6, st, en, 'CardSub', fad + r'{\an5\pos(960,640)\fs36}' + sub)
    else:
        add(6, st, en, 'CardTitle', fad + r'{\an5\pos(960,500)\fs66}' + title)
        if sub:
            add(6, st, en, 'CardSub', fad + r'{\an5\pos(960,640)}' + wrap(sub, 40))

for b in plan['bugs']:
    for a, c in punch(b['start'], b['end'], card_windows, pad=0.2):
        add(2, a, c, 'Bug', r'{\fad(350,350)}' + b['label'])

out = os.path.join(WORK, 'master.ass')
open(out, 'w', encoding='utf-8').write(HEADER + '\n'.join(events) + '\n')
print('wrote', out, 'events', len(events))
