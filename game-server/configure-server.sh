#!/bin/bash
# Apply environment variables to server config files.
# Called by entrypoint.sh before server launch.

set -e

SERVER_DIR="/home/steam/Zomboid/Server"
INI_FILE="${SERVER_DIR}/${SERVERNAME}.ini"

# Ensure directories exist
mkdir -p "$SERVER_DIR"

# Only configure if ini exists (first run creates it on server start)
if [ -f "$INI_FILE" ]; then
    echo "[configure] Applying settings to ${SERVERNAME}.ini..."

    # RCON settings
    if [ -n "${PZ_RCON_PORT:-}" ]; then
        sed -i "s/^RCONPort=.*/RCONPort=${PZ_RCON_PORT}/" "$INI_FILE"
    fi
    if [ -n "${PZ_RCON_PASSWORD:-}" ]; then
        sed -i "s/^RCONPassword=.*/RCONPassword=${PZ_RCON_PASSWORD}/" "$INI_FILE"
    fi

    # Game ports
    if [ -n "${PZ_GAME_PORT:-}" ]; then
        sed -i "s/^DefaultPort=.*/DefaultPort=${PZ_GAME_PORT}/" "$INI_FILE"
    fi

    # Disable Lua checksum for custom mods
    sed -i "s/^DoLuaChecksum=.*/DoLuaChecksum=false/" "$INI_FILE"

    echo "[configure] Configuration applied."
else
    echo "[configure] No ini file found — will be created on first server start."
fi
