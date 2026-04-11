#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# inksubserver — server-side setup script
# Run this ON the Ubuntu/Debian droplet after cloning the repo.
#
# Usage:
#   git clone <your-repo-url>
#   cd Large-Group-Project/inksubserver
#   chmod +x scripts/setup_server.sh
#   sudo scripts/setup_server.sh
#
# What it does:
#   1. Installs all system dependencies (build tools, OpenSSL, curl, uSockets, uWS)
#   2. Builds the binary in Release mode
#   3. Installs everything to /opt/inksubserver
#   4. Creates config/config.json if missing (prompts for critical values)
#   5. Installs and starts the inksubserver systemd service
# ─────────────────────────────────────────────────────────────────────────────
set -e

# ── Must be run as root ───────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    echo "[x] Please run as root: sudo scripts/setup_server.sh"
    exit 1
fi

# ── Resolve paths ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_DIR="/opt/inksubserver"
SERVICE_NAME="inksubserver"
SERVICE_FILE="$PROJECT_ROOT/$SERVICE_NAME.service"
BUILD_DIR="$PROJECT_ROOT/build"
BINARY="$BUILD_DIR/$SERVICE_NAME"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}==>${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; exit 1; }
step()  { echo -e "\n${GREEN}━━━ $* ━━━${NC}"; }

# ─────────────────────────────────────────────────────────────────────────────
step "1 / 6  System dependencies"
# ─────────────────────────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y \
    build-essential \
    cmake \
    git \
    pkg-config \
    libssl-dev \
    zlib1g-dev \
    libcurl4-openssl-dev \
    nlohmann-json3-dev

# Upgrade cmake if the distro ships a version < 3.20
CMAKE_VER=$(cmake --version | head -n1 | awk '{print $3}')
CMAKE_MAJ=$(echo "$CMAKE_VER" | cut -d. -f1)
CMAKE_MIN=$(echo "$CMAKE_VER" | cut -d. -f2)
if [ "$CMAKE_MAJ" -lt 3 ] || { [ "$CMAKE_MAJ" -eq 3 ] && [ "$CMAKE_MIN" -lt 20 ]; }; then
    warn "cmake $CMAKE_VER is too old (need >= 3.20), upgrading from Kitware PPA..."
    apt-get install -y gpg wget
    wget -qO- https://apt.kitware.com/keys/kitware-archive-latest.asc | \
        gpg --dearmor > /usr/share/keyrings/kitware-archive-keyring.gpg
    CODENAME=$(. /etc/os-release && echo "$UBUNTU_CODENAME")
    echo "deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ $CODENAME main" \
        > /etc/apt/sources.list.d/kitware.list
    apt-get update -y
    apt-get install -y cmake
    info "cmake $(cmake --version | head -n1) installed"
else
    info "cmake $CMAKE_VER OK"
fi

