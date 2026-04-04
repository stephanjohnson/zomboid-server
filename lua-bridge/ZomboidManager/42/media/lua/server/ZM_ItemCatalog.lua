require("ZM_JSON")

ZM_ItemCatalog = {}

local CATALOG_FILE = "items_catalog.json"

local function safeCall(fn, fallback)
    local ok, value = pcall(fn)
    if ok then
        return value
    end
    return fallback
end

local function getTimestamp()
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

local function toStringList(value)
    if not value then
        return {}
    end

    local valueType = type(value)
    if valueType == "table" then
        local result = {}
        for _, entry in pairs(value) do
            table.insert(result, tostring(entry))
        end
        return result
    end

    if value.size and value.get then
        local result = {}
        for index = 0, value:size() - 1 do
            local entry = value:get(index)
            if entry then
                table.insert(result, tostring(entry))
            end
        end
        return result
    end

    return { tostring(value) }
end

local function normalizeMethodString(script, methodName)
    if not script or not script[methodName] then
        return nil
    end

    local value = safeCall(function() return script[methodName](script) end, nil)
    if value == nil or value == "" then
        return nil
    end

    return tostring(value)
end

local function normalizeMethodNumber(script, methodName)
    if not script or not script[methodName] then
        return nil
    end

    local value = safeCall(function() return script[methodName](script) end, nil)
    if type(value) == "number" then
        return value
    end

    return nil
end

local function normalizeMethodBoolean(script, methodName)
    if not script or not script[methodName] then
        return nil
    end

    local value = safeCall(function() return script[methodName](script) end, nil)
    if type(value) == "boolean" then
        return value
    end

    return nil
end

function ZM_ItemCatalog.export()
    local scriptManager = ScriptManager.instance
    if not scriptManager then
        print("[ZomboidManager] ERROR: ScriptManager not available")
        return 0
    end

    local allItems = scriptManager:getAllItems()
    if not allItems then
        print("[ZomboidManager] ERROR: getAllItems() returned nil")
        return 0
    end

    local items = {}
    local count = 0

    for index = 0, allItems:size() - 1 do
        local script = allItems:get(index)
        if script then
            local fullType = safeCall(function() return script:getFullName() end, nil)
            local itemName = safeCall(function() return script:getName() end, "Unknown")
            local name = safeCall(function() return script:getDisplayName() end, nil) or itemName or "Unknown"
            local category = normalizeMethodString(script, "getDisplayCategory") or "General"
            local iconName = "Item_" .. tostring(itemName or "Unknown")
            local textureIcon = normalizeMethodString(script, "getIcon") or normalizeMethodString(script, "getIconName")

            table.insert(items, {
                full_type = tostring(fullType or ""),
                name = tostring(name),
                category = tostring(category),
                display_category = tostring(category),
                icon_name = iconName,
                texture_icon = textureIcon,
                item_type = normalizeMethodString(script, "getItemType") or normalizeMethodString(script, "getTypeString"),
                weight = normalizeMethodNumber(script, "getActualWeight") or normalizeMethodNumber(script, "getWeight"),
                tags = toStringList(safeCall(function() return script:getTags() end, nil)),
                categories = toStringList(safeCall(function() return script:getCategories() end, nil)),
                attachment_type = normalizeMethodString(script, "getAttachmentType"),
                attachment_slots = toStringList(safeCall(function() return script:getAttachmentReplacement() end, nil)),
                is_two_handed = normalizeMethodBoolean(script, "isTwoHandWeapon"),
                max_condition = normalizeMethodNumber(script, "getConditionMax"),
                condition_lower_chance = normalizeMethodNumber(script, "getConditionLowerChanceOneIn"),
                min_damage = normalizeMethodNumber(script, "getMinDamage"),
                max_damage = normalizeMethodNumber(script, "getMaxDamage"),
                min_range = normalizeMethodNumber(script, "getMinRange"),
                max_range = normalizeMethodNumber(script, "getMaxRange"),
                attack_speed = normalizeMethodNumber(script, "getBaseSpeed"),
                crit_chance = normalizeMethodNumber(script, "getCriticalChance"),
                max_hit_count = normalizeMethodNumber(script, "getMaxHitCount"),
                tree_damage = normalizeMethodNumber(script, "getTreeDamage"),
                door_damage = normalizeMethodNumber(script, "getDoorDamage"),
                knockback = normalizeMethodNumber(script, "getPushBackMod"),
                sharpness = normalizeMethodNumber(script, "getSharpness"),
            })
            count = count + 1
        end
    end

    local data = {
        version = 2,
        timestamp = getTimestamp(),
        item_count = count,
        items = items,
    }

    local ok, jsonStr = pcall(ZM_JSON.encode, data)
    if not ok then
        print("[ZomboidManager] ERROR encoding item catalog: " .. tostring(jsonStr))
        return 0
    end

    local writer = getFileWriter(CATALOG_FILE, true, false)
    if not writer then
        print("[ZomboidManager] ERROR: cannot open file writer for item catalog")
        return 0
    end

    local writeOk, writeErr = pcall(function() writer:write(jsonStr) end)
    writer:close()

    if not writeOk then
        print("[ZomboidManager] ERROR writing item catalog: " .. tostring(writeErr))
        return 0
    end

    return count
end

return ZM_ItemCatalog
