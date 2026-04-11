#!/bin/bash
# Apply environment variables to server config files.
# Called by entrypoint.sh before server launch.
# All config comes from container env vars (derived from DB profile).

set -e

SERVER_DIR="/home/steam/Zomboid/Server"
INI_FILE="${SERVER_DIR}/${SERVERNAME}.ini"
BRIDGE_DIR="/home/steam/Zomboid/Lua"
BRIDGE_ENV_FILE="${BRIDGE_DIR}/bridge_env.json"

# Preserve previous console log before it gets overwritten by the new server process
CONSOLE_LOG="/home/steam/Zomboid/server-console.txt"
PREV_LOG="/home/steam/Zomboid/server-console.prev.txt"
if [ -f "$CONSOLE_LOG" ] && [ -s "$CONSOLE_LOG" ]; then
    cp "$CONSOLE_LOG" "$PREV_LOG"
    echo "[configure] Saved previous console log to server-console.prev.txt"
fi

ensure_ini_value() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" "$INI_FILE" 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${value}|" "$INI_FILE"
    else
        echo "${key}=${value}" >> "$INI_FILE"
    fi
}

ensure_ini_list_value() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" "$INI_FILE" 2>/dev/null; then
        local current
        current=$(sed -n "s/^${key}=//p" "$INI_FILE" | head -n 1)
        case ";${current};" in
            *";${value};"*)
                ;;
            *)
                if [ -n "$current" ]; then
                    sed -i "s|^${key}=.*|${key}=${current};${value}|" "$INI_FILE"
                else
                    sed -i "s|^${key}=.*|${key}=${value}|" "$INI_FILE"
                fi
                ;;
        esac
    else
        echo "${key}=${value}" >> "$INI_FILE"
    fi
}

json_escape() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Ensure directories exist
mkdir -p "$SERVER_DIR"
mkdir -p "$BRIDGE_DIR"

ZM_WORKSHOP_ID="3685323705"
ZM_SOURCE_DIR="${ZM_SOURCE_DIR:-/opt/ZomboidManager-source}"

# Detect the actual game install directory used by the image
# renegademaster uses /home/steam/pzserver, but BASE_GAME_DIR may vary
if [ -d "/home/steam/pzserver/steamapps" ]; then
    GAME_INSTALL_DIR="/home/steam/pzserver"
elif [ -d "/home/steam/ZomboidDedicatedServer/steamapps" ]; then
    GAME_INSTALL_DIR="/home/steam/ZomboidDedicatedServer"
else
    GAME_INSTALL_DIR="/home/steam/pzserver"
fi
ZM_WORKSHOP_DIR="${GAME_INSTALL_DIR}/steamapps/workshop/content/108600/${ZM_WORKSHOP_ID}/mods/ZomboidManager"

# Create a minimal ini so the local bridge mod can be enabled on first boot
if [ ! -f "$INI_FILE" ]; then
    echo "[configure] Creating initial ${SERVERNAME}.ini..."
    touch "$INI_FILE"
fi

BRIDGE_SERVER_NAME="${SERVERNAME:-servertest}"
BRIDGE_API_BASE_URL="${ZM_API_BASE_URL:-http://nitro-app:3000/api/mod}"
cat > "$BRIDGE_ENV_FILE" <<EOF
{"serverName":"$(json_escape "$BRIDGE_SERVER_NAME")","apiBaseUrl":"$(json_escape "$BRIDGE_API_BASE_URL")"}
EOF
echo "[configure] Wrote bridge environment file."

echo "[configure] Applying settings to ${SERVERNAME}.ini..."

if [ -n "${PZ_RCON_PORT:-}" ]; then
    ensure_ini_value "RCONPort" "${PZ_RCON_PORT}"
fi
if [ -n "${PZ_RCON_PASSWORD:-}" ]; then
    ensure_ini_value "RCONPassword" "${PZ_RCON_PASSWORD}"
fi

if [ -n "${PZ_GAME_PORT:-}" ]; then
    ensure_ini_value "DefaultPort" "${PZ_GAME_PORT}"
fi
if [ -n "${PZ_DIRECT_PORT:-}" ]; then
    ensure_ini_value "UDPPort" "${PZ_DIRECT_PORT}"
fi
if [ -n "${PZ_MAP_NAMES:-}" ]; then
    ensure_ini_value "Map" "${PZ_MAP_NAMES}"
fi
if [ -n "${PZ_MAX_PLAYERS:-}" ]; then
    ensure_ini_value "MaxPlayers" "${PZ_MAX_PLAYERS}"
fi
if [ -n "${PZ_PVP:-}" ]; then
    ensure_ini_value "PVP" "${PZ_PVP}"
fi

ensure_ini_value "DoLuaChecksum" "false"
ensure_ini_list_value "Mods" "ZomboidManager"
ensure_ini_list_value "WorkshopItems" "${ZM_WORKSHOP_ID}"

if [ -f "${ZM_SOURCE_DIR}/42/mod.info" ]; then
    mkdir -p "${ZM_WORKSHOP_DIR}/42"

    cp "${ZM_SOURCE_DIR}/42/mod.info" "${ZM_WORKSHOP_DIR}/mod.info"
    cp -R "${ZM_SOURCE_DIR}/42/." "${ZM_WORKSHOP_DIR}/42/"

    if [ -d "${ZM_SOURCE_DIR}/common" ]; then
        mkdir -p "${ZM_WORKSHOP_DIR}/common"
        cp -R "${ZM_SOURCE_DIR}/common/." "${ZM_WORKSHOP_DIR}/common/"
    fi

    echo "[configure] Installed ZomboidManager workshop cache (${ZM_WORKSHOP_ID})."
else
    echo "[configure] WARNING: ZomboidManager source mod.info not found at ${ZM_SOURCE_DIR}/42/mod.info"
fi

# Apply arbitrary INI overrides from PZ_INI_OVERRIDES env var.
# Format: "Key1=Value1\nKey2=Value2" (newline-separated key=value pairs)
if [ -n "${PZ_INI_OVERRIDES:-}" ]; then
    echo "[configure] Applying INI overrides from environment..."
    echo "$PZ_INI_OVERRIDES" | while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            ensure_ini_value "$key" "$value"
            echo "[configure]   $key=$value"
        fi
    done
fi

echo "[configure] Configuration applied."
