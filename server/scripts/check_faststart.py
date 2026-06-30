#!/usr/bin/env python3
"""Report whether MP4/MOV files are "fast-start" (the `moov` index before `mdat`).

Firefox only marks the contiguously-downloaded region of a video as seekable, so
for MP4/MOV files whose `moov` index sits *after* the media data, seeking in the
preview player snaps back to a few seconds in until enough of the file has
downloaded. Chromium hides the problem by eagerly fetching the trailing index.
The fix is to relocate the index to the front (losslessly):

    ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4

This script tells you which files need that treatment. It walks only the
top-level boxes, so it stays fast even on multi-gigabyte files, and needs no
external tools (pure standard-library Python).

Usage:
    check_faststart.py file1.mp4 file2.mov ...
    find /media -iname '*.mp4' -o -iname '*.mov' -print0 | xargs -0 check_faststart.py

Exit status is the number of files that are NOT fast-start, so it doubles as a
CI / scripting gate:
    check_faststart.py "$f" >/dev/null || ffmpeg -i "$f" -c copy -movflags +faststart out.mp4

Loop example:
    for f in *.mp4; do
        if ! python3 check_faststart.py "$f" >/dev/null; then   # exit!=0 => needs fix
            ffmpeg -i "$f" -c copy -movflags +faststart "${f%.mp4}.fs.mp4" && mv "${f%.mp4}.fs.mp4" "$f"
        fi
    done

Checking `moov` index solely with FFmpeg:
    # If the first line is type:'moov' → fast-start; if type:'mdat' → needs fixing.
    ffprobe -v trace input.mp4 2>&1 | grep -aoE "type:'(moov|mdat)'" | head -2

    # Can also look for FFmpeg's own hint:
    ffmpeg -v info -i input.mp4 -f null - 2>&1 | grep -i "use -movflags +faststart"
"""
import struct
import sys


def faststart_state(path):
    """Return 'faststart', 'needs-faststart', or 'n/a' (no moov+mdat found)."""
    with open(path, "rb") as f:
        while True:
            header = f.read(8)
            if len(header) < 8:
                return "n/a"
            size = struct.unpack(">I", header[:4])[0]
            box = header[4:8]
            if box in (b"moov", b"mdat"):
                return "faststart" if box == b"moov" else "needs-faststart"
            if size == 1:                       # 64-bit extended size
                size = struct.unpack(">Q", f.read(8))[0]
                skip = size - 16
            elif size == 0:                     # box runs to EOF; nothing after it
                return "n/a"
            else:
                skip = size - 8
            if skip < 0:
                return "n/a"                    # malformed
            f.seek(skip, 1)


def main(argv):
    if not argv:
        print(__doc__, file=sys.stderr)
        return 0
    bad = 0
    for path in argv:
        try:
            state = faststart_state(path)
        except OSError as err:
            print(f"ERROR  {path}: {err}", file=sys.stderr)
            bad += 1
            continue
        if state == "needs-faststart":
            bad += 1
        print(f"{state:>15}  {path}")
    return bad


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
