#!/usr/bin/env bash
# Build the 30s Design Workshop product walkthrough reel.
#
# Strategy:
#   1. For each shot PNG, use ffmpeg's zoompan filter to produce a clip of
#      the configured duration with a subtle Ken-Burns zoom (1.0 → 1.08).
#   2. Concatenate all clips with `xfade` crossfades between every pair
#      (0.35s overlap) for cinematic continuity.
#   3. Export two cuts:
#        • design-workshop-30s.mp4   — full 30s reel (Video Embed source)
#        • design-workshop-loop.mp4  — 12s landing-hero loop (shots 1-3+5+10)
#
# All H.264 + AAC (silent track) at 1920×1080 / 30fps so the result plays
# everywhere — including muted-autoplay browsers.
set -euo pipefail

FRAMES=/app/video/frames
OUT=/app/video/output
mkdir -p "$OUT" "$FRAMES/clips"

FPS=30
W=1920
H=1080

# Shot durations — must match build-frames.js storyboard total = 30.0s
declare -A DUR
DUR[01]=3.0
DUR[02]=3.0
DUR[03]=4.0
DUR[04]=3.5
DUR[05]=3.5
DUR[06]=3.0
DUR[07]=3.0
DUR[08]=3.0
DUR[09]=2.5
DUR[10]=1.5

# ----- Phase 1: render each PNG → silent MP4 clip (static, no Ken-Burns) -
# Earlier versions used zoompan for a Ken-Burns push, but at slow zoom
# rates ffmpeg's zoompan stair-steps coordinates frame-to-frame and the
# result looks jittery. Static frames + the crossfade transitions between
# shots already provide all the motion the eye needs.
for id in 01 02 03 04 05 06 07 08 09 10; do
  d="${DUR[$id]}"
  out="$FRAMES/clips/shot-$id.mp4"
  ffmpeg -y -loglevel error -loop 1 -i "$FRAMES/shot-$id.png" \
    -vf "scale=${W}:${H},format=yuv420p" \
    -t "$d" -r "$FPS" -c:v libx264 -pix_fmt yuv420p -preset slow -crf 18 "$out"
  echo "✓ clip $id  ($d s, static)"
done

# ----- Phase 2: stitch all clips with xfade crossfades --------------------
build_concat_with_xfade() {
  # $1 = output file
  # $2... = list of clip names (e.g. "01 02 03 ...")
  local out="$1"; shift
  local fade=0.35
  local ids=("$@")
  local inputs=""
  local filter=""
  local idx=0
  local total=0
  for id in "${ids[@]}"; do
    inputs+=" -i $FRAMES/clips/shot-$id.mp4"
  done
  local prev="0:v"
  for ((i=1; i<${#ids[@]}; i++)); do
    local prevDur=0
    for ((j=0; j<i; j++)); do
      local d="${DUR[${ids[$j]}]}"
      prevDur=$(awk "BEGIN { print $prevDur + $d }")
    done
    # offset = cumulative prev duration minus the crossfade overlap
    local offset=$(awk "BEGIN { print $prevDur - $fade }")
    filter+="[$prev][$i:v]xfade=transition=fade:duration=$fade:offset=$offset[v$i];"
    prev="v$i"
  done
  # strip trailing semicolon
  filter="${filter%;}"
  # Add a silent audio track so muted-autoplay platforms (and the Video
  # Embed section's lightbox unmute control) have a real stream to expose.
  ffmpeg -y -loglevel error $inputs -f lavfi -i anullsrc=r=44100:cl=stereo \
    -filter_complex "$filter" \
    -map "[$prev]" -map ${#ids[@]}:a -shortest \
    -c:v libx264 -pix_fmt yuv420p -preset slow -crf 18 \
    -c:a aac -b:a 96k \
    -movflags +faststart \
    "$out"
}

echo "→ building full 30s reel"
build_concat_with_xfade "$OUT/design-workshop-30s.mp4" 01 02 03 04 05 06 07 08 09 10
echo "→ building 12s landing-hero loop"
# Hero loop: title → grid → hero showcase → stat counter → outro
build_concat_with_xfade "$OUT/design-workshop-loop.mp4" 01 02 03 05 10

ls -lh "$OUT"
echo "Done."
