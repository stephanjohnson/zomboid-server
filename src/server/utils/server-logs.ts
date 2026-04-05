import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

import { getPzDataPath } from './runtime-paths'

export interface GameServerPhase {
  state: string
  label: string
  detail?: string
  progress?: number
}

const ANSI_ESCAPE_PATTERN = /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g
const CONTROL_CHARACTER_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

function normalizeLogText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(ANSI_ESCAPE_PATTERN, '')
    .replace(CONTROL_CHARACTER_PATTERN, '')
}

export function sanitizeLogText(text: string): string {
  return normalizeLogText(text).trim()
}

export function splitLogLines(text: string): string[] {
  return normalizeLogText(text)
    .split('\n')
    .map(line => line.trimEnd())
    .filter(Boolean)
}

export function tailLogText(text: string, lineCount: number): string {
  return splitLogLines(text).slice(-lineCount).join('\n')
}

export function decodeDockerLogBuffer(logs: string | Buffer): string {
  if (typeof logs === 'string') {
    return sanitizeLogText(logs)
  }

  const chunks: string[] = []
  let offset = 0

  while (offset + 8 <= logs.length) {
    const streamType = logs[offset]
    const payloadSize = logs.readUInt32BE(offset + 4)
    const nextOffset = offset + 8 + payloadSize

    if ((streamType < 1 || streamType > 3) || nextOffset > logs.length) {
      return sanitizeLogText(logs.toString('utf-8'))
    }

    chunks.push(logs.subarray(offset + 8, nextOffset).toString('utf-8'))
    offset = nextOffset
  }

  if (offset === 0) {
    return sanitizeLogText(logs.toString('utf-8'))
  }

  if (offset < logs.length) {
    chunks.push(logs.subarray(offset).toString('utf-8'))
  }

  return sanitizeLogText(chunks.join(''))
}

export function readServerConsoleLog(): string {
  const consolePath = join(getPzDataPath(), 'server-console.txt')

  if (!existsSync(consolePath)) {
    return ''
  }

  return sanitizeLogText(readFileSync(consolePath, 'utf-8'))
}

export function readPreviousConsoleLog(): string | null {
  const prevPath = join(getPzDataPath(), 'server-console.prev.txt')

  if (!existsSync(prevPath)) {
    return null
  }

  return sanitizeLogText(readFileSync(prevPath, 'utf-8'))
}

export function deletePreviousConsoleLog(): boolean {
  const prevPath = join(getPzDataPath(), 'server-console.prev.txt')

  if (!existsSync(prevPath)) {
    return false
  }

  unlinkSync(prevPath)
  return true
}

function findLastIndex(lines: string[], pattern: RegExp): number {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (pattern.test(lines[index])) {
      return index
    }
  }

  return -1
}

function findLastLine(lines: string[], patterns: RegExp[]): { index: number, line: string } | null {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (patterns.some(pattern => pattern.test(lines[index]))) {
      return { index, line: lines[index] }
    }
  }

  return null
}

// Patterns that match benign ERROR: lines logged during normal PZ initialization.
// These are asset/script validation messages, not actual server failures.
const BENIGN_ERROR_PATTERNS: RegExp[] = [
  /Property Name not found:/i,
  /IsoPropertyTypeNotFoundException/i,
  /no such model/i,
  /Could not find icon:/i,
  /different number of attachments/i,
  /new tag discovered/i,
  /XuiSkin\$/i,
  /ModelScript\./i,
  /TaggedObjectManager\./i,
  /LoadComponentInfo/i,
  /DebugFileWatcher/i,
  /CraftRecipeComponentScript/i,
  /duplicate texture/i,
  /IsoSpriteManager\.AddSprite/i,
  /MOD:ZomboidManager/i,
  /ZM_Main\.lua/i,
  /ZM_Utils\.lua/i,
  /ZM_PvpTracker\.lua/i,
]

