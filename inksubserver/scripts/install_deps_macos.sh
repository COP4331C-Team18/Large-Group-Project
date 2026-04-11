#!/bin/bash
set -e

# macOS dependency installer for inksubserver
# Requires Homebrew: https://brew.sh

if ! command -v brew &>/dev/null; then
    echo "[!] Homebrew not found. Install it from https://brew.sh"
    exit 1
fi

HOMEBREW_PREFIX="$(brew --prefix)"
OPENSSL_PREFIX="$(brew --prefix openssl 2>/dev/null || echo "$HOMEBREW_PREFIX/opt/openssl")"

echo "==> Homebrew prefix: $HOMEBREW_PREFIX"
echo "==> Installing base dependencies via Homebrew..."
brew install cmake openssl zlib nlohmann-json

# --- uSockets ---
if [ ! -f "$HOMEBREW_PREFIX/lib/libuSockets.a" ]; then
    echo "==> Building uSockets from source (WITH_SSL=1)..."
    rm -rf /tmp/uSockets
    git clone https://github.com/uNetworking/uSockets.git /tmp/uSockets
    cd /tmp/uSockets
    make WITH_OPENSSL=1 \
        CFLAGS="-I$HOMEBREW_PREFIX/include -I$OPENSSL_PREFIX/include" \
        LDFLAGS="-L$HOMEBREW_PREFIX/lib -L$OPENSSL_PREFIX/lib"
    sudo cp uSockets.a "$HOMEBREW_PREFIX/lib/libuSockets.a"
    sudo cp src/*.h "$HOMEBREW_PREFIX/include/"
    cd -
    echo "==> uSockets installed"
else
    echo "==> uSockets already installed, skipping"
fi

# --- uWebSockets ---
if [ ! -d "$HOMEBREW_PREFIX/include/uWebSockets" ]; then
    echo "==> Installing uWebSockets headers..."
    rm -rf /tmp/uWebSockets
    git clone https://github.com/uNetworking/uWebSockets.git /tmp/uWebSockets
    sudo mkdir -p "$HOMEBREW_PREFIX/include/uWebSockets"
    sudo cp -r /tmp/uWebSockets/src/* "$HOMEBREW_PREFIX/include/uWebSockets/"
    echo "==> uWebSockets installed"
else
    echo "==> uWebSockets already installed, skipping"
fi

echo ""
echo "==> All dependencies installed. Run: bash scripts/run_local.sh"
