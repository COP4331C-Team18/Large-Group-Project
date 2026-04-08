#!/bin/bash
set -e

echo "==> Updating apt..."
sudo apt-get update -y

echo "==> Installing base dependencies..."
sudo apt-get install -y \
    build-essential \
    cmake \
    git \
    pkg-config \
    libssl-dev \
    zlib1g-dev \
    libcurl4-openssl-dev \
    nlohmann-json3-dev

# --- Verify cmake >= 3.20 (Ubuntu 20.04 ships 3.16 which is too old) ---
CMAKE_VERSION=$(cmake --version | head -n1 | awk '{print $3}')
CMAKE_MAJOR=$(echo "$CMAKE_VERSION" | cut -d. -f1)
CMAKE_MINOR=$(echo "$CMAKE_VERSION" | cut -d. -f2)
if [ "$CMAKE_MAJOR" -lt 3 ] || { [ "$CMAKE_MAJOR" -eq 3 ] && [ "$CMAKE_MINOR" -lt 20 ]; }; then
    echo "==> cmake $CMAKE_VERSION is too old (need >= 3.20), upgrading from Kitware..."
    sudo apt-get install -y gpg wget
    wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | \
        gpg --dearmor - | sudo tee /usr/share/keyrings/kitware-archive-keyring.gpg >/dev/null
    CODENAME=$(. /etc/os-release && echo "$UBUNTU_CODENAME")
    echo "deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ $CODENAME main" | \
        sudo tee /etc/apt/sources.list.d/kitware.list
    sudo apt-get update -y
    sudo apt-get install -y cmake
    echo "==> cmake $(cmake --version | head -n1) installed"
else
    echo "==> cmake $CMAKE_VERSION OK"
fi

# --- uSockets ---
# NOTE: Must use WITH_OPENSSL=1 (not WITH_SSL=1) — that is the actual Makefile flag.
# The .a must be present before CMake runs or the build will fail at link time.
if [ ! -f /usr/local/lib/libuSockets.a ]; then
    echo "==> Building uSockets from source..."
    rm -rf /tmp/uSockets
    git clone --depth 1 https://github.com/uNetworking/uSockets.git /tmp/uSockets
    cd /tmp/uSockets
    make WITH_OPENSSL=1
    sudo cp libuSockets.a /usr/local/lib/
    sudo cp src/*.h /usr/local/include/
    cd -
    echo "==> uSockets installed"
else
    echo "==> uSockets already installed, skipping"
fi

# --- uWebSockets (header-only) ---
if [ ! -d /usr/local/include/uWebSockets ]; then
    echo "==> Installing uWebSockets headers..."
    rm -rf /tmp/uWebSockets
    git clone --depth 1 https://github.com/uNetworking/uWebSockets.git /tmp/uWebSockets
    sudo mkdir -p /usr/local/include/uWebSockets
    sudo cp -r /tmp/uWebSockets/src/* /usr/local/include/uWebSockets/
    echo "==> uWebSockets installed"
else
    echo "==> uWebSockets already installed, skipping"
fi

echo ""
echo "==> All dependencies installed. Run scripts/deploy_linux.sh to build and install inksubserver."
