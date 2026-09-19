#!/usr/bin/env python3
"""Ken-Burns the stills, concat, grade, burn captions/cards, mix VO.

Resumable: existing work/shots/*.mp4 of the right duration are reused.
"""
import json, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed

FF = subprocess.run(
    ['python3', '-c', 'import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())'],
    capture_output=True, text=True).stdout.strip()
ROOT = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(ROOT, 'work')
SHOTS = os.path.join(WORK, 'shots')
SCALED = os.path.join(WORK, 'scaled')
FONTS = os.path.join(ROOT, 'assets', 'fonts')
os.makedirs(SHOTS, exist_ok=True)
os.makedirs(SCALED, exist_ok=True)

plan = json.load(open(os.path.join(WORK, 'edit.json')))
FPS = 25
W, H = 1920, 1080
# 10% overscan for the pan
SW, SH = 2112, 1188
EX, EY = SW - W, SH - H  # 192, 108


def run(cmd, log=None):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0:
        err = p.stderr.decode('utf-8', 'replace')[-1500:]
        if log:
            open(log, 'w').write(err)
        raise RuntimeError('ffmpeg failed (%s)\n%s' % (' '.join(cmd[:8]), err))
    return p


def probe_dur(path):
    r = subprocess.run([FF, '-i', path, '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'time=\s*(\d+):(\d+):(\d+)\.(\d+)', r)
    if not m:
        return 0.0
    h, mi, s, cs = map(int, m.groups())
    return h * 3600 + mi * 60 + s + cs / 100.0


def scale_still(src):
    dst = os.path.join(SCALED, os.path.basename(src))
    if os.path.exists(dst) and os.path.getsize(dst) > 1000:
        return dst
    run([FF, '-y', '-loglevel', 'error', '-i', src,
         '-vf', 'scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,format=yuvj420p' % (SW, SH, SW, SH),
         '-q:v', '3', dst])
    return dst


def ken_burns_expr(pan, dur):
    """Crop x,y expressions. pan 0..3 different directions."""
    # n goes 0..N-1 ; use n/(N-1) so last frame lands
    nmax = max(1, int(round(dur * FPS)) - 1)
    p = 'n/%d' % nmax
    if pan == 0:      # L → R, slight up
        x, y = '%d*%s' % (EX, p), str(int(EY * 0.25))
    elif pan == 1:    # R → L, slight down
        x, y = '%d*(1-%s)' % (EX, p), str(int(EY * 0.65))
    elif pan == 2:    # top → bottom
        x, y = str(int(EX * 0.35)), '%d*%s' % (EY, p)
    else:             # zoom-in feel (crop window shrinks toward centre-right)
        x, y = '%d*(1-%s)*0.7' % (EX, p), '%d*(1-%s)*0.45' % (EY, p)
    return x, y


def encode_shot(idx, seg):
    out = os.path.join(SHOTS, 's%03d.mp4' % idx)
    target = seg['dur']
    if os.path.exists(out) and abs(probe_dur(out) - target) < 0.15 and os.path.getsize(out) > 20_000:
        return out, 'skip'
    src = scale_still(seg['file'])
    x, y = ken_burns_expr(seg.get('pan', idx % 4), target)
    fade_d = 0.18 if target > 1.6 else 0.0
    vf = ("crop=%d:%d:'%s':'%s',setsar=1,fps=%d,format=yuv420p" % (W, H, x, y, FPS))
    if fade_d:
        st_out = max(0.0, target - fade_d)
        vf += ',fade=t=in:st=0:d=%.2f,fade=t=out:st=%.2f:d=%.2f' % (fade_d, st_out, fade_d)
    cmd = [FF, '-y', '-loglevel', 'error',
           '-loop', '1', '-framerate', str(FPS), '-t', '%.3f' % target, '-i', src,
           '-vf', vf, '-an',
           '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20',
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
           '-video_track_timescale', '25000',
           out]
    t0 = time.time()
    run(cmd, out + '.log')
    return out, '%.1fs' % (time.time() - t0)


def main():
    shots = [s for s in plan['segments'] if s['kind'] == 'shot']
    print('scaling stills…', flush=True)
    for s in shots:
        scale_still(s['file'])
    print('encoding %d shots (2 workers)…' % len(shots), flush=True)
    done = 0
    with ThreadPoolExecutor(max_workers=2) as ex:
        futs = {ex.submit(encode_shot, i, s): i for i, s in enumerate(shots)}
        for fut in as_completed(futs):
            i = futs[fut]
            try:
                path, tag = fut.result()
            except Exception as e:
                print('FAIL shot', i, e, file=sys.stderr, flush=True)
                raise
            done += 1
            if done % 8 == 0 or tag != 'skip':
                print('  [%d/%d] s%03d %s' % (done, len(shots), i, tag), flush=True)

    concat = os.path.join(WORK, 'concat.txt')
    with open(concat, 'w') as f:
        for i in range(len(shots)):
            f.write("file '%s'\n" % os.path.join(SHOTS, 's%03d.mp4' % i))

    picture = os.path.join(WORK, 'picture.mp4')
    print('concat picture…', flush=True)
    run([FF, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', concat,
         '-c', 'copy', picture])

    audio = os.path.join(ROOT, 'voiceover-full-loudnorm.mp3')
    if not os.path.exists(audio):
        audio = os.path.join(ROOT, 'voiceover-full.mp3')
    ass = os.path.join(WORK, 'master.ass')
    out = os.path.join(ROOT, 'psychology-of-money.mp4')
    T = plan['audio_dur']
    # letterbox + gold progress + grade + captions
    vf = (
        "eq=contrast=1.05:brightness=0.015:saturation=0.90:gamma=1.03,"
        "drawbox=x=0:y=0:w=iw:h=48:color=0x0B0C10@1:t=fill,"
        "drawbox=x=0:y=ih-48:w=iw:h=48:color=0x0B0C10@1:t=fill,"
        "drawbox=x=0:y=ih-52:w='iw*min(t/%.3f\\,1)':h=4:color=0xC4A35A@1:t=fill,"
        "subtitles=%s:fontsdir=%s,"
        "format=yuv420p" % (T, ass.replace('\\', '/'), FONTS.replace('\\', '/'))
    )
    print('final composite (grade + captions + VO)…', flush=True)
    t0 = time.time()
    run([FF, '-y', '-loglevel', 'warning',
         '-i', picture, '-i', audio,
         '-vf', vf,
         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-ar', '44100',
         '-shortest', '-movflags', '+faststart',
         '-metadata', 'title=The Psychology of Money — 8 सबक',
         '-metadata', 'comment=Hindi rewrite + VO of Morgan Housel, The Psychology of Money',
         out])
    print('wrote', out, 'in %.0fs  size %.1f MB  dur %.1fs' % (
        time.time() - t0, os.path.getsize(out) / 1e6, probe_dur(out)), flush=True)


if __name__ == '__main__':
    main()
