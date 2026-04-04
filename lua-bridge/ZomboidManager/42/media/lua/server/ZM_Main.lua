require("ZM_Utils")
require("ZM_ItemCatalog")
require("ZM_PvpTracker")

print("[ZomboidManager] Initializing configurable telemetry bridge...")

local snapshotTickCounter = 0
local inventoryTickCounter = 0
local gameStateTickCounter = 0
local pendingEvents = {}

local function getSnapshotListener()
    return ZM_Utils.getListenerConfig("pz.player_snapshot")
end

local function getSnapshotIntervalMinutes()
    local listener = getSnapshotListener()
    return tonumber(listener.snapshotIntervalMinutes) or 12
end

local function getInventoryIntervalMinutes()
    local listener = getSnapshotListener()
    return tonumber(listener.inventoryIntervalMinutes) or 48
end

local function getGameStateIntervalMinutes()
    local listener = getSnapshotListener()
    return tonumber(listener.gameStateIntervalMinutes) or 24
end

local function collectPlayers(includeInventory)
    local players = getOnlinePlayers()
    if not players then
        return {}
    end

    local snapshots = {}
    for index = 0, players:size() - 1 do
        local player = players:get(index)
        if player then
            local snapshot = ZM_Utils.collectPlayerSnapshot(player, includeInventory)
            if snapshot then
                table.insert(snapshots, snapshot)
            end
        end
    end

    return snapshots
end

local function uploadTelemetry(includeInventory, includeGameState, reason)
    local payload = {
        capturedAt = ZM_Utils.getTimestamp(),
        players = collectPlayers(includeInventory),
    }

    if #pendingEvents > 0 then
        payload.events = pendingEvents
        pendingEvents = {}
    end

    if ZM_Utils.isListenerEnabled("pz.pvp_kill_tracker") then
        local pendingKills = ZM_PvpTracker.drainKills()
        if pendingKills and #pendingKills > 0 then
            payload.pvpKills = pendingKills
        end
    end

    if includeGameState then
        payload.gameState = ZM_Utils.collectGameState()
    end

    if (not payload.players or #payload.players == 0)
        and (not payload.pvpKills or #payload.pvpKills == 0)
        and (not payload.events or #payload.events == 0)
        and not payload.gameState then
        return
    end

    local success = ZM_Utils.postTelemetry(payload)
    if success then
        print("[ZomboidManager] Uploaded telemetry batch (reason=" .. tostring(reason) .. ")")
    end
end

local function queueEvent(eventKey, username, quantity, metadata)
    if not username or username == "" then
        return
    end

    table.insert(pendingEvents, {
        eventKey = eventKey,
        username = username,
        quantity = quantity or 1,
        occurredAt = ZM_Utils.getTimestamp(),
        metadata = metadata and ZM_Utils.sanitizeJsonValue(metadata) or nil,
    })
end

local function onItemFound(player, itemType, amount)
    if not ZM_Utils.isListenerEnabled("pz.item_found") then
        return
    end

    local username = player and player.getUsername and player:getUsername() or nil
    queueEvent("pz.item.found", username, tonumber(amount) or 1, {
        itemType = tostring(itemType or "unknown"),
    })
end

local function onProcessAction(action, player, args)
    if not ZM_Utils.isListenerEnabled("pz.build_action") then
        return
    end

    local listenerConfig = ZM_Utils.getListenerConfig("pz.build_action")
    local allowedActions = listenerConfig.config and listenerConfig.config.actions or nil
    local normalizedAction = tostring(action or "")
    if allowedActions and type(allowedActions) == "table" then
        local isAllowed = false
        for _, allowed in pairs(allowedActions) do
            if tostring(allowed) == normalizedAction then
                isAllowed = true
                break
            end
        end
        if not isAllowed then
            return
        end
    elseif normalizedAction ~= "build" then
        return
    end

    local username = player and player.getUsername and player:getUsername() or nil
    queueEvent("pz.build.action", username, 1, {
        action = normalizedAction,
        args = args,
    })
end

local function onEveryOneMinute()
    ZM_Utils.fetchRuntimeConfig(false)

    snapshotTickCounter = snapshotTickCounter + 1
    inventoryTickCounter = inventoryTickCounter + 1
    gameStateTickCounter = gameStateTickCounter + 1

    local snapshotListenerEnabled = ZM_Utils.isListenerEnabled("pz.player_snapshot")
    local pvpEnabled = ZM_Utils.isListenerEnabled("pz.pvp_kill_tracker")
    if pvpEnabled then
        ZM_PvpTracker.tick()
    end

    local includeSnapshot = snapshotListenerEnabled and snapshotTickCounter >= getSnapshotIntervalMinutes()
    local includeInventory = snapshotListenerEnabled and inventoryTickCounter >= getInventoryIntervalMinutes()
    local includeGameState = snapshotListenerEnabled and gameStateTickCounter >= getGameStateIntervalMinutes()
    local hasPendingKills = pvpEnabled and ZM_PvpTracker.hasPendingKills()

    if includeSnapshot or includeInventory or includeGameState or hasPendingKills or #pendingEvents > 0 then
        if includeSnapshot then
            snapshotTickCounter = 0
        end
        if includeInventory then
            inventoryTickCounter = 0
        end
        if includeGameState then
            gameStateTickCounter = 0
        end

        uploadTelemetry(includeInventory, includeGameState, "tick")
    end
end

local function onServerStarted()
    ZM_Utils.fetchRuntimeConfig(true)
    ZM_PvpTracker.init()
    local ok, count = pcall(ZM_ItemCatalog.export)
    if ok then
        print("[ZomboidManager] Exported item catalog with " .. tostring(count) .. " entries")
    else
        print("[ZomboidManager] Failed to export item catalog: " .. tostring(count))
    end
    uploadTelemetry(true, true, "server_started")
end

Events.OnWeaponHitCharacter.Add(ZM_PvpTracker.onWeaponHitCharacter)
Events.OnItemFound.Add(onItemFound)
Events.OnProcessAction.Add(onProcessAction)
Events.EveryOneMinute.Add(onEveryOneMinute)
Events.OnServerStarted.Add(onServerStarted)

print("[ZomboidManager] Event hooks registered with config polling")
