import { describe, expect, it } from 'vitest'

import { stripManagedModOverrides } from '../../server/utils/game-server-runtime'

describe('stripManagedModOverrides', () => {
  it('removes Mods and WorkshopItems from raw ini overrides', () => {
    expect(stripManagedModOverrides({
      Public: 'false',
      Mods: 'LegacyManualMod',
      WorkshopItems: '999999999',
    })).toEqual({
      Public: 'false',
    })
  })
})