#!/usr/bin/env bash
# ============================================================
# Rich Dad Poor Dad — 14 min video assembler
# Usage: ./assemble.sh <audio1> <audio2> <audio3> <audio4>
#   Audio files in chronological script order.
#   Section split (81 images):
#     Audio 1 -> img 01-24  (Intro, Do Baap, 10 Cents job)
#     Audio 2 -> img 25-45  (Asset/Liability, Cashflow, Business)
#     Audio 3 -> img 46-62  (Tax/Corporation, Financial IQ)
#     Audio 4 -> img 63-81  (Rukavtein, 10 Steps, Golden Rules, Final)
# Output: FINAL-VIDEO.mp4 (1080p30, Ken Burns motion + voiceover)
# ============================================================
set -eu
FF=/home/user/.local/bin/ffmpeg
BASE="$(cd "$(dirname "$0")" && pwd)"
IMG="$BASE/images"
OUT="$BASE/clips"
VLIST="$OUT/vlist.txt"
FPS=30
W=1920; H=1080

[ $# -eq 4 ] || { echo "ERROR: 4 audio files chahiye: $0 a1 a2 a3 a4"; exit 1; }
mkdir -p "$OUT"
: > "$VLIST"

# --- 1. Audio durations nikaalo ---
DURS=()
for f in "$@"; do
  [ -f "$f" ] || { echo "ERROR: file missing: $f"; exit 1; }
  d=$($FF -i "$f" 2>&1 | grep -oP 'Duration: \K[0-9:.]+' | head -1 || true)
  [ -n "$d" ] || { echo "ERROR: duration nahi mila: $f"; exit 1; }
  secs=$(echo "$d" | awk -F: '{ printf "%.3f", ($1*3600)+($2*60)+$3 }')
  DURS+=("$secs")
  echo "AUDIO: $(basename "$f")  ->  $secs sec"
done

# --- 2. Section image ranges (start end) ---
RANGES=("1 24" "25 45" "46 62" "63 81")

idx=0
for si in "${!RANGES[@]}"; do
  read -r A B <<< "${RANGES[$si]}"
  N=$(( B - A + 1 ))
  D="${DURS[$si]}"
  # per-image duration (images evenly across this audio)
  PER=$(awk -v n="$N" -v d="$D" 'BEGIN{ printf "%.3f", d/n }')
  echo ""
  echo "=== SECTION $((si+1)): img-$A..img-$B  ($N images x ${PER}s over ${D}s) ==="

  for n in $(seq -f "%02g" "$A" "$B"); do
    img=$(ls "$IMG"/img-"$n"-*.jpg 2>/dev/null | head -1)
    [ -n "$img" ] || { echo "ERROR: image img-$n nahi mila"; exit 1; }
    F=$(awk -v p="$PER" 'BEGIN{ printf "%d", int(p*30+0.5) }')   # frames
    case $(( idx % 4 )) in
      0) ZP="zoompan=z='min(1+$(awk -v f="$F" 'BEGIN{printf "%.6f",0.12/f}')*on,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;                    # zoom-in
      1) ZP="zoompan=z='1.08':x='(iw-iw/zoom)*on/$F':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;                                                                             # pan L->R
      2) ZP="zoompan=z='max(1.12-$(awk -v f="$F" 'BEGIN{printf "%.6f",0.12/f}')*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;                    # zoom-out
      3) ZP="zoompan=z='1.08':x='(iw-iw/zoom)*(1-on/$F)':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;                                                                          # pan R->L
    esac
    clip="$OUT/clip-$n.mp4"
    $FF -y -loglevel error -i "$img" \
      -vf "scale=${W}*2:${H}*2:force_original_aspect_ratio=increase,crop=${W}*2:${H}*2,$ZP" \
      -frames:v "$F" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$clip"
    echo "file '$clip'" >> "$VLIST"
    idx=$((idx+1))
  done
done

# --- 3. Audio concat (0.35s gap between sections + loudness normalize) ---
echo ""
echo "=== AUDIO CONCAT ==="
TAUD=$(awk -v a="${DURS[0]}" -v b="${DURS[1]}" -v c="${DURS[2]}" -v d="${DURS[3]}" 'BEGIN{printf "%.2f", a+b+c+d+1.05}')
FADE_ST=$(awk -v t="$TAUD" 'BEGIN{printf "%.2f", t-0.6}')
$FF -y -loglevel error -i "$1" -i "$2" -i "$3" -i "$4" \
  -filter_complex "aevalsrc=0:d=0.35:s=44100[s1];aevalsrc=0:d=0.35:s=44100[s2];aevalsrc=0:d=0.35:s=44100[s3];[0:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];[1:a]aformat=sample_rates=44100:channel_layouts=stereo[a1];[2:a]aformat=sample_rates=44100:channel_layouts=stereo[a2];[3:a]aformat=sample_rates=44100:channel_layouts=stereo[a3];[a0][s1][a1][s2][a2][s3][a3]concat=n=7:v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.3,afade=t=out:st=${FADE_ST}:d=0.5[out]" \
  -map "[out]" -c:a aac -b:a 192k "$OUT/voiceover.m4a"

# --- 4. Final mux ---
echo "=== FINAL MUX ==="
$FF -y -loglevel error -f concat -safe 0 -i "$VLIST" -i "$OUT/voiceover.m4a" \
  -c:v copy -c:a copy -movflags +faststart "$BASE/FINAL-VIDEO.mp4"

echo ""
$FF -i "$BASE/FINAL-VIDEO.mp4" 2>&1 | grep -E "Duration|Stream" || true
echo "DONE -> $BASE/FINAL-VIDEO.mp4"
