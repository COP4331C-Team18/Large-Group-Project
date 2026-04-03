#!/bin/bash
set -e

# --- CONFIG ---
SERVER_USER="ubuntu"
SERVER_IP="your.server.ip"
SERVER_DIR="/opt/inksubserver"
SSH_KEY="$HOME/.ssh/your_key.pem"
SERVICE_NAME="inksubserver"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- COLORS ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# --- PREFLIGHT ---
info "Starting deployment of inksubserver"
info "Target: $SERVER_USER@$SERVER_IP:$SERVER_DIR"

if [ ! -f "$SSH_KEY" ]; then
    error "SSH key not found at $SSH_KEY"
fi

# --- PREPARE SERVER DIRS ---
info "Preparing server directories..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" \
    "mkdir -p $SERVER_DIR/src/Cpp $SERVER_DIR/src/Headers $SERVER_DIR/config $SERVER_DIR/logs $SERVER_DIR/certs $SERVER_DIR/build"

# --- INSTALL DEPS ON SERVER ---
info "Installing dependencies on server..."
scp -i "$SSH_KEY" \
    "$PROJECT_ROOT/scripts/install_deps.sh" \
    "$SERVER_USER@$SERVER_IP:/tmp/install_deps.sh"
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" \
    "chmod +x /tmp/install_deps.sh && /tmp/install_deps.sh"

# --- PUSH SOURCE ---
info "Pushing source to server..."
scp -i "$SSH_KEY" \
    "$PROJECT_ROOT/CMakeLists.txt" \
    "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"

scp -i "$SSH_KEY" \
    "$PROJECT_ROOT/src/Cpp/main.cpp" \
    "$PROJECT_ROOT/src/Cpp/Link.cpp" \
    "$SERVER_USER@$SERVER_IP:$SERVER_DIR/src/Cpp/"

scp -i "$SSH_KEY" \
    "$PROJECT_ROOT/src/Headers/Link.h" \
    "$SERVER_USER@$SERVER_IP:$SERVER_DIR/src/Headers/"

# --- PUSH CONFIG ---
if [ ! -f "$PROJECT_ROOT/config/config.json" ]; then
    warn "config/config.json not found locally — skipping"
    warn "Make sure it exists on the server at $SERVER_DIR/config/config.json"
else
    warn "Pushing config/config.json — ensure it has production values"
    scp -i "$SSH_KEY" \
        "$PROJECT_ROOT/config/config.json" \
        "$SERVER_USER@$SERVER_IP:$SERVER_DIR/config/config.json"
fi

# --- BUILD ON SERVER ---
info "Building on server (Linux/Release)..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
    cd /opt/inksubserver
    mkdir -p build && cd build
    cmake .. -DCMAKE_BUILD_TYPE=Release
    make -j$(nproc)
    echo "==> Build complete"
EOF

# --- INSTALL & RESTART SERVICE ---
info "Installing systemd service..."
scp -i "$SSH_KEY" \
    "$PROJECT_ROOT/$SERVICE_NAME.service" \
    "$SERVER_USER@$SERVER_IP:/tmp/$SERVICE_NAME.service"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << EOF
    sudo cp /tmp/$SERVICE_NAME.service /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME
    sudo systemctl restart $SERVICE_NAME
    sleep 2
    sudo systemctl status $SERVICE_NAME --no-pager
EOF

# --- DONE ---
echo ""
info "Deployment complete"
info "Binary:  $SERVER_DIR/build/inksubserver"
info "Service: systemctl status $SERVICE_NAME"
info "Logs:    journalctl -u $SERVICE_NAME -f"