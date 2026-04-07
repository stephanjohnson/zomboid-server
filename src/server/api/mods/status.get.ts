import * as v from 'valibot'

import {
  buildInstalledModsByWorkshopId,
  parseModLogIssues,
  parseWorkshopRuntimeStatuses,
  resolveConfiguredModStatuses,
} from '../../utils/mod-status'
import { readPreviousConsoleLog, readServerConsoleLog, resolveServerPhase } from '../../utils/server-logs'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string').map(entry => entry.trim()).filter(Boolean))]
}

function getModRuntimeReportDelegate() {
  const delegate = (prisma as Record<string, unknown>).modRuntimeReport

  if (!delegate || typeof delegate !== 'object' || !('findFirst' in delegate) || typeof delegate.findFirst !== 'function') {
    return null
  }

  return delegate as {
    findFirst: (args: {
      where: { profileId?: string }
      orderBy: { reportedAt: 'desc' }
    }) => Promise<{
      reportedAt: Date
      reason: string | null
      activeModIds: unknown
      activeWorkshopIds: unknown
    } | null>
  }
}

export default defineEventHandler(async (event) => {
  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))

  const where = profileId ? { profileId } : {}
  const modRuntimeReport = getModRuntimeReportDelegate()
  const mods = await prisma.mod.findMany({
    where,
    orderBy: { order: 'asc' },
    select: {
      workshopId: true,
      modName: true,
      displayName: true,
      updatedAt: true,
    },
  })

  const [containerStatus, serverConsole, previousConsole, latestRuntimeReport] = await Promise.all([
    getContainerStatus(),
    Promise.resolve(readServerConsoleLog()),
    Promise.resolve(readPreviousConsoleLog()),
    modRuntimeReport
      ? modRuntimeReport.findFirst({
          where,
          orderBy: { reportedAt: 'desc' },
        })
      : Promise.resolve(null),
  ])

  let phase: { state: string, label: string, detail?: string, progress?: number }

  if (!containerStatus.exists) {
    phase = { state: 'not_created', label: 'Not Created' }
  }
  else if (!containerStatus.running) {
    phase = { state: 'stopped', label: 'Stopped' }
  }
  else if (await isServerRunning()) {
    phase = { state: 'ready', label: 'Online' }
  }
  else {
    phase = resolveServerPhase(await getContainerLogs(1200), serverConsole)
  }

  const installedModsByWorkshopId = await buildInstalledModsByWorkshopId(mods.map(mod => mod.workshopId))
  const liveLogIssues = parseModLogIssues(serverConsole, mods, installedModsByWorkshopId, 'live-console')
  const previousLogIssues = parseModLogIssues(previousConsole ?? '', mods, installedModsByWorkshopId, 'previous-console')
  const mergedLogIssues = new Map([...previousLogIssues, ...liveLogIssues])
  const containerStartedAt = containerStatus.startedAt ? new Date(containerStatus.startedAt) : null
  const currentSessionRuntimeHandshake = latestRuntimeReport
    && (!containerStartedAt || latestRuntimeReport.reportedAt >= containerStartedAt)
    ? {
        reportedAt: latestRuntimeReport.reportedAt,
        reason: latestRuntimeReport.reason,
        activeModIds: readStringArray(latestRuntimeReport.activeModIds),
        activeWorkshopIds: readStringArray(latestRuntimeReport.activeWorkshopIds),
      }
    : null
  const statuses = resolveConfiguredModStatuses(mods, {
    serverPhaseState: phase.state,
    liveWorkshopStatuses: parseWorkshopRuntimeStatuses(serverConsole, 'live-console'),
    previousWorkshopStatuses: parseWorkshopRuntimeStatuses(previousConsole ?? '', 'previous-console'),
    installedModsByWorkshopId,
    currentSessionRuntimeHandshake,
    modLogIssues: mergedLogIssues,
    containerStartedAt,
    currentTime: new Date(),
  })

  return {
    server: phase,
    statuses,
  }
})