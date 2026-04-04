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

echo "[configure] Configuration applied."
