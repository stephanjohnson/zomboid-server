#!/bin/bash
# Apply environment variables to server config files.
# Called by entrypoint.sh before server launch.

set -e

SERVER_DIR="/home/steam/Zomboid/Server"
INI_FILE="${SERVER_DIR}/${SERVERNAME}.ini"

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

# Ensure directories exist
mkdir -p "$SERVER_DIR"

ZM_WORKSHOP_ID="3685323705"
ZM_SOURCE_DIR="/home/steam/Zomboid/mods/ZomboidManager"
ZM_WORKSHOP_DIR="/home/steam/pzserver/steamapps/workshop/content/108600/${ZM_WORKSHOP_ID}/mods/ZomboidManager"

# Create a minimal ini so the local bridge mod can be enabled on first boot
if [ ! -f "$INI_FILE" ]; then
    echo "[configure] Creating initial ${SERVERNAME}.ini..."
    touch "$INI_FILE"
fi

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

echo "[configure] Configuration applied."
