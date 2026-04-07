import type { WorkshopInstalledMod } from './workshop'

import { splitLogLines } from './server-logs'
import { readInstalledWorkshopMods } from './workshop'

export const MOD_RUNTIME_VERIFICATION_TIMEOUT_MS = 15 * 60 * 1000
const MOD_RUNTIME_VERIFICATION_TIMEOUT_MINUTES = Math.floor(MOD_RUNTIME_VERIFICATION_TIMEOUT_MS / 60000)

export type ServerPhaseState =
  | 'ready'
  | 'starting'
  | 'initializing'
  | 'updating'
  | 'error'
  | 'stopped'
  | 'not_created'
  | string

export interface WorkshopRuntimeStatus {
  workshopId: string
  state: 'ready' | 'installing' | 'error'
  detail: string
  progress?: number
  source: 'live-console' | 'previous-console'
}

export interface ModLogIssue {
  workshopId: string
  severity: 'warning' | 'error'
  detail: string
  source: 'live-console' | 'previous-console'
}

export interface CurrentSessionRuntimeHandshake {
  reportedAt: Date
  reason: string | null
  activeModIds: string[]
  activeWorkshopIds: string[]
}

export interface ConfiguredModStatus {
  workshopId: string
  state: 'ok' | 'installing' | 'faulty' | 'error' | 'unknown'
  label: string
  detail: string
  progress: number | null
  source: 'live-console' | 'previous-console' | 'installed-files' | 'runtime-handshake' | 'live-console-issue' | 'previous-console-issue' | 'none'
  installedModIds: string[]
  missingModIds: string[]
}

interface ConfiguredModEntry {
  workshopId: string
  modName: string
  displayName?: string | null
  updatedAt?: Date
}

interface ResolveConfiguredModStatusesOptions {
  serverPhaseState: ServerPhaseState
  liveWorkshopStatuses: Map<string, WorkshopRuntimeStatus>
  previousWorkshopStatuses: Map<string, WorkshopRuntimeStatus>
  installedModsByWorkshopId: Map<string, WorkshopInstalledMod[]>
  currentSessionRuntimeHandshake: CurrentSessionRuntimeHandshake | null
  modLogIssues: Map<string, ModLogIssue>
  containerStartedAt?: Date | null
  currentTime?: Date
}

function resolveVerificationStartedAt(mod: ConfiguredModEntry, options: ResolveConfiguredModStatusesOptions): Date | null {
  const containerStartedAt = options.containerStartedAt ?? null
  const modUpdatedAt = mod.updatedAt ?? null

  if (containerStartedAt && modUpdatedAt) {
    return modUpdatedAt > containerStartedAt ? modUpdatedAt : containerStartedAt
  }

  return containerStartedAt ?? modUpdatedAt
}

function isVerificationTimedOut(mod: ConfiguredModEntry, options: ResolveConfiguredModStatusesOptions): boolean {
  const verificationStartedAt = resolveVerificationStartedAt(mod, options)
  if (!verificationStartedAt) {
    return false
  }

  const currentTime = options.currentTime ?? new Date()
  return currentTime.getTime() - verificationStartedAt.getTime() >= MOD_RUNTIME_VERIFICATION_TIMEOUT_MS
}

