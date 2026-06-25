##===============================================##
##                    Builder                    ##
## https://github.com/rust-cross/rust-musl-cross ##
##===============================================##
FROM messense/rust-musl-cross:x86_64-musl AS build

WORKDIR /app

COPY Cargo.* ./
COPY src ./src

RUN cargo build --target x86_64-unknown-linux-musl --release


##=============##
## Final Image ##
##=============##
FROM alpine:latest AS deploy

# `ffmpeg` provides the `ffprobe` binary that the `ffprobe` crate shells out to
# for media duration probing; without it, duration metadata silently fails.
RUN apk update && apk add --no-cache \
    dumb-init \
    ffmpeg

# Import from build
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/web_file_browser_server .

CMD ["dumb-init", "./web_file_browser_server"]
