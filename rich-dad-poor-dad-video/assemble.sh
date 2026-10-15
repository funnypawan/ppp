#!/usr/bin/env bash
# ============================================================
# Rich Dad Poor Dad — video assembler (generic, N audio parts)
# Usage: ./assemble.sh audio/1.wav audio/2.wav ... audio/13.wav
#   - Audio files in chronological script order
#   - 81 images distributed PROPORTIONALLY across audio parts
#   - Ken Burns motion (zoom/pan alternating), 1080p30
#   - Audio: 0.3s gaps between parts, loudness normalize, fades
# Output: FINAL-VIDEO.mp4
# ============================================================
set -eu
FF=/home/user/.local/bin/ffmpeg
BASE="$(cd "$(dirname "$0")" && pwd)"
IMG="$BASE/images"
OUT="$BASE/clips"
VLIST="$OUT/vlist.txt"
FPS=30
W=1920; H=1080
NIMG=81
GAP=0.3

[ $# -ge 1 ] || { echo "ERROR: audio files do: $0 a1 a2 ..."; exit 1; }
NA=$#
mkdir -p "$OUT"
: > "$VLIST"

# --- 1. Audio durations ---
echo "=== $NA AUDIO PARTS ==="
DURS=()
INPUTS=()
for f in "$@"; do
  [ -f "$f" ] || { echo "ERROR: missing: $f"; exit 1; }
  d=$($FF -i "$f" 2>&1 | grep -oP 'Duration: \K[0-9:.]+' | head -1 || true)
  [ -n "$d" ] || { echo "ERROR: duration nahi mila: $f"; exit 1; }
  s=$(echo "$d" | awk -F: '{ printf "%.3f", ($1*3600)+($2*60)+$3 }')
  DURS+=("$s")
  INPUTS+=("-i" "$f")
  echo "  $(basename "$f") -> ${s}s"
done

# --- 2. Render clips (proportional image ranges + cumulative rounding) ---
echo ""
echo "=== RENDERING 81 CLIPS ==="
idx=0
for si in $(seq 0 $((NA-1))); do
  A=$(awk -v n="$NIMG" -v N="$NA" -v i="$si" 'BEGIN{printf "%d", int(i*n/N)+1}')
  B=$(awk -v n="$NIMG" -v N="$NA" -v i="$((si+1))" 'BEGIN{printf "%d", int(i*n/N)}')
  N=$(( B - A + 1 ))
  D="${DURS[$si]}"
  echo "PART $((si+1))/${NA}: img-$A..img-$B ($N imgs over ${D}s)"
  for k in $(seq 0 $((N-1))); do
    n=$(printf "%02g" $(( A + k )))
    img=$(ls "$IMG"/img-"$n"-*.jpg 2>/dev/null | head -1)
    [ -n "$img" ] || { echo "ERROR: img-$n missing"; exit 1; }
    # per-clip frames = cumulative(k+1) - cumulative(k) => drift-free sync
    F=$(awk -v d="$D" -v n="$N" -v k="$k" 'BEGIN{printf "%d", int((d*(k+1)/n)*30+0.5) - int((d*k/n)*30+0.5)}')
    case $(( idx % 4 )) in
      0) ZP="zoompan=z='min(1+$(awk -v f="$F" 'BEGIN{printf "%.7f",0.12/f}')*on,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;
      1) ZP="zoompan=z='1.08':x='(iw-iw/zoom)*on/$F':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;
      2) ZP="zoompan=z='max(1.12-$(awk -v f="$F" 'BEGIN{printf "%.7f",0.12/f}')*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;
      3) ZP="zoompan=z='1.08':x='(iw-iw/zoom)*(1-on/$F)':y='ih/2-(ih/zoom/2)':d=$F:s=${W}x${H}:fps=$FPS" ;;
    esac
    clip="$OUT/clip-$n.mp4"
    TARGET=$(awk -v f="$F" 'BEGIN{printf "%.3f", f/30}')
    SKIP=0
    if [ -f "$clip" ]; then
      cdur=$($FF -i "$clip" 2>&1 | grep -oP 'Duration: \K[0-9:.]+' | head -1 || true)
      if [ -n "$cdur" ]; then
        cs=$(echo "$cdur" | awk -F: '{printf "%.3f", ($1*3600)+($2*60)+$3}')
        SKIP=$(awk -v a="$cs" -v b="$TARGET" 'BEGIN{print (a>b-0.08 && a<b+0.08) ? 1 : 0}')
      fi
    fi
    if [ "$SKIP" = "1" ]; then
      echo "  skip $n (already ${TARGET}s)"
    else
      $FF -y -loglevel error -i "$img" \
        -vf "scale=${W}*2:${H}*2:force_original_aspect_ratio=increase,crop=${W}*2:${H}*2,$ZP" \
        -frames:v "$F" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$clip"
    fi
    echo "file '$clip'" >> "$VLIST"
    idx=$((idx+1))
  done
done

# --- 3. Audio: N parts + (N-1) gaps -> concat -> loudnorm -> fades ---
echo ""
echo "=== AUDIO MIX ==="
TOTS=0; for d in "${DURS[@]}"; do TOTS=$(awk -v t="$TOTS" -v d="$d" 'BEGIN{printf "%.3f", t+d}'); done
TAUD=$(awk -v t="$TOTS" -v g="$GAP" -v n="$NA" 'BEGIN{printf "%.3f", t+g*(n-1)}')
FADE_ST=$(awk -v t="$TAUD" 'BEGIN{printf "%.2f", t-0.6}')

FLT=""
for i in $(seq 0 $((NA-1))); do FLT+="[$i:a]aformat=sample_rates=44100:channel_layouts=stereo[a$i];"; done
for i in $(seq 1 $((NA-1))); do FLT+="aevalsrc=0:d=$GAP:s=44100[g$i];"; done
CAT=""
for i in $(seq 0 $((NA-1))); do CAT+="[a$i]"; [ $i -lt $((NA-1)) ] && CAT+="[g$((i+1))]"; done
FLT+="${CAT}concat=n=$((NA*2-1)):v=0:a=1,loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.3,afade=t=out:st=${FADE_ST}:d=0.5[out]"

$FF -y -loglevel error "${INPUTS[@]}" -filter_complex "$FLT" -map "[out]" -c:a aac -b:a 192k "$OUT/voiceover.m4a"

# --- 4. Final mux ---
echo "=== FINAL MUX ==="
$FF -y -loglevel error -f concat -safe 0 -i "$VLIST" -i "$OUT/voiceover.m4a" \
  -c:v copy -c:a copy -movflags +faststart "$BASE/FINAL-VIDEO.mp4"

echo ""
$FF -i "$BASE/FINAL-VIDEO.mp4" 2>&1 | grep -E "Duration|Stream" || true
echo "DONE -> $BASE/FINAL-VIDEO.mp4"
