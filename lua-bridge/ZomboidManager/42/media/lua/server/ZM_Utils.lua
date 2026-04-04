require("ZM_JSON")

ZM_Utils = {}

local API_TELEMETRY_URL = "http://nitro-app:3000/api/mod/telemetry"
local API_CONFIG_URL = "http://nitro-app:3000/api/mod/config"
local TEMP_UPLOAD_PATH = "/home/steam/Zomboid/Lua/bridge_payload.json"
local TEMP_CONFIG_PATH = "/home/steam/Zomboid/Lua/bridge_config.json"

local DEFAULT_CONFIG = {
    refreshSeconds = 60,
    listeners = {
        ["pz.player_snapshot"] = {
            enabled = true,
            snapshotIntervalMinutes = 12,
            inventoryIntervalMinutes = 48,
            gameStateIntervalMinutes = 24,
        },
        ["pz.pvp_kill_tracker"] = {
            enabled = true,
        },
        ["pz.item_found"] = {
            enabled = true,
            config = {},
        },
        ["pz.build_action"] = {
            enabled = true,
            config = {
                actions = { "build" },
            },
        },
    },
}

local runtimeConfig = DEFAULT_CONFIG
local lastConfigFetchAt = 0

function ZM_Utils.getTimestamp()
    local cal = Calendar.getInstance()
    return string.format(
        "%04d-%02d-%02dT%02d:%02d:%02dZ",
        cal:get(Calendar.YEAR),
        cal:get(Calendar.MONTH) + 1,
        cal:get(Calendar.DAY_OF_MONTH),
        cal:get(Calendar.HOUR_OF_DAY),
        cal:get(Calendar.MINUTE),
        cal:get(Calendar.SECOND)
    )
end

local function safeCall(fn, fallback)
    local ok, value = pcall(fn)
    if ok then
        return value
    end
    return fallback
end

local function urlEncode(value)
    return tostring(value):gsub("([^%w%-_%.~])", function(char)
        return string.format("%%%02X", string.byte(char))
    end)
end

local function readFile(path)
    local file = io.open(path, "r")
    if not file then
        return nil
    end

    local content = file:read("*a")
    file:close()
    return content
end

local function getServerName()
    return os.getenv("SERVERNAME") or "servertest"
end

local function getUnixTime()
    return os.time()
end

function ZM_Utils.sanitizeJsonValue(value, depth)
    local currentDepth = depth or 0
    if currentDepth > 3 then
        return tostring(value)
    end

    local valueType = type(value)
    if valueType == "nil" or valueType == "boolean" or valueType == "number" or valueType == "string" then
        return value
    end

    if valueType ~= "table" then
        return tostring(value)
    end

    local sanitized = {}
    for key, innerValue in pairs(value) do
        sanitized[tostring(key)] = ZM_Utils.sanitizeJsonValue(innerValue, currentDepth + 1)
    end
    return sanitized
end

function ZM_Utils.collectSkills(player)
    local skills = {}
    local perkList = PerkFactory and PerkFactory.PerkList
    if not perkList then
        return skills
    end

    for index = 0, perkList:size() - 1 do
        local perk = perkList:get(index)
        if perk then
            local level = safeCall(function()
                return player:getPerkLevel(perk)
            end, 0)
            if level and level > 0 then
                local name = safeCall(function()
                    return perk:getName()
                end, tostring(perk))
                skills[tostring(name)] = level
            end
        end
    end

    return skills
end

local function serializeInventoryItem(item, containerName, primaryItem, secondaryItem)
    return {
        fullType = safeCall(function() return item:getFullType() end, "unknown"),
        count = 1,
        equipped = (primaryItem and item == primaryItem) or (secondaryItem and item == secondaryItem) or false,
        container = containerName or "inventory",
    }
end

function ZM_Utils.collectInventory(player)
    local inventoryData = {}
    local inventory = player:getInventory()
    if not inventory then
        return inventoryData
    end

    local primaryItem = player:getPrimaryHandItem()
    local secondaryItem = player:getSecondaryHandItem()

    local items = inventory:getItems()
    if items then
        for index = 0, items:size() - 1 do
            local item = items:get(index)
            if item then
                table.insert(inventoryData, serializeInventoryItem(item, "inventory", primaryItem, secondaryItem))
            end
        end
    end

    local backpack = player:getClothingItem_Back()
    if backpack and backpack:getItemContainer() then
        local bagItems = backpack:getItemContainer():getItems()
        local bagName = safeCall(function() return backpack:getName() end, "backpack")
        if bagItems then
            for index = 0, bagItems:size() - 1 do
                local item = bagItems:get(index)
                if item then
                    table.insert(inventoryData, serializeInventoryItem(item, bagName, primaryItem, secondaryItem))
                end
            end
        end
    end

    return inventoryData
end

