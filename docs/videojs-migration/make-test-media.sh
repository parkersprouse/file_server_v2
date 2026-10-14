#!/usr/bin/env bash
# Generates the test library used by verify-players.cjs and the manual checks in
# HANDOFF.md. Requires ffmpeg (with libx264, libvpx-vp9, libopus, libmp3lame).
#
#   ./docs/videojs-migration/make-test-media.sh /tmp/vjs-media
set -euo pipefail

OUT="${1:?usage: make-test-media.sh <output-dir>}"
mkdir -p "$OUT/.thumbnails"
cd "$OUT"

ff() { ffmpeg -loglevel error -y "$@"; }

# H.264/AAC, fast-start (moov first). Has a poster thumbnail.
ff -f lavfi -i testsrc2=size=640x360:rate=30 -f lavfi -i sine=frequency=440 -t 20 \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart clip.mp4
ff -f lavfi -i color=c=orange:size=640x360 -frames:v 1 .thumbnails/clip.png

# H.264/AAC, NOT fast-start (moov at the end). VideoPreview keeps
# `preload='metadata'` specifically so Firefox can seek these; see the comment
# on the <video> in VideoPreview.vue.
ff -f lavfi -i testsrc2=size=1280x720:rate=30 -f lavfi -i sine=frequency=550 -t 120 \
  -c:v libx264 -pix_fmt yuv420p -b:v 2M -c:a aac clip-late-moov.mp4

# VP9/Opus WebM (the only video format the open-source Playwright Chromium decodes).
ff -f lavfi -i testsrc=size=640x360:rate=30 -f lavfi -i sine=frequency=660 -t 12 \
  -c:v libvpx-vp9 -b:v 300k -c:a libopus clip2.webm

# Portrait video, for mobile and fullscreen layout checks.
ff -f lavfi -i testsrc2=size=360x640:rate=30 -f lavfi -i sine=frequency=770 -t 15 \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -movflags +faststart portrait.mp4

# Longer than an hour, so the time display switches to h:mm:ss.
ff -f lavfi -i color=c=navy:size=320x180:rate=1 -f lavfi -i anullsrc=r=8000:cl=mono -t 3700 \
  -c:v libx264 -pix_fmt yuv420p -tune stillimage -c:a aac -b:a 16k -movflags +faststart long.mp4

# Audio.
ff -f lavfi -i sine=frequency=330 -t 15 -c:a libmp3lame song.mp3
ff -f lavfi -i sine=frequency=220 -t 15 -c:a aac song.m4a

ls -la "$OUT" "$OUT/.thumbnails"
