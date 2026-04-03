#!/bin/bash
set -e

echo "==> Updating apt..."
sudo apt-get update -y

echo "==> Installing base dependencies..."
sudo apt-get install -y \
    build-essential \
    cmake \
    git \
    libssl-dev \
    zlib1g-dev \
    nlohmann-json3-dev

# --- uSockets ---
if [ ! -f /usr/local/lib/libuSockets.a ]; then
    echo "==> Building uSockets from source..."
    rm -rf /tmp/uSockets
    git clone https://github.com/uNetworking/uSockets.git /tmp/uSockets
    cd /tmp/uSockets
    make WITH_SSL=1
    sudo cp libuSockets.a /usr/local/lib/
    sudo cp src/*.h /usr/local/include/
    cd -
    echo "==> uSockets installed"
else
    echo "==> uSockets already installed, skipping"
fi

# --- uWebSockets ---
if [ ! -d /usr/local/include/uWebSockets ]; then
    echo "==> Installing uWebSockets headers..."
    rm -rf /tmp/uWebSockets
    git clone https://github.com/uNetworking/uWebSockets.git /tmp/uWebSockets
    sudo mkdir -p /usr/local/include/uWebSockets
    sudo cp -r /tmp/uWebSockets/src/* /usr/local/include/uWebSockets/
    echo "==> uWebSockets installed"
else
    echo "==> uWebSockets already installed, skipping"
fi

echo ""
echo "==> All dependencies installed successfully"