ZM_JSON = {}

local function escapeString(value)
    local replacements = {
        ["\\"] = "\\\\",
        ["\""] = "\\\"",
        ["\b"] = "\\b",
        ["\f"] = "\\f",
        ["\n"] = "\\n",
        ["\r"] = "\\r",
        ["\t"] = "\\t",
    }

    return '"' .. value:gsub('[%z\1-\31\\"]', function(char)
        return replacements[char] or string.format("\\u%04x", char:byte())
    end) .. '"'
end

local function isArray(value)
    if type(value) ~= "table" then
        return false
    end

    local count = 0
    for key, _ in pairs(value) do
        if type(key) ~= "number" then
            return false
        end
        count = count + 1
    end

    for index = 1, count do
        if value[index] == nil then
            return false
        end
    end

    return true
end

local function encodeValue(value)
    local valueType = type(value)

    if valueType == "nil" then
        return "null"
    end

    if valueType == "boolean" then
        return tostring(value)
    end

    if valueType == "number" then
        if value ~= value or value == math.huge or value == -math.huge then
            error("unsupported number value")
        end
        if value % 1 == 0 then
            return tostring(math.floor(value))
        end
        return string.format("%.14g", value)
    end

    if valueType == "string" then
        return escapeString(value)
    end

    if valueType == "table" then
        local parts = {}
        if isArray(value) then
            for index = 1, #value do
                table.insert(parts, encodeValue(value[index]))
            end
            return "[" .. table.concat(parts, ",") .. "]"
        end

        for key, innerValue in pairs(value) do
            table.insert(parts, escapeString(tostring(key)) .. ":" .. encodeValue(innerValue))
        end
        return "{" .. table.concat(parts, ",") .. "}"
    end

    error("unsupported JSON type: " .. valueType)
end

local function decodeError(position, message)
    error(string.format("JSON decode error at position %d: %s", position, message))
end

local function skipWhitespace(text, position)
    while true do
        local char = text:sub(position, position)
        if char == " " or char == "\n" or char == "\r" or char == "\t" then
            position = position + 1
        else
            return position
        end
    end
end

local function parseString(text, position)
    position = position + 1
    local parts = {}

    while position <= #text do
        local char = text:sub(position, position)
        if char == '"' then
            return table.concat(parts), position + 1
        end

        if char == "\\" then
            local escaped = text:sub(position + 1, position + 1)
            if escaped == '"' or escaped == "\\" or escaped == "/" then
                table.insert(parts, escaped)
                position = position + 2
            elseif escaped == "b" then
                table.insert(parts, "\b")
                position = position + 2
            elseif escaped == "f" then
                table.insert(parts, "\f")
                position = position + 2
            elseif escaped == "n" then
                table.insert(parts, "\n")
                position = position + 2
            elseif escaped == "r" then
                table.insert(parts, "\r")
                position = position + 2
            elseif escaped == "t" then
                table.insert(parts, "\t")
                position = position + 2
            elseif escaped == "u" then
                local hex = text:sub(position + 2, position + 5)
                if #hex < 4 or not hex:match("^[0-9a-fA-F]+$") then
                    decodeError(position, "invalid unicode escape")
                end
                local codepoint = tonumber(hex, 16)
                if codepoint <= 255 then
                    table.insert(parts, string.char(codepoint))
                else
                    table.insert(parts, "?")
                end
                position = position + 6
            else
                decodeError(position, "invalid escape sequence")
            end
        else
            table.insert(parts, char)
            position = position + 1
        end
    end

    decodeError(position, "unterminated string")
end

local function parseNumber(text, position)
    local startPos = position
    local lastPos = position
    local match = text:match("^-?%d+%.?%d*[eE]?[+-]?%d*", position)
    if not match or match == "" then
        decodeError(position, "invalid number")
    end

    lastPos = position + #match - 1
    local value = tonumber(text:sub(startPos, lastPos))
    if value == nil then
        decodeError(position, "invalid numeric value")
    end

    return value, lastPos + 1
end

local parseValue

local function parseArray(text, position)
    local result = {}
    position = skipWhitespace(text, position + 1)
    if text:sub(position, position) == "]" then
        return result, position + 1
    end

    local index = 1
    while true do
        local value
        value, position = parseValue(text, position)
        result[index] = value
        index = index + 1
        position = skipWhitespace(text, position)

        local char = text:sub(position, position)
        if char == "]" then
            return result, position + 1
        end
        if char ~= "," then
            decodeError(position, "expected ',' or ']' in array")
        end

        position = skipWhitespace(text, position + 1)
    end
end

local function parseObject(text, position)
    local result = {}
    position = skipWhitespace(text, position + 1)
    if text:sub(position, position) == "}" then
        return result, position + 1
    end

    while true do
        if text:sub(position, position) ~= '"' then
            decodeError(position, "expected string key")
        end

        local key
        key, position = parseString(text, position)
        position = skipWhitespace(text, position)
        if text:sub(position, position) ~= ":" then
            decodeError(position, "expected ':' after key")
        end

        local value
        value, position = parseValue(text, skipWhitespace(text, position + 1))
        result[key] = value
        position = skipWhitespace(text, position)

        local char = text:sub(position, position)
        if char == "}" then
            return result, position + 1
        end
        if char ~= "," then
            decodeError(position, "expected ',' or '}' in object")
        end

        position = skipWhitespace(text, position + 1)
    end
end

local function parseLiteral(text, position, literal, value)
    if text:sub(position, position + #literal - 1) ~= literal then
        decodeError(position, "invalid literal")
    end

    return value, position + #literal
end

parseValue = function(text, position)
    position = skipWhitespace(text, position)
    local char = text:sub(position, position)

    if char == '"' then
        return parseString(text, position)
    end
    if char == "{" then
        return parseObject(text, position)
    end
    if char == "[" then
        return parseArray(text, position)
    end
    if char == "-" or char:match("%d") then
        return parseNumber(text, position)
    end
    if char == "t" then
        return parseLiteral(text, position, "true", true)
    end
    if char == "f" then
        return parseLiteral(text, position, "false", false)
    end
    if char == "n" then
        return parseLiteral(text, position, "null", nil)
    end

    decodeError(position, "unexpected character")
end

function ZM_JSON.encode(value)
    return encodeValue(value)
end

function ZM_JSON.decode(text)
    if type(text) ~= "string" then
        error("JSON decode expects a string")
    end

    local value, position = parseValue(text, 1)
    position = skipWhitespace(text, position)
    if position <= #text then
        decodeError(position, "trailing content")
    end

    return value
end

return ZM_JSON