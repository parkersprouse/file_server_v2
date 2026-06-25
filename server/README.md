# Web File Browser — Server

A read-only HTTP file browser over a directory tree, built with Rust and actix-web.

## Runtime dependency

Media duration probing uses the [`ffprobe`](https://crates.io/crates/ffprobe)
crate, which shells out to the system **`ffprobe`** binary (shipped as part of
**ffmpeg**). Install ffmpeg to enable duration metadata; without it, probing is
skipped gracefully — entries still list, just without a duration. The Docker
image installs ffmpeg for this reason.

## Built with

  - Rust & Cargo **1.90.0**
  - ffmpeg **8.0** (provides `ffprobe`)
