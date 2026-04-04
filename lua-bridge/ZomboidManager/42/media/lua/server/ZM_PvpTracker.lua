ZM_PvpTracker = {}

local HIT_EXPIRY_SECONDS = 30
local lastAttacker = {}
local deadPlayers = {}
local pendingKills = {}

local function nowSeconds()
    return os.time()
end

function ZM_PvpTracker.onWeaponHitCharacter(attacker, target, weapon, damage)
    local okAttacker, attackerIsPlayer = pcall(function() return instanceof(attacker, "IsoPlayer") end)
    local okTarget, targetIsPlayer = pcall(function() return instanceof(target, "IsoPlayer") end)
    if not okAttacker or not attackerIsPlayer or not okTarget or not targetIsPlayer then
        return
    end

    local attackerName = attacker:getUsername()
    local targetName = target:getUsername()
    if not attackerName or not targetName or attackerName == targetName then
        return
    end

    local weaponType = "unknown"
    if weapon and weapon.getFullType then
        local okWeapon, fullType = pcall(function() return weapon:getFullType() end)
        if okWeapon and fullType then
            weaponType = tostring(fullType)
        end
    end

    lastAttacker[targetName] = {
        attacker = attackerName,
        weapon = weaponType,
        attackerX = math.floor(attacker:getX()),
        attackerY = math.floor(attacker:getY()),
        victimX = math.floor(target:getX()),
        victimY = math.floor(target:getY()),
        occurredAt = nowSeconds(),
    }
end

function ZM_PvpTracker.tick()
    local players = getOnlinePlayers()
    if not players then
        return
    end

    local currentTime = nowSeconds()
    for index = 0, players:size() - 1 do
        local player = players:get(index)
        if player then
            local username = player:getUsername()
            if username then
                if player:isDead() then
                    if not deadPlayers[username] then
                        deadPlayers[username] = true
                        local hit = lastAttacker[username]
                        if hit and (currentTime - hit.occurredAt) <= HIT_EXPIRY_SECONDS then
                            table.insert(pendingKills, {
                                killer = hit.attacker,
                                victim = username,
                                weapon = hit.weapon,
                                killerX = hit.attackerX,
                                killerY = hit.attackerY,
                                victimX = hit.victimX,
                                victimY = hit.victimY,
                                occurredAt = ZM_Utils.getTimestamp(),
                            })
                        end
                        lastAttacker[username] = nil
                    end
                else
                    deadPlayers[username] = nil
                end
            end
        end
    end
end

function ZM_PvpTracker.hasPendingKills()
    return #pendingKills > 0
end

function ZM_PvpTracker.drainKills()
    local drained = pendingKills
    pendingKills = {}
    return drained
end

function ZM_PvpTracker.init()
    lastAttacker = {}
    deadPlayers = {}
    pendingKills = {}
end

return ZM_PvpTracker