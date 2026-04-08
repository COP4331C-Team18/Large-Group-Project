#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
CONFIG="$PROJECT_ROOT/config/config.json"
BINARY="$BUILD_DIR/inksubserver"

echo "==> Project root: $PROJECT_ROOT"

# --- Preflight: verify deps are installed ---
MISSING=0
if [[ "$(uname)" == "Darwin" ]]; then
    BREW_PREFIX="$(brew --prefix 2>/dev/null || echo /opt/homebrew)"
    USOCKETS_LIB="$BREW_PREFIX/lib/libuSockets.a"
    UWS_HEADERS="$BREW_PREFIX/include/uWebSockets"
    DEPS_SCRIPT="scripts/install_deps_macos.sh"
else
    USOCKETS_LIB="/usr/local/lib/libuSockets.a"
    UWS_HEADERS="/usr/local/include/uWebSockets"
    DEPS_SCRIPT="scripts/install_deps_linux.sh"
fi

if [ ! -f "$USOCKETS_LIB" ]; then
    echo "[!] Missing: $USOCKETS_LIB — run $DEPS_SCRIPT first"
    MISSING=1
fi
if [ ! -d "$UWS_HEADERS" ]; then
    echo "[!] Missing: $UWS_HEADERS — run $DEPS_SCRIPT first"
    MISSING=1
fi
if [[ "$(uname)" == "Linux" ]]; then
    if ! dpkg -s libssl-dev libcurl4-openssl-dev zlib1g-dev >/dev/null 2>&1; then
        echo "[!] Missing apt packages (libssl-dev / libcurl4-openssl-dev / zlib1g-dev) — run $DEPS_SCRIPT first"
        MISSING=1
    fi
fi
if [ "$MISSING" -eq 1 ]; then exit 1; fi

# --- Create logs dir (required by systemd service ReadWritePaths) ---
mkdir -p "$PROJECT_ROOT/logs"

# --- Check config exists ---
if [ ! -f "$CONFIG" ]; then
    echo "[!] config/config.json not found"
    echo "[!] Creating a default config from example..."
    if [ -f "$PROJECT_ROOT/config/config.example.json" ]; then
        cp "$PROJECT_ROOT/config/config.example.json" "$CONFIG"
        echo "[!] Copied config.example.json — edit config/config.json before running in production"
    else
        cat > "$CONFIG" << 'EOF'
{
    "server": {
        "port": 9001,
        "host": "0.0.0.0",
        "max_connections": 1000,
        "idle_timeout": 120
    },
    "ssl": {
        "enabled": false,
        "cert": "",
        "key": ""
    },
    "node_api": {
        "url": "http://localhost:5001/api",
        "internal_secret": "REPLACE_ME"
    },
    "logging": {
        "level": "info",
        "file": ""
    },
    "env": "development"
}
EOF
        echo "[!] Default config created — set node_api.internal_secret before running"
    fi
fi

# --- Build ---
echo "==> Building inksubserver..."
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(sysctl -n hw.logicalcpu 2>/dev/null || nproc 2>/dev/null || echo 4)
cd "$PROJECT_ROOT"

# --- Run ---
echo "==> Starting inksubserver..."
echo ""
"$BINARY"
