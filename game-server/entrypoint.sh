#!/bin/bash
# Custom entrypoint for the PZ game server.
# Fixes volume permissions, applies config, optionally updates via SteamCMD,
# then launches the server in a screen session with auto-restart.

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
    exec su -p -s /bin/bash steam -- "$0" "$@"
fi

# --- Everything below runs as steam user ---

# Servername override from shared volume (written by the web UI/profile flows)
SERVERNAME_FILE="/home/steam/Zomboid/.servername"
if [ -f "$SERVERNAME_FILE" ]; then
    OVERRIDE_SERVERNAME=$(tr -d '\r\n' < "$SERVERNAME_FILE")
    if [ -n "$OVERRIDE_SERVERNAME" ]; then
        SERVERNAME="$OVERRIDE_SERVERNAME"
        export SERVERNAME
        echo "[entrypoint] Servername override: $SERVERNAME"
    fi
fi

STEAMCMD_BIN="${STEAMCMD_BIN:-$(command -v steamcmd || command -v steamcmd.sh || true)}"
if [ -z "$STEAMCMD_BIN" ]; then
    echo "[entrypoint] FATAL: SteamCMD executable not found in image."
    sleep infinity
    exit 1
fi

# Apply server configuration from environment variables
bash /home/steam/configure-server.sh

# Branch override from shared volume (written by web UI)
OVERRIDE_FILE="/home/steam/Zomboid/.steam_branch"
if [ -f "$OVERRIDE_FILE" ]; then
    BRANCH=$(cat "$OVERRIDE_FILE")
    echo "[entrypoint] Branch override: $BRANCH"
else
    BRANCH="${PZ_STEAM_BRANCH:-public}"
fi

if [ "$BRANCH" = "public" ]; then
    BETA_FLAG=""
else
    BETA_FLAG="-beta $BRANCH"
fi

# Force update flag from shared volume (written by web UI)
FORCE_FILE="/home/steam/Zomboid/.force_update"
if [ -f "$FORCE_FILE" ]; then
    echo "[entrypoint] Force update flag detected"
    rm -f "$FORCE_FILE"
    PZ_FORCE_UPDATE=true
fi

# Only run SteamCMD if server files are missing or update forced
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
