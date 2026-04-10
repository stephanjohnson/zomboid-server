import { describe, expect, it } from 'vitest'

import { createTelemetryPresetBundle } from '../../app/composables/useTelemetryStudio'

describe('createTelemetryPresetBundle', () => {
  it('creates an unlock-pvp objective preset with a restart-based server setting mutation', () => {
    const preset = createTelemetryPresetBundle('unlock-pvp-objective', [])

    expect(preset.workflow).toMatchObject({
      key: 'objective.unlock-pvp',
      name: 'Unlock PvP Objective',
      kind: 'objective',
      steps: [
        expect.objectContaining({
          stepOrder: 1,
          eventKey: 'objective.hidden-item.discovered',
        }),
      ],
    })

    expect(preset.actionRule).toMatchObject({
      name: 'Unlock PvP on completion',
      triggerKind: 'WORKFLOW',
      triggerKey: 'objective.unlock-pvp',
      moneyAmount: 0,
      xpAmount: 0,
      xpCategoryAmount: 0,
    })

    expect(JSON.parse(preset.actionRule.configText)).toEqual({
      badge: 'pvp-unlocked',
      rewardType: 'objective',
      serverSettings: {
        PVP: true,
      },
      serverSettingsApplyMode: 'restart-server',
    })
  })

  it('deduplicates the unlock-pvp objective key when the base key already exists', () => {
    const preset = createTelemetryPresetBundle('unlock-pvp-objective', ['objective.unlock-pvp'])

    expect(preset.workflow.key).toBe('objective.unlock-pvp.2')
    expect(preset.actionRule.triggerKey).toBe('objective.unlock-pvp.2')
  })
})