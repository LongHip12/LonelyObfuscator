#!/bin/bash

set -e

echo "=== Lonely Obfuscator Setup ==="

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "alpine" ]]; then
            OS="alpine"
        fi
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
else
    OS="unknown"
fi

echo "[*] Detected OS: $OS"

echo "[*] Installing Lua 5.1..."

case $OS in
    linux)
        if command -v apt-get &> /dev/null; then
            apt-get update
            apt-get install -y lua5.1 luac
        elif command -v dnf &> /dev/null; then
            dnf install -y lua luac
        elif command -v yum &> /dev/null; then
            yum install -y lua luac
        elif command -v pacman &> /dev/null; then
            pacman -S lua
        else
            echo "[!] Could not detect package manager"
            exit 1
        fi
        ;;
    alpine)
        apk add --no-cache lua5.1
        ;;
    macos)
        if ! command -v brew &> /dev/null; then
            echo "[!] Homebrew not found. Install from https://brew.sh"
            exit 1
        fi
        brew install lua@5.1
        ;;
    windows)
        echo "[!] Windows detected. Download Lua from:"
        echo "    https://sourceforge.net/projects/luabinaries/"
        echo "    Extract and add to PATH"
        exit 1
        ;;
    *)
        echo "[!] Unknown OS. Please install Lua 5.1 manually"
        exit 1
        ;;
esac

echo "[✓] Lua installed"

if ! command -v luac &> /dev/null; then
    echo "[!] luac still not found in PATH"
    exit 1
fi
echo "[✓] luac found: $(which luac)"

echo "[*] Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "[!] pnpm/npm not found"
    exit 1
fi
echo "[✓] Dependencies installed"

echo "[*] Starting server..."
node server.js
