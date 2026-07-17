#!/usr/bin/env bash
set -euo pipefail

# Builds a custom Caddy binary with the layer4 plugin (github.com/mholt/caddy-l4),
# which the root Caddyfile needs for the client port's same-port HTTP->HTTPS
# redirect (stock Caddy can't do that off port 443 — see the Caddyfile's header
# comment for why). Requires a Go toolchain; xcaddy is installed automatically
# if missing. Run from a Mac to produce either or both binaries, including the
# Windows one (cross-compiled, no Go needed on the Windows box).
#
# Usage:
#   bin/build-caddy.sh macos      # builds ./bin/caddy-l4-macos for this machine
#   bin/build-caddy.sh windows    # cross-compiles ./bin/caddy-l4-windows.exe (amd64)
#   bin/build-caddy.sh all        # builds both
#
# Bump these together when intentionally upgrading — caddy-l4 warns of
# breaking changes between releases, so pin rather than floating on @latest.
CADDY_VERSION="v2.11.4"
CADDY_L4_VERSION="v0.1.2"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v go >/dev/null 2>&1; then
	echo "error: Go toolchain not found. Install it (e.g. \`brew install go\`) before running this script." >&2
	exit 1
fi

XCADDY="$(go env GOPATH)/bin/xcaddy"
if [ ! -x "$XCADDY" ]; then
	echo "xcaddy not found, installing..."
	go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
fi

build_macos() {
	echo "Building macOS caddy-l4 binary ($CADDY_VERSION + caddy-l4@$CADDY_L4_VERSION)..."
	"$XCADDY" build "$CADDY_VERSION" \
		--with "github.com/mholt/caddy-l4@$CADDY_L4_VERSION" \
		--output "$SCRIPT_DIR/caddy-l4-macos"
	chmod +x "$SCRIPT_DIR/caddy-l4-macos"
	echo "-> $SCRIPT_DIR/caddy-l4-macos"
}

build_windows() {
	echo "Cross-compiling Windows caddy-l4 binary ($CADDY_VERSION + caddy-l4@$CADDY_L4_VERSION)..."
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 "$XCADDY" build "$CADDY_VERSION" \
		--with "github.com/mholt/caddy-l4@$CADDY_L4_VERSION" \
		--output "$SCRIPT_DIR/caddy-l4-windows.exe"
	echo "-> $SCRIPT_DIR/caddy-l4-windows.exe"
}

case "${1:-}" in
	macos) build_macos ;;
	windows) build_windows ;;
	all)
		build_macos
		build_windows
		;;
	*)
		echo "Usage: $0 {macos|windows|all}" >&2
		exit 1
		;;
esac
