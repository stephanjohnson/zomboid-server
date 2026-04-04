--- ZomboidManager Lua Mod ---
-- Bridge between the game server and the Nitro web management API.
-- Reads commands from the outbox directory and writes telemetry to the inbox.

local BRIDGE_BASE = "/home/steam/Zomboid/Lua"
local PROFILE = "default"
local INBOX_DIR = BRIDGE_BASE .. "/" .. PROFILE .. "/inbox"
local OUTBOX_DIR = BRIDGE_BASE .. "/" .. PROFILE .. "/outbox"

-- Ensure directories exist
local function ensureDir(path)
    os.execute("mkdir -p " .. path)
end

-- Write a JSON file to the inbox for Nitro to consume
local function writeInboxFile(data)
    ensureDir(INBOX_DIR)
    local filename = INBOX_DIR .. "/telemetry_" .. os.time() .. ".json"
    local file = io.open(filename, "w")
    if file then
        -- Simple JSON serialization for flat tables
        local parts = {}
        for k, v in pairs(data) do
            if type(v) == "string" then
                table.insert(parts, '"' .. k .. '":"' .. v .. '"')
            elseif type(v) == "number" or type(v) == "boolean" then
                table.insert(parts, '"' .. k .. '":' .. tostring(v))
            end
        end
        file:write("{" .. table.concat(parts, ",") .. "}")
        file:close()
    end
end

-- Read and process command files from the outbox
local function processOutbox()
    ensureDir(OUTBOX_DIR)
    local handle = io.popen("ls " .. OUTBOX_DIR .. "/*.json 2>/dev/null")
    if not handle then return end

    for filename in handle:lines() do
        local file = io.open(filename, "r")
        if file then
            local content = file:read("*a")
            file:close()

            -- Process command (simplified — in production, parse JSON properly)
            print("[ZomboidManager] Processing command: " .. filename)

            -- Remove processed file
            os.remove(filename)

            -- Write acknowledgement
            writeInboxFile({
                type = "ack",
                command = filename,
                status = "processed",
                timestamp = tostring(os.time())
            })
        end
    end
    handle:close()
end

-- Export player telemetry
local function exportTelemetry()
    local players = getOnlinePlayers()
    if not players then return end

    local count = players:size()
    local playerList = {}

    for i = 0, count - 1 do
        local player = players:get(i)
        if player then
            table.insert(playerList, {
                username = player:getUsername(),
                x = player:getX(),
                y = player:getY(),
                z = player:getZ(),
            })
        end
    end

    writeInboxFile({
        type = "telemetry",
        playerCount = count,
        timestamp = tostring(os.time())
    })
end

-- Register event hooks
Events.EveryOneMinute.Add(function()
    exportTelemetry()
    processOutbox()
end)

print("[ZomboidManager] Lua bridge initialized")