function uniqueStrings(values: Iterable<string>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = value.trim()
    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

function splitConfiguredModIds(modName: string): string[] {
  return uniqueStrings(modName.split(';'))
}

function classifyLogSeverity(line: string): 'warning' | 'error' | null {
  if (/^FATAL:/i.test(line) || /^ERROR:/i.test(line)) {
    return 'error'
  }

  if (/^WARN\s*:/i.test(line)) {
    return 'warning'
  }

  return null
}

function summarizeLogIssue(line: string, nextLine?: string): string {
  const parts = [line]

  if (nextLine && !/^(LOG|WARN|ERROR|FATAL)\s*:/i.test(nextLine)) {
    parts.push(nextLine)
  }

  return parts
    .join(' ')
    .replace(/^(LOG|WARN|ERROR|FATAL)\s*:\s*/i, '')
    .replace(/\s*f:\d+.*?>\s*/i, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function shouldKeepIssueToken(token: string): boolean {
  if (/^\d{6,}$/.test(token)) {
    return true
  }

  return token.length >= 4
}

function buildIssueTokens(mod: ConfiguredModEntry, installedMods: WorkshopInstalledMod[]): string[] {
  return uniqueStrings([
    mod.workshopId,
    ...splitConfiguredModIds(mod.modName),
    mod.displayName ?? '',
    ...installedMods.map(installedMod => installedMod.name ?? ''),
  ]).filter(shouldKeepIssueToken)
}

function setModLogIssue(issues: Map<string, ModLogIssue>, nextIssue: ModLogIssue) {
  const currentIssue = issues.get(nextIssue.workshopId)
  if (!currentIssue) {
    issues.set(nextIssue.workshopId, nextIssue)
    return
  }

  if (currentIssue.severity === 'error' && nextIssue.severity !== 'error') {
    return
  }

  if (currentIssue.severity === nextIssue.severity && currentIssue.source === 'live-console' && nextIssue.source !== 'live-console') {
    return
  }

  issues.set(nextIssue.workshopId, nextIssue)
}

function setWorkshopStatus(
  statuses: Map<string, WorkshopRuntimeStatus>,
  workshopId: string,
  next: Omit<WorkshopRuntimeStatus, 'workshopId'>,
) {
  const current = statuses.get(workshopId)
  const merged: WorkshopRuntimeStatus = {
    workshopId,
    source: next.source,
    state: next.state,
    detail: next.detail,
    progress: next.state === 'installing'
      ? next.progress ?? current?.progress
      : undefined,
  }

  statuses.set(workshopId, merged)
}

function applyWorkshopStateValue(
  statuses: Map<string, WorkshopRuntimeStatus>,
  workshopId: string,
  rawStateValue: string,
  source: 'live-console' | 'previous-console',
) {
  const normalizedState = rawStateValue.toLowerCase()

  if (/(fail|error|notinstalled)/.test(normalizedState)) {
    setWorkshopStatus(statuses, workshopId, {
      state: 'error',
      detail: 'Workshop item reported an installation error.',
      source,
    })
    return
  }

  if (/(ready|installed)/.test(normalizedState)) {
    setWorkshopStatus(statuses, workshopId, {
      state: 'ready',
      detail: normalizedState.includes('ready')
        ? 'Workshop item is ready.'
        : 'Workshop item is installed.',
      source,
    })
    return
  }

  if (normalizedState.includes('downloading')) {
    setWorkshopStatus(statuses, workshopId, {
      state: 'installing',
      detail: 'Downloading Workshop item.',
      source,
    })
    return
  }

  if (normalizedState.includes('downloadpending')) {
    setWorkshopStatus(statuses, workshopId, {
      state: 'installing',
      detail: 'Workshop item is queued for download.',
      source,
    })
    return
  }

  if (normalizedState.includes('needsupdate')) {
    setWorkshopStatus(statuses, workshopId, {
      state: 'installing',
      detail: 'Workshop item is waiting for an update.',
      source,
    })
    return
  }

  if (normalizedState.includes('checkitemstate')) {
    setWorkshopStatus(statuses, workshopId, {
      state: 'installing',
      detail: 'Checking Workshop item state.',
      source,
    })
    return
  }

  if (normalizedState === 'none') {
    setWorkshopStatus(statuses, workshopId, {
      state: 'installing',
      detail: 'Waiting for the Workshop download to begin.',
      source,
    })
  }
}

export function parseWorkshopRuntimeStatuses(
  logText: string,
  source: 'live-console' | 'previous-console',
): Map<string, WorkshopRuntimeStatus> {
  const lines = splitLogLines(logText).slice(-2000)
  const statuses = new Map<string, WorkshopRuntimeStatus>()

  for (const line of lines) {
    const downloadMatch = line.match(/Workshop:\s+download\s+(\d+)\/(\d+)\s+ID=(\d+)/i)
    if (downloadMatch) {
      const currentBytes = Number(downloadMatch[1])
      const totalBytes = Number(downloadMatch[2])
      const progress = totalBytes > 0
        ? Math.max(0, Math.min(100, Math.round((currentBytes / totalBytes) * 100)))
        : undefined

      setWorkshopStatus(statuses, downloadMatch[3]!, {
        state: 'installing',
        detail: progress !== undefined
          ? `Downloading Workshop item (${progress}%).`
          : 'Downloading Workshop item.',
        progress,
        source,
      })
      continue
    }

    const downloadFinishedMatch = line.match(/Workshop:\s+onItemDownloaded\s+itemID=(\d+)/i)
    if (downloadFinishedMatch) {
      setWorkshopStatus(statuses, downloadFinishedMatch[1]!, {
        state: 'installing',
        detail: 'Workshop download finished. Verifying item.',
        progress: 100,
        source,
      })
      continue
    }

    const transitionMatch = line.match(/Workshop:\s+item state\s+.*?->\s*([A-Za-z]+)\s+ID=(\d+)/i)
    if (transitionMatch) {
      applyWorkshopStateValue(statuses, transitionMatch[2]!, transitionMatch[1]!, source)
      continue
    }

    const itemStateMatch = line.match(/Workshop:\s+.*?GetItemState\(\)=([A-Za-z|]+)\s+ID=(\d+)/i)
    if (itemStateMatch) {
      applyWorkshopStateValue(statuses, itemStateMatch[2]!, itemStateMatch[1]!, source)
      continue
    }

    const errorMatch = line.match(/Workshop:\s+.*?(?:fail|error|notinstalled).*?(?:ID|itemID)=(\d+)/i)
    if (errorMatch) {
      setWorkshopStatus(statuses, errorMatch[1]!, {
        state: 'error',
        detail: 'Workshop item reported an installation error.',
        source,
      })
    }
  }

  return statuses
}

export function parseModLogIssues(
  logText: string,
  mods: ConfiguredModEntry[],
  installedModsByWorkshopId: Map<string, WorkshopInstalledMod[]>,
  source: 'live-console' | 'previous-console',
): Map<string, ModLogIssue> {
  const lines = splitLogLines(logText).slice(-1200)
  const issues = new Map<string, ModLogIssue>()
  const tokensByWorkshopId = new Map(
    mods.map(mod => [mod.workshopId, buildIssueTokens(mod, installedModsByWorkshopId.get(mod.workshopId) ?? [])] as const),
  )

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const severity = classifyLogSeverity(line)
    if (!severity) {
      continue
    }

    const windowText = [line, lines[index + 1] ?? '', lines[index + 2] ?? ''].join('\n').toLowerCase()
    const detail = summarizeLogIssue(line, lines[index + 1])

    for (const mod of mods) {
      const tokens = tokensByWorkshopId.get(mod.workshopId) ?? []
      if (!tokens.length) {
        continue
      }

      if (!tokens.some(token => windowText.includes(token.toLowerCase()))) {
        continue
      }

      setModLogIssue(issues, {
        workshopId: mod.workshopId,
        severity,
        detail,
        source,
      })
    }
  }

  return issues
}

export async function buildInstalledModsByWorkshopId(workshopIds: string[]): Promise<Map<string, WorkshopInstalledMod[]>> {
  const entries = await Promise.all(
    uniqueStrings(workshopIds).map(async workshopId => [workshopId, await readInstalledWorkshopMods(workshopId)] as const),
  )

  return new Map(entries)
}

export function resolveConfiguredModStatuses(
  mods: ConfiguredModEntry[],
  options: ResolveConfiguredModStatusesOptions,
): ConfiguredModStatus[] {
  return mods.map((mod) => {
    const expectedModIds = splitConfiguredModIds(mod.modName)
    const installedMods = options.installedModsByWorkshopId.get(mod.workshopId) ?? []
    const installedModIds = uniqueStrings(installedMods.map(installedMod => installedMod.id))
    const missingModIds = expectedModIds.filter(modId => !installedModIds.includes(modId))
    const liveStatus = options.liveWorkshopStatuses.get(mod.workshopId) ?? null
    const previousStatus = options.previousWorkshopStatuses.get(mod.workshopId) ?? null
    const workshopStatus = liveStatus ?? previousStatus
    const modLogIssue = options.modLogIssues.get(mod.workshopId) ?? null
    const verificationStartedAt = resolveVerificationStartedAt(mod, options)
    const handshake = options.currentSessionRuntimeHandshake
      && (!verificationStartedAt || options.currentSessionRuntimeHandshake.reportedAt >= verificationStartedAt)
      ? options.currentSessionRuntimeHandshake
      : null
    const verificationTimedOut = isVerificationTimedOut(mod, options)
    const handshakeConfirmsMod = Boolean(
      handshake
      && expectedModIds.every(modId => handshake.activeModIds.includes(modId)),
    )
    const handshakeMentionsWorkshop = Boolean(handshake && handshake.activeWorkshopIds.includes(mod.workshopId))

    if (modLogIssue?.severity === 'error') {
      return {
        workshopId: mod.workshopId,
        state: 'error',
        label: 'Errored',
        detail: modLogIssue.detail,
        progress: null,
        source: modLogIssue.source === 'live-console' ? 'live-console-issue' : 'previous-console-issue',
        installedModIds,
        missingModIds,
      }
    }

    if (workshopStatus?.state === 'error') {
      return {
        workshopId: mod.workshopId,
        state: 'error',
        label: 'Errored',
        detail: workshopStatus.detail,
        progress: null,
        source: workshopStatus.source,
        installedModIds,
        missingModIds,
      }
    }

    if (modLogIssue?.severity === 'warning') {
      return {
        workshopId: mod.workshopId,
        state: 'faulty',
        label: 'Faulty',
        detail: modLogIssue.detail,
        progress: null,
        source: modLogIssue.source === 'live-console' ? 'live-console-issue' : 'previous-console-issue',
        installedModIds,
        missingModIds,
      }
    }

    if (missingModIds.length > 0 && installedModIds.length > 0) {
      return {
        workshopId: mod.workshopId,
        state: 'faulty',
        label: 'Faulty',
        detail: `Installed files are missing expected Mod ID(s): ${missingModIds.join(', ')}.`,
        progress: null,
        source: 'installed-files',
        installedModIds,
        missingModIds,
      }
    }

    if (options.serverPhaseState === 'stopped' || options.serverPhaseState === 'not_created') {
      return {
        workshopId: mod.workshopId,
        state: 'unknown',
        label: 'Stopped',
        detail: installedModIds.length > 0
          ? 'Installed files were found, but the server is not running so this mod is not verified in a live session.'
          : 'Start the server to verify this mod in a live session.',
        progress: null,
        source: installedModIds.length > 0 ? 'installed-files' : 'none',
        installedModIds,
        missingModIds,
      }
    }

    if (options.serverPhaseState === 'ready' && handshake) {
      if (handshakeConfirmsMod) {
        return {
          workshopId: mod.workshopId,
          state: 'ok',
          label: 'Running',
          detail: 'Lua bridge confirmed this mod is active in the current server session.',
          progress: null,
          source: 'runtime-handshake',
          installedModIds,
          missingModIds,
        }
      }

      if (handshakeMentionsWorkshop || installedModIds.length > 0) {
        return {
          workshopId: mod.workshopId,
          state: 'faulty',
          label: 'Faulty',
          detail: `Lua bridge did not report the expected Mod ID(s) as active in this server session: ${expectedModIds.join(', ')}.`,
          progress: null,
          source: 'runtime-handshake',
          installedModIds,
          missingModIds,
        }
      }
    }

    if (workshopStatus?.state === 'installing') {
      if (options.serverPhaseState === 'ready' && verificationTimedOut) {
        return {
          workshopId: mod.workshopId,
          state: 'unknown',
          label: 'Unknown',
          detail: `Verification timed out after ${MOD_RUNTIME_VERIFICATION_TIMEOUT_MINUTES} minutes. The manager could not confirm a final runtime state for this mod from workshop logs or the Lua bridge.`,
          progress: null,
          source: workshopStatus.source,
          installedModIds,
          missingModIds,
        }
      }

      return {
        workshopId: mod.workshopId,
        state: 'installing',
        label: 'Installing',
        detail: workshopStatus.detail,
        progress: workshopStatus.progress ?? null,
        source: workshopStatus.source,
        installedModIds,
        missingModIds,
      }
    }

    if (options.serverPhaseState === 'ready') {
      if (!installedModIds.length) {
        return {
          workshopId: mod.workshopId,
          state: 'faulty',
          label: 'Faulty',
          detail: 'The server is online, but no installed mod files were found for this Workshop item.',
          progress: null,
          source: workshopStatus?.source ?? 'none',
          installedModIds,
          missingModIds,
        }
      }

      if (verificationTimedOut) {
        return {
          workshopId: mod.workshopId,
          state: 'unknown',
          label: 'Unknown',
          detail: `Installed files were found, but runtime verification timed out after ${MOD_RUNTIME_VERIFICATION_TIMEOUT_MINUTES} minutes. The manager could not confirm this mod from the Lua bridge or mod-specific log evidence.`,
          progress: null,
          source: workshopStatus?.source ?? 'installed-files',
          installedModIds,
          missingModIds,
        }
      }

      return {
        workshopId: mod.workshopId,
        state: 'installing',
        label: 'Verifying',
        detail: workshopStatus?.state === 'ready'
          ? 'Workshop files are ready. Waiting for the Lua bridge to confirm the mod is active in this server session.'
          : 'Expected Mod ID(s) were found in installed files. Waiting for the Lua bridge to confirm runtime activation.',
        progress: null,
        source: workshopStatus?.source ?? 'installed-files',
        installedModIds,
        missingModIds,
      }
    }

    if (options.serverPhaseState === 'error') {
      return {
        workshopId: mod.workshopId,
        state: 'error',
        label: 'Errored',
        detail: 'The server failed during startup before this mod could be verified.',
        progress: null,
        source: workshopStatus?.source ?? 'none',
        installedModIds,
        missingModIds,
      }
    }

    if (installedModIds.length > 0) {
      return {
        workshopId: mod.workshopId,
        state: 'installing',
        label: 'Starting',
        detail: workshopStatus?.state === 'ready'
          ? 'Workshop item is ready. Waiting for the server to finish starting.'
          : 'Installed files were found. Waiting for the server to finish starting.',
        progress: null,
        source: workshopStatus?.source ?? 'installed-files',
        installedModIds,
        missingModIds,
      }
    }

    return {
      workshopId: mod.workshopId,
      state: 'installing',
      label: 'Starting',
      detail: 'Waiting for server logs to confirm this Workshop item.',
      progress: null,
      source: 'none',
      installedModIds,
      missingModIds,
    }
  })
}