function isBenignErrorLine(line: string, nearbyLines: string[]): boolean {
  if (BENIGN_ERROR_PATTERNS.some(pattern => pattern.test(line))) {
    return true
  }
  // Check the next few lines for stack trace context (e.g. "Property Name not found:" appears
  // on the line after "Exception thrown", sometimes with stack trace lines in between)
  for (const nearby of nearbyLines) {
    if (BENIGN_ERROR_PATTERNS.some(pattern => pattern.test(nearby))) {
      return true
    }
    // Stop scanning once we hit another log-level line (not a stack trace continuation)
    if (/^(LOG|WARN|ERROR|FATAL)\s*:/i.test(nearby)) {
      break
    }
  }
  return false
}

function summarizeErrorLine(line: string, nextLine?: string): string {
  const normalizedLine = line
    .replace(/^ERROR:\s*/i, '')
    .replace(/^FATAL:\s*/i, '')
    .replace(/\s*f:\d+.*?>\s*/i, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (nextLine) {
    const propertyMatch = nextLine.match(/(Property Name not found:\s*.+)$/i)
    if (propertyMatch) {
      return propertyMatch[1].trim()
    }
  }

  return normalizedLine || 'Server reported an error'
}

function findLastNonBenignError(lines: string[]): { index: number, line: string } | null {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (/^FATAL:/i.test(lines[index])) {
      return { index, line: lines[index] }
    }
    if (/^ERROR:/i.test(lines[index]) && !isBenignErrorLine(lines[index], lines.slice(index + 1, index + 6))) {
      return { index, line: lines[index] }
    }
  }
  return null
}

function resolveConsolePhase(serverConsole: string): GameServerPhase | null {
  const lines = splitLogLines(serverConsole).slice(-800)
  if (!lines.length) {
    return null
  }

  const passwordPrompt = findLastLine(lines, [/Enter new administrator password/i])
  if (passwordPrompt) {
    return {
      state: 'error',
      label: 'Error',
      detail: 'Server is waiting for an administrator password',
    }
  }

  const errorEntry = findLastNonBenignError(lines)
  const assetStartIndex = findLastIndex(lines, /LOADING ASSETS: START/i)
  const assetFinishIndex = findLastIndex(lines, /LOADING ASSETS: FINISH/i)
  const worldLoadEntry = findLastLine(lines, [
    /Loading world\.\.\./i,
    /Loading worldgen params/i,
    /IsoMetaGrid\.Create/i,
    /VehiclesDB2\.init/i,
    /SandboxOptions\.load/i,
    /ItemPickerJava\.Parse/i,
    /LoadTileDefinitions/i,
    /triggerEvent OnInitWorld/i,
    /World seed:/i,
  ])
  const runtimePrepEntry = findLastLine(lines, [
    /\[ZomboidManager\] Initializing server-side bridge mod/i,
    /Event hooks registered/i,
    /writing .*SandboxVars\.lua/i,
    /luaChecksum:/i,
    /Applying settings/i,
  ])
  const workshopEntry = findLastLine(lines, [/Workshop:/i, /WorkshopItems/i])

  if (errorEntry && errorEntry.index > Math.max(assetStartIndex, assetFinishIndex, worldLoadEntry?.index ?? -1, runtimePrepEntry?.index ?? -1)) {
    return {
      state: 'error',
      label: 'Error',
      detail: summarizeErrorLine(errorEntry.line, lines[errorEntry.index + 1]),
    }
  }

  if (assetStartIndex > assetFinishIndex) {
    return {
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading assets',
    }
  }

  if (worldLoadEntry || assetFinishIndex !== -1) {
    return {
      state: 'initializing',
      label: 'Initializing',
      detail: 'Loading world',
    }
  }

  if (workshopEntry) {
    return {
      state: 'initializing',
      label: 'Initializing',
      detail: 'Downloading Workshop content',
    }
  }

  if (runtimePrepEntry) {
    return {
      state: 'starting',
      label: 'Starting',
      detail: 'Preparing server runtime',
    }
  }

  return {
    state: 'starting',
    label: 'Starting',
    detail: 'Booting dedicated server',
  }
}

