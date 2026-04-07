import { describe, expect, it } from 'vitest'

import {
  MOD_RUNTIME_VERIFICATION_TIMEOUT_MS,
  parseModLogIssues,
  parseWorkshopRuntimeStatuses,
  resolveConfiguredModStatuses,
} from '../../server/utils/mod-status'

describe('parseWorkshopRuntimeStatuses', () => {
  it('tracks workshop download progress for a workshop item', () => {
    const statuses = parseWorkshopRuntimeStatuses([
      'LOG  : General > Workshop: item state CheckItemState -> DownloadPending ID=3437629766',
      'LOG  : General > Workshop: download 310608/621216 ID=3437629766',
    ].join('\n'), 'live-console')

    expect(statuses.get('3437629766')).toEqual({
      workshopId: '3437629766',
      state: 'installing',
      detail: 'Downloading Workshop item (50%).',
      progress: 50,
      source: 'live-console',
    })
  })

  it('marks a workshop item ready when the ready transition appears', () => {
    const statuses = parseWorkshopRuntimeStatuses([
      'LOG  : General > Workshop: GetItemState()=Installed ID=3508537032',
      'LOG  : General > Workshop: item state CheckItemState -> Ready ID=3508537032',
    ].join('\n'), 'live-console')

    expect(statuses.get('3508537032')).toEqual({
      workshopId: '3508537032',
      state: 'ready',
      detail: 'Workshop item is ready.',
      source: 'live-console',
    })
  })
})

describe('parseModLogIssues', () => {
  it('detects a mod-specific error from recent server console lines', () => {
    const issues = parseModLogIssues([
      'ERROR: General      f:0, t:1775483463000, st:1,154,000> Exception loading mod file',
      'mods/CleanUI/media/lua/client/CleanUI_Init.lua: attempt to index nil value',
    ].join('\n'), [
      { workshopId: '3437629766', modName: 'CleanUI', displayName: 'Clean UI' },
    ], new Map([
      ['3437629766', [{ id: 'CleanUI', name: 'Clean UI', relativePath: 'mods/CleanUI/mod.info' }]],
    ]), 'live-console')

    expect(issues.get('3437629766')).toMatchObject({
      severity: 'error',
      source: 'live-console',
    })
  })
})

describe('resolveConfiguredModStatuses', () => {
  const containerStartedAt = new Date('2026-04-06T16:00:00Z')
  const currentTime = new Date('2026-04-06T16:05:00Z')

  it('reports a mod as running when the runtime handshake confirms the active Mod IDs', () => {
    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: containerStartedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map([
        ['3437629766', {
          workshopId: '3437629766',
          state: 'ready',
          detail: 'Workshop item is ready.',
          source: 'live-console',
        }],
      ]),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: {
        reportedAt: new Date('2026-04-06T16:00:00Z'),
        reason: 'server_started',
        activeModIds: ['CleanUI', 'ZomboidManager'],
        activeWorkshopIds: ['3437629766', '3685323705'],
      },
      modLogIssues: new Map(),
      containerStartedAt,
      currentTime,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'ok',
      label: 'Running',
      source: 'runtime-handshake',
    })
  })

  it('reports a mod as faulty when installed files miss configured Mod IDs', () => {
    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI;NeatUI_Framework', updatedAt: containerStartedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map(),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: null,
      modLogIssues: new Map(),
      containerStartedAt,
      currentTime,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'faulty',
      missingModIds: ['NeatUI_Framework'],
      source: 'installed-files',
    })
  })

  it('keeps the status unknown when the server is stopped', () => {
    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: containerStartedAt },
    ], {
      serverPhaseState: 'stopped',
      liveWorkshopStatuses: new Map(),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: null,
      modLogIssues: new Map(),
      containerStartedAt,
      currentTime,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'unknown',
      label: 'Stopped',
      source: 'installed-files',
    })
  })

  it('keeps a mod in verifying state until the current server session sends a runtime handshake', () => {
    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: containerStartedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map([
        ['3437629766', {
          workshopId: '3437629766',
          state: 'ready',
          detail: 'Workshop item is ready.',
          source: 'live-console',
        }],
      ]),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: null,
      modLogIssues: new Map(),
      containerStartedAt,
      currentTime,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'installing',
      label: 'Verifying',
    })
  })

  it('surfaces mod-specific warning lines as faulty state', () => {
    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: containerStartedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map(),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: null,
      modLogIssues: new Map([
        ['3437629766', {
          workshopId: '3437629766',
          severity: 'warning',
          detail: 'CleanUI emitted a warning during startup.',
          source: 'live-console',
        }],
      ]),
      containerStartedAt,
      currentTime,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'faulty',
      source: 'live-console-issue',
    })
  })

  it('marks a mod unknown when verification times out without conclusive runtime proof', () => {
    const timedOutNow = new Date(containerStartedAt.getTime() + MOD_RUNTIME_VERIFICATION_TIMEOUT_MS + 1000)

    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: containerStartedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map([
        ['3437629766', {
          workshopId: '3437629766',
          state: 'ready',
          detail: 'Workshop item is ready.',
          source: 'live-console',
        }],
      ]),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: null,
      modLogIssues: new Map(),
      containerStartedAt,
      currentTime: timedOutNow,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'unknown',
      label: 'Unknown',
      source: 'live-console',
    })
    expect(statuses[0]?.detail).toContain('timed out')
  })

  it('uses the mod update time as the verification timeout baseline', () => {
    const longRunningServerStartedAt = new Date('2026-04-06T15:00:00Z')
    const recentlyRevalidatedAt = new Date('2026-04-06T16:20:00Z')
    const shortlyAfterRevalidation = new Date('2026-04-06T16:21:00Z')

    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: recentlyRevalidatedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map([
        ['3437629766', {
          workshopId: '3437629766',
          state: 'ready',
          detail: 'Workshop item is ready.',
          source: 'live-console',
        }],
      ]),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: null,
      modLogIssues: new Map(),
      containerStartedAt: longRunningServerStartedAt,
      currentTime: shortlyAfterRevalidation,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'installing',
      label: 'Verifying',
    })
  })

  it('ignores stale runtime handshakes from before a mod was revalidated', () => {
    const modRevalidatedAt = new Date('2026-04-06T16:10:00Z')

    const statuses = resolveConfiguredModStatuses([
      { workshopId: '3437629766', modName: 'CleanUI', updatedAt: modRevalidatedAt },
    ], {
      serverPhaseState: 'ready',
      liveWorkshopStatuses: new Map([
        ['3437629766', {
          workshopId: '3437629766',
          state: 'ready',
          detail: 'Workshop item is ready.',
          source: 'live-console',
        }],
      ]),
      previousWorkshopStatuses: new Map(),
      installedModsByWorkshopId: new Map([
        ['3437629766', [{ id: 'CleanUI', name: 'CleanUI', relativePath: 'mods/CleanUI/mod.info' }]],
      ]),
      currentSessionRuntimeHandshake: {
        reportedAt: new Date('2026-04-06T16:08:00Z'),
        reason: 'heartbeat',
        activeModIds: ['CleanUI'],
        activeWorkshopIds: ['3437629766'],
      },
      modLogIssues: new Map(),
      containerStartedAt,
      currentTime,
    })

    expect(statuses[0]).toMatchObject({
      workshopId: '3437629766',
      state: 'installing',
      label: 'Verifying',
    })
  })
})