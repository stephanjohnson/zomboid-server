#!/bin/bash
# Wrapper entrypoint for the renegademaster/zomboid-dedicated-server image.
# Patches run_server.sh to run configure-server.sh AFTER SteamCMD validate
# but BEFORE start_server, then delegates to the image's own run_server.sh.
#
# ZomboidManager is loaded as a proper PZ mod via Workshop cache (added to
# Mods=/WorkshopItems= by configure-server.sh). Source files are mounted
# read-only at /opt/ZomboidManager-source by the compose file.

set -e

# --- Root-only init: fix volume permissions ---
# The renegademaster image runs as root natively.
if [ "$(id -u)" = "0" ]; then
    echo "[entrypoint] Fixing volume permissions..."
    mkdir -p /home/steam/Zomboid/mods
    mkdir -p /home/steam/Zomboid/Lua
    mkdir -p /home/steam/Zomboid/Server
    mkdir -p /home/steam/Zomboid/db
    mkdir -p /home/steam/Zomboid/Saves
    chmod -R 1777 /home/steam/Zomboid/Lua 2>/dev/null || true
    chmod 777 /home/steam/Zomboid/Server 2>/dev/null || true
    chmod 777 /home/steam/Zomboid/db 2>/dev/null || true
    chmod 777 /home/steam/Zomboid/Saves 2>/dev/null || true
fi

CONFIGURE_SCRIPT="/home/steam/configure-server.sh"

# Clean up previously injected ZM files from base game dir.
# ZomboidManager is loaded from Workshop cache, not the base game directory.
for dir in /home/steam/ZomboidDedicatedServer/media/lua/server /home/steam/ZomboidDedicatedServer/media/lua/client; do
    if ls "$dir"/ZM_*.lua 1>/dev/null 2>&1; then
        rm -f "$dir"/ZM_*.lua
        echo "[entrypoint] Cleaned up old injected ZM files from $dir"
    fi
done

# Remove any stale ZomboidManager from install dir (shadows Workshop version)
rm -rf /home/steam/ZomboidDedicatedServer/mods/ZomboidManager

# Patch run_server.sh to run configure-server.sh before server launch
if [ -f "$CONFIGURE_SCRIPT" ] && [ -f /home/steam/run_server.sh ] && ! grep -q "configure-server.sh" /home/steam/run_server.sh; then
    sed -i '/^start_server$/i bash '"$CONFIGURE_SCRIPT" /home/steam/run_server.sh
    echo "[entrypoint] Patched run_server.sh to run configure-server.sh before start"
fi

# Prevent renegademaster image from overwriting Mods=/WorkshopItems= with empty values.
# When these env vars are set to "" the image clears mods added via the web UI.
if [ -z "${MOD_NAMES:-}" ]; then
    unset MOD_NAMES
fi
if [ -z "${MOD_WORKSHOP_IDS:-}" ]; then
    unset MOD_WORKSHOP_IDS
fi

if [ ! -f /home/steam/run_server.sh ]; then
    echo "[entrypoint] ERROR: /home/steam/run_server.sh not found."
    echo "[entrypoint] This entrypoint requires the renegademaster/zomboid-dedicated-server image."
    echo "[entrypoint] Check that GAME_SERVER_IMAGE is set correctly and recreate the container."
    exit 1
fi

exec /home/steam/run_server.sh
