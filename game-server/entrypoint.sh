#!/bin/bash
# Custom entrypoint for the PZ game server.
# All configuration comes from environment variables set at container creation.
# The web app creates containers with env vars derived from the DB profile.
# No disk-based control files are used.

set -e

# --- Root-only init: fix volume permissions, then re-exec as steam ---
if [ "$(id -u)" = "0" ]; then
    echo "[entrypoint] Running as root — fixing volume ownership..."
    chown steam:steam /home/steam/Zomboid 2>/dev/null || true
    chown -R steam:steam /home/steam/Zomboid/Lua 2>/dev/null || true
    chown -R steam:steam /home/steam/Zomboid/mods 2>/dev/null || true
    chown -R steam:steam /home/steam/Zomboid/Server 2>/dev/null || true
    chown steam:steam /home/steam/Zomboid/db 2>/dev/null || true
    chown steam:steam /home/steam/Zomboid/Saves 2>/dev/null || true
    chmod -R 1777 /home/steam/Zomboid/Lua 2>/dev/null || true
    echo "[entrypoint] Dropping to steam user..."
    exec env HOME=/home/steam su -p -s /bin/bash steam -- "$0" "$@"
fi

# --- Everything below runs as steam user ---
# All config comes from env vars (SERVERNAME, PZ_STEAM_BRANCH, PZ_FORCE_UPDATE, etc.)

STEAMCMD_BIN="${STEAMCMD_BIN:-$(command -v steamcmd || command -v steamcmd.sh || true)}"
if [ -z "$STEAMCMD_BIN" ]; then
    echo "[entrypoint] FATAL: SteamCMD executable not found in image."
    sleep infinity
    exit 1
fi

# Apply server configuration from environment variables
bash /home/steam/configure-server.sh

# Determine steam branch from env
BRANCH="${PZ_STEAM_BRANCH:-public}"
if [ "$BRANCH" = "public" ]; then
    BETA_FLAG=""
else
    BETA_FLAG="-beta $BRANCH"
fi

# Only run SteamCMD if server files are missing or update forced via env
if [ ! -f /home/steam/pzserver/start-server.sh ] || [ "${PZ_FORCE_UPDATE:-false}" = "true" ]; then
    echo "[entrypoint] Installing/updating PZ server (branch: $BRANCH)..."
    for attempt in 1 2 3; do
        "$STEAMCMD_BIN" \
            +@sSteamCmdForcePlatformType linux \
            +force_install_dir /home/steam/pzserver \
            +login anonymous \
            +app_update 380870 $BETA_FLAG validate \
            +quit && break
        echo "[entrypoint] SteamCMD failed (attempt $attempt/3), retrying in 10s..."
        sleep 10
    done
    if [ ! -f /home/steam/pzserver/start-server.sh ]; then
        echo "[entrypoint] FATAL: SteamCMD failed after 3 attempts."
        echo "[entrypoint] Container will stay alive for debugging."
        sleep infinity
        exit 1
    fi
else
    echo "[entrypoint] Server files found, skipping SteamCMD."
fi

# Build server start arguments
SERVER_ARGS="-servername ${SERVERNAME}"
if [ -n "${PZ_ADMIN_PASSWORD:-}" ]; then
    SERVER_ARGS="${SERVER_ARGS} -adminpassword ${PZ_ADMIN_PASSWORD}"
fi

# Launch the server in a screen session with auto-restart loop
screen -d -m -S zomboid /bin/bash -c " \
    while true; do \
        /home/steam/pzserver/start-server.sh ${SERVER_ARGS}; \
        echo 'Server will restart in 10 seconds...'; \
        for i in 10 9 8 7 6 5 4 3 2 1; do echo \"\$i...\"; sleep 1; done \
    done \
"
sleep infinity