# ── uSockets (static library) ─────────────────────────────────────────────────
if [ ! -f /usr/local/lib/libuSockets.a ]; then
    info "Building uSockets from source..."
    rm -rf /tmp/uSockets
    git clone --depth 1 https://github.com/uNetworking/uSockets.git /tmp/uSockets
    cd /tmp/uSockets
    make WITH_OPENSSL=1
    cp libuSockets.a /usr/local/lib/
    cp src/*.h /usr/local/include/
    cd "$PROJECT_ROOT"
    info "uSockets installed"
else
    info "uSockets already present, skipping"
fi

# ── uWebSockets (header-only) ─────────────────────────────────────────────────
if [ ! -d /usr/local/include/uWebSockets ]; then
    info "Installing uWebSockets headers..."
    rm -rf /tmp/uWebSockets
    git clone --depth 1 https://github.com/uNetworking/uWebSockets.git /tmp/uWebSockets
    mkdir -p /usr/local/include/uWebSockets
    cp -r /tmp/uWebSockets/src/* /usr/local/include/uWebSockets/
    info "uWebSockets installed"
else
    info "uWebSockets headers already present, skipping"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "2 / 6  Build (Release)"
# ─────────────────────────────────────────────────────────────────────────────
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j"$(nproc)"
cd "$PROJECT_ROOT"
info "Binary built: $BINARY"

# ─────────────────────────────────────────────────────────────────────────────
step "3 / 6  Install to $INSTALL_DIR"
# ─────────────────────────────────────────────────────────────────────────────
mkdir -p \
    "$INSTALL_DIR/build" \
    "$INSTALL_DIR/config" \
    "$INSTALL_DIR/logs" \
    "$INSTALL_DIR/certs"

# Copy binary
cp "$BINARY" "$INSTALL_DIR/build/inksubserver"
chmod 755 "$INSTALL_DIR/build/inksubserver"
info "Binary installed to $INSTALL_DIR/build/inksubserver"

# ─────────────────────────────────────────────────────────────────────────────
step "4 / 6  Configure"
# ─────────────────────────────────────────────────────────────────────────────
CONFIG="$INSTALL_DIR/config/config.json"

if [ -f "$CONFIG" ]; then
    warn "config.json already exists at $CONFIG — skipping (edit manually if needed)"
else
    # If the user has a filled-in config in the repo, copy it
    if [ -f "$PROJECT_ROOT/config/config.json" ]; then
        cp "$PROJECT_ROOT/config/config.json" "$CONFIG"
        warn "Copied repo config.json — verify production values in $CONFIG"
    else
        # Interactive prompts for the two values that MUST be set
        echo ""
        warn "No config.json found. Enter the required values:"

        read -rp "  Node.js API URL       [http://localhost:5001/api]: " API_URL
        API_URL="${API_URL:-http://localhost:5001/api}"

        read -rp "  Internal secret (INTERNAL_SECRET from server .env): " INTERNAL_SECRET
        if [ -z "$INTERNAL_SECRET" ]; then
            error "internal_secret cannot be empty — the C++ server uses it to authenticate with Node.js"
        fi

        cat > "$CONFIG" << EOF
{
    "server": {
        "port": 9001,
        "host": "0.0.0.0",
        "max_connections": 1000,
        "idle_timeout": 120
    },
    "ssl": {
        "enabled": false,
        "cert": "/opt/inksubserver/certs/cert.pem",
        "key": "/opt/inksubserver/certs/key.pem"
    },
    "node_api": {
        "url": "$API_URL",
        "internal_secret": "$INTERNAL_SECRET"
    },
    "logging": {
        "level": "info",
        "file": "/opt/inksubserver/logs/server.log"
    },
    "env": "production"
}
EOF
        info "config.json written to $CONFIG"
    fi
fi

# Ownership — service runs as ubuntu (or first non-root user if ubuntu doesn't exist)
if id ubuntu &>/dev/null; then
    SERVICE_USER="ubuntu"
else
    # Fallback: first non-root user with a home dir
    SERVICE_USER=$(getent passwd | awk -F: '$3 >= 1000 && $7 !~ /nologin|false/ {print $1; exit}')
    if [ -z "$SERVICE_USER" ]; then
        SERVICE_USER="root"
        warn "No normal user found — service will run as root (not ideal, consider adding a dedicated user)"
    fi
fi
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
info "Install dir owned by $SERVICE_USER"

# ─────────────────────────────────────────────────────────────────────────────
step "5 / 6  Systemd service"
# ─────────────────────────────────────────────────────────────────────────────
# Patch the User/Group in the service file to match the actual service user
PATCHED_SERVICE="/tmp/$SERVICE_NAME.service"
sed "s/^User=.*/User=$SERVICE_USER/; s/^Group=.*/Group=$SERVICE_USER/" \
    "$SERVICE_FILE" > "$PATCHED_SERVICE"

cp "$PATCHED_SERVICE" "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    info "Service is running"
else
    error "Service failed to start — check: journalctl -u $SERVICE_NAME -n 50"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "6 / 6  Firewall (ufw)"
# ─────────────────────────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
    if ufw status | grep -q "Status: active"; then
        ufw allow 9001/tcp comment "inksubserver WebSocket"
        info "ufw: port 9001 opened"
    else
        warn "ufw is installed but not active — skipping port rule (run 'ufw allow 9001/tcp' manually if you enable it)"
    fi
else
    warn "ufw not found — make sure port 9001 is open in your Digital Ocean firewall / droplet settings"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo ""
info "Setup complete!"
echo ""
echo "  Binary  : $INSTALL_DIR/build/inksubserver"
echo "  Config  : $INSTALL_DIR/config/config.json"
echo "  Logs    : journalctl -u $SERVICE_NAME -f"
echo "  Status  : systemctl status $SERVICE_NAME"
echo ""
warn "Next steps:"
echo "  1. Review $INSTALL_DIR/config/config.json"
echo "     — set node_api.url to your Node.js API (e.g. http://<droplet-private-ip>:5001/api)"
echo "     — confirm node_api.internal_secret matches INTERNAL_SECRET in your server .env"
echo "  2. If using SSL, set ssl.enabled=true and place certs in $INSTALL_DIR/certs/"
echo "  3. Restart after any config change: systemctl restart $SERVICE_NAME"