function ZM_Utils.collectPlayerSnapshot(player, includeInventory)
    local username = safeCall(function() return player:getUsername() end, nil)
    if not username or username == "" then
        return nil
    end

    local snapshot = {
        username = username,
        x = safeCall(function() return math.floor((player:getX() or 0) * 10) / 10 end, 0),
        y = safeCall(function() return math.floor((player:getY() or 0) * 10) / 10 end, 0),
        z = safeCall(function() return math.floor(player:getZ() or 0) end, 0),
        isDead = safeCall(function() return player:isDead() end, false),
        isGhost = safeCall(function() return player:isGhostMode() end, false),
        zombieKills = safeCall(function() return player:getZombieKills() end, 0),
        hoursSurvived = safeCall(function() return player:getHoursSurvived() end, 0),
        profession = nil,
        skills = ZM_Utils.collectSkills(player),
    }

    local descriptor = safeCall(function() return player:getDescriptor() end, nil)
    if descriptor and descriptor.getProfession then
        snapshot.profession = safeCall(function() return descriptor:getProfession() end, nil)
    end

    if includeInventory then
        snapshot.inventory = ZM_Utils.collectInventory(player)
    end

    return snapshot
end

function ZM_Utils.collectGameState()
    local gt = getGameTime and getGameTime() or nil
    if not gt then
        return nil
    end

    local timeData = {
        year = safeCall(function() return gt:getYear() end, 0),
        month = safeCall(function() return gt:getMonth() end, 0) + 1,
        day = safeCall(function() return gt:getDay() end, 0) + 1,
        hour = safeCall(function() return gt:getHour() end, 0),
        minute = safeCall(function() return gt:getMinutes() end, 0),
    }

    local weatherData = nil
    local climateManager = safeCall(getClimateManager, nil)
    if climateManager then
        weatherData = {
            temperature = safeCall(function() return climateManager:getTemperature() end, 0),
            rainIntensity = safeCall(function() return climateManager:getRainIntensity() end, 0),
            fogIntensity = safeCall(function() return climateManager:getFogIntensity() end, 0),
            windIntensity = safeCall(function() return climateManager:getWindIntensity() end, 0),
            snowIntensity = safeCall(function() return climateManager:getSnowIntensity() end, 0),
        }
    end

    return {
        time = timeData,
        season = safeCall(function() return gt:getSeasonName() end, nil),
        weather = weatherData,
        gameVersion = safeCall(function() return getCore():getVersion() end, nil),
    }
end

function ZM_Utils.postTelemetry(payload)
    payload.serverName = payload.serverName or getServerName()

    local ok, json = pcall(ZM_JSON.encode, payload)
    if not ok then
        print("[ZomboidManager] Failed to encode telemetry payload: " .. tostring(json))
        return false
    end

    local file = io.open(TEMP_UPLOAD_PATH, "w")
    if not file then
        print("[ZomboidManager] Failed to open telemetry upload temp file")
        return false
    end

    file:write(json)
    file:close()

    local command = string.format(
        "curl -fsS -m 10 -X POST -H \"Content-Type: application/json\" --data-binary @%s %s >/dev/null 2>&1",
        TEMP_UPLOAD_PATH,
        API_TELEMETRY_URL
    )

    local result = os.execute(command)
    os.remove(TEMP_UPLOAD_PATH)

    if result == true or result == 0 then
        return true
    end

    print("[ZomboidManager] Telemetry upload failed")
    return false
end

function ZM_Utils.fetchRuntimeConfig(force)
    local now = getUnixTime()
    if not force and lastConfigFetchAt > 0 then
        local refreshSeconds = runtimeConfig.refreshSeconds or DEFAULT_CONFIG.refreshSeconds
        if (now - lastConfigFetchAt) < refreshSeconds then
            return runtimeConfig
        end
    end

    local serverName = urlEncode(getServerName())
    local command = string.format(
        "curl -fsS -m 10 \"%s?serverName=%s\" -o %s >/dev/null 2>&1",
        API_CONFIG_URL,
        serverName,
        TEMP_CONFIG_PATH
    )

    local result = os.execute(command)
    if result ~= true and result ~= 0 then
        print("[ZomboidManager] Failed to fetch runtime config; keeping previous config")
        return runtimeConfig
    end

    local rawConfig = readFile(TEMP_CONFIG_PATH)
    os.remove(TEMP_CONFIG_PATH)
    if not rawConfig or rawConfig == "" then
        return runtimeConfig
    end

    local ok, decoded = pcall(ZM_JSON.decode, rawConfig)
    if not ok or type(decoded) ~= "table" then
        print("[ZomboidManager] Failed to decode runtime config")
        return runtimeConfig
    end

    if type(decoded.listeners) ~= "table" then
        decoded.listeners = DEFAULT_CONFIG.listeners
    end
    if type(decoded.refreshSeconds) ~= "number" then
        decoded.refreshSeconds = DEFAULT_CONFIG.refreshSeconds
    end

    runtimeConfig = decoded
    lastConfigFetchAt = now
    return runtimeConfig
end

function ZM_Utils.getListenerConfig(adapterKey)
    local listeners = runtimeConfig and runtimeConfig.listeners or DEFAULT_CONFIG.listeners
    local listener = listeners and listeners[adapterKey] or nil
    if type(listener) ~= "table" then
        listener = DEFAULT_CONFIG.listeners[adapterKey] or { enabled = false }
    end
    return listener
end

function ZM_Utils.isListenerEnabled(adapterKey)
    local listener = ZM_Utils.getListenerConfig(adapterKey)
    return listener.enabled ~= false
end

return ZM_Utils