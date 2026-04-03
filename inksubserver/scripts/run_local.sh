#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
CONFIG="$PROJECT_ROOT/config/config.json"
BINARY="$BUILD_DIR/inksubserver"

echo "==> Project root: $PROJECT_ROOT"

# --- Check config exists ---
if [ ! -f "$CONFIG" ]; then
    echo "[!] config/config.json not found"
    echo "[!] Creating a default local config..."
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
    "logging": {
        "level": "info",
        "file": ""
    },
    "env": "development"
}
EOF
    echo "[!] Default config created at config/config.json"
fi

# --- Build ---
echo "==> Building inksubserver..."
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"
cmake .. -DCMAKE_BUILD_TYPE=Debug
make -j$(sysctl -n hw.logicalcpu 2>/dev/null || nproc)
cd "$PROJECT_ROOT"

# --- Run ---
echo "==> Starting inksubserver..."
echo ""
"$BINARY"