function resolveContainerPhase(containerLogs: string): GameServerPhase {
  const lines = splitLogLines(containerLogs)

  const errorEntry = findLastLine(lines, [/Failed to install app/i, /SteamCMD failed/i, /^FATAL:/i])
  const updateEntry = findLastLine(lines, [/Update state/i])
  const steamcmdUpdateEntry = findLastLine(lines, [/Downloading update \(/i, /Updating Project Zomboid Server/i, /app_update 380870/i])

  // Only treat SteamCMD errors as fatal if they appear after the last update progress line
  const lastUpdateIndex = Math.max(updateEntry?.index ?? -1, steamcmdUpdateEntry?.index ?? -1)
  if (errorEntry && (lastUpdateIndex === -1 || errorEntry.index > lastUpdateIndex)) {
    return {
      state: 'error',
      label: 'Error',
      detail: errorEntry.line,
    }
  }

  if (updateEntry) {
    let detail = 'Updating server files'
    let progress: number | undefined
    const progressMatch = updateEntry.line.match(/progress:\s*([0-9.]+)/i)
    if (progressMatch) {
      progress = Number(progressMatch[1])
    }

    if (/preallocating/i.test(updateEntry.line)) detail = 'Preallocating server files'
    else if (/downloading/i.test(updateEntry.line)) detail = 'Downloading server files'
    else if (/verifying/i.test(updateEntry.line)) detail = 'Verifying server files'
    else if (/committing/i.test(updateEntry.line)) detail = 'Finalizing update'

    return {
      state: 'updating',
      label: 'Updating',
      detail,
      progress,
    }
  }

  if (steamcmdUpdateEntry) {
    let detail = 'Updating server files'
    let progress: number | undefined
    const dlMatch = steamcmdUpdateEntry.line.match(/Downloading update \((\d+) of (\d+) KB\)/)
    if (dlMatch) {
      detail = 'Updating SteamCMD'
      progress = Math.round((Number(dlMatch[1]) / Number(dlMatch[2])) * 100)
    }
    else if (/Updating Project Zomboid/i.test(steamcmdUpdateEntry.line)) {
      detail = 'Running SteamCMD update'
    }
    else if (/app_update/i.test(steamcmdUpdateEntry.line)) {
      detail = 'Downloading game server'
    }

    return {
      state: 'updating',
      label: 'Updating',
      detail,
      progress,
    }
  }

  if (findLastLine(lines, [/Installing\/updating PZ server/i])) {
    return {
      state: 'updating',
      label: 'Updating',
      detail: 'Installing server files',
    }
  }

  if (findLastLine(lines, [/Success! App '380870' fully installed\./i])) {
    return {
      state: 'starting',
      label: 'Starting',
      detail: 'Launching dedicated server',
    }
  }

  if (findLastLine(lines, [/start-server\.sh/i, /ProjectZomboid64/i, /Starting Project Zomboid Server/i])) {
    return {
      state: 'starting',
      label: 'Starting',
      detail: 'Launching server process',
    }
  }

  if (findLastLine(lines, [/Applying Post Install Configuration/i, /Checking if this is the first run/i, /\[configure\]/i])) {
    return {
      state: 'starting',
      label: 'Starting',
      detail: 'Applying server configuration',
    }
  }

  if (findLastLine(lines, [/Setting variables/i, /Applying Pre Install Configuration/i, /\[entrypoint\]/i])) {
    return {
      state: 'initializing',
      label: 'Initializing',
      detail: 'Preparing server environment',
    }
  }

  return {
    state: 'initializing',
    label: 'Initializing',
    detail: 'Waiting for server output',
  }
}

export function resolveServerPhase(containerLogs: string, serverConsole: string): GameServerPhase {
  // Container-level phases (updating, errors) take priority over stale console data
  const containerPhase = resolveContainerPhase(containerLogs)
  if (containerPhase.state === 'updating' || containerPhase.state === 'error') {
    return containerPhase
  }

  const consolePhase = resolveConsolePhase(serverConsole)
  if (consolePhase) {
    return consolePhase
  }

  return containerPhase
}
