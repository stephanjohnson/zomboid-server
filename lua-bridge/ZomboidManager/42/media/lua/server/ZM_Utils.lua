require("ZM_JSON")

ZM_Utils = {}

local ZOMBOID_DATA_DIR = "/home/steam/Zomboid"
local BRIDGE_ENV_FILE = "Lua/bridge_env.json"
local BRIDGE_ENV_PATH = ZOMBOID_DATA_DIR .. "/" .. BRIDGE_ENV_FILE
local TEMP_UPLOAD_FILE = "Lua/bridge_payload.json"
local TEMP_UPLOAD_PATH = ZOMBOID_DATA_DIR .. "/" .. TEMP_UPLOAD_FILE
local TEMP_CONFIG_FILE = "Lua/bridge_config.json"
local TEMP_CONFIG_PATH = ZOMBOID_DATA_DIR .. "/" .. TEMP_CONFIG_FILE

local function openManagedReader(fileName)
    if not getFileReader then
        return nil
    end

    local ok, reader = pcall(function()
        return getFileReader(fileName, true)
    end)
    if ok and reader then
        return reader
    end

    ok, reader = pcall(function()
        return getFileReader(fileName, false)
    end)
    if ok and reader then
        return reader
    end

    return nil
end

local function readManagedFile(fileName)
    local reader = openManagedReader(fileName)
    if not reader then
        return nil
    end

    local lines = {}
    while true do
        local line = reader:readLine()
        if line == nil then
            break
        end

        table.insert(lines, line)
    end

    reader:close()
    return table.concat(lines, "\n")
end

local function writeManagedFile(fileName, content)
    if not getFileWriter then
        return false, "getFileWriter unavailable"
    end

    local ok, writer = pcall(function()
        return getFileWriter(fileName, true, false)
    end)
    if (not ok or not writer) then
        ok, writer = pcall(function()
            return getFileWriter(fileName, false, false)
        end)
    end
    if not ok or not writer then
        return false, "failed to open writer"
    end

    local writeOk, writeErr = pcall(function()
        writer:write(content)
    end)
    writer:close()

    if not writeOk then
        return false, writeErr
    end

    return true
end

local function removeManagedFile(path)
    if os and os.remove then
        pcall(os.remove, path)
    end
end

local function shellQuote(value)
    local text = tostring(value or "")
    return "'" .. text:gsub("'", "'\"'\"'") .. "'"
end

local function loadBridgeEnv()
    local rawConfig = readManagedFile(BRIDGE_ENV_FILE)
    if not rawConfig or rawConfig == "" then
        return {}
    end

    local ok, decoded = pcall(ZM_JSON.decode, rawConfig)
    if ok and type(decoded) == "table" then
        return decoded
    end

    print("[ZomboidManager] Failed to decode bridge environment config")
    return {}
end

local bridgeEnv = loadBridgeEnv()
local API_BASE_URL = tostring(bridgeEnv.apiBaseUrl or "http://nitro-app:3000/api/mod")
local API_TELEMETRY_URL = API_BASE_URL .. "/telemetry"
local API_CONFIG_URL = API_BASE_URL .. "/config"
local API_RUNTIME_URL = API_BASE_URL .. "/runtime"

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

local function getResolvedServerName()
    local runtimeServerName = safeCall(function()
        if getServerName then
            return getServerName()
        end

        return nil
    end, nil)
    if runtimeServerName and tostring(runtimeServerName) ~= "" then
        return tostring(runtimeServerName)
    end

    local publicName = safeCall(function()
        local options = getServerOptions and getServerOptions() or nil
        if not options then
            return nil
        end

        if options.getOption then
            return options:getOption("PublicName")
        end

        if options.getOptionByName then
            local option = options:getOptionByName("PublicName")
            if option and option.getValue then
                return option:getValue()
            end
        end

        return nil
    end, nil)
    if publicName and tostring(publicName) ~= "" then
        return tostring(publicName)
    end

    return tostring(bridgeEnv.serverName or "servertest")
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

function ZM_Utils.collectActivatedMods()
    local modIds = {}
    local workshopIds = {}
    local activeModIDs = safeCall(getActivatedMods, nil)

    if not activeModIDs then
        return {
            activeModIds = modIds,
            activeWorkshopIds = workshopIds,
        }
    end

    for index = 0, activeModIDs:size() - 1 do
        local modId = activeModIDs:get(index)
        if modId and tostring(modId) ~= "" then
            table.insert(modIds, tostring(modId))

            local modInfo = safeCall(function()
                return getModInfoByID(modId)
            end, nil)

            if modInfo and modInfo.getWorkshopID then
                local workshopId = safeCall(function()
                    return modInfo:getWorkshopID()
                end, nil)

                if workshopId and tostring(workshopId) ~= "" then
                    table.insert(workshopIds, tostring(workshopId))
                end
            end
        end
    end

    return {
        activeModIds = modIds,
        activeWorkshopIds = workshopIds,
    }
end

local function postJsonPayload(payload, url, tempPath)
    local ok, json = pcall(ZM_JSON.encode, payload)
    if not ok then
        print("[ZomboidManager] Failed to encode JSON payload: " .. tostring(json))
        return false
    end

    local writeOk, writeErr = writeManagedFile(TEMP_UPLOAD_FILE, json)
    if not writeOk then
        print("[ZomboidManager] Failed to write temporary upload file: " .. tostring(writeErr))
        return false
    end

    local command = string.format(
        "curl -fsS -m 10 -X POST -H \"Content-Type: application/json\" --data-binary @%s %s >/dev/null 2>&1",
        shellQuote(tempPath),
        shellQuote(url)
    )

    local result = os.execute(command)
    removeManagedFile(tempPath)

    return result == true or result == 0
end

function ZM_Utils.postTelemetry(payload)
    payload.serverName = payload.serverName or getResolvedServerName()

    if postJsonPayload(payload, API_TELEMETRY_URL, TEMP_UPLOAD_PATH) then
        return true
    end

    print("[ZomboidManager] Telemetry upload failed")
    return false
end

function ZM_Utils.postRuntimeHandshake(reason)
    local runtimeState = ZM_Utils.collectActivatedMods()
    local payload = {
        serverName = getResolvedServerName(),
        reportedAt = ZM_Utils.getTimestamp(),
        reason = reason or "heartbeat",
        activeModIds = runtimeState.activeModIds,
        activeWorkshopIds = runtimeState.activeWorkshopIds,
    }

    if postJsonPayload(payload, API_RUNTIME_URL, TEMP_UPLOAD_PATH) then
        return true
    end

    print("[ZomboidManager] Runtime handshake upload failed")
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

    local serverName = urlEncode(getResolvedServerName())
    local command = string.format(
        "curl -fsS -m 10 \"%s?serverName=%s\" -o %s >/dev/null 2>&1",
        API_CONFIG_URL,
        serverName,
        shellQuote(TEMP_CONFIG_PATH)
    )

    local result = os.execute(command)
    if result ~= true and result ~= 0 then
        print("[ZomboidManager] Failed to fetch runtime config; keeping previous config")
        return runtimeConfig
    end

    local rawConfig = readManagedFile(TEMP_CONFIG_FILE)
    removeManagedFile(TEMP_CONFIG_PATH)
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