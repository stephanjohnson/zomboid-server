import { describe, expect, it } from 'vitest'

import {
  buildServerIniEditorSettings,
  normalizeSandboxEditorSettings,
  splitServerIniEditorSettings,
} from '../../server/utils/config-editor'

describe('buildServerIniEditorSettings', () => {
  it('builds an editor snapshot with profile-backed values and managed mod lists', () => {
    const result = buildServerIniEditorSettings({
      gamePort: 17261,
      directPort: 17262,
      rconPort: 28015,
      rconPassword: 'super-secret',
      mapName: 'Riverside, KY',
      maxPlayers: 24,
      pvp: false,
      serverIniOverrides: {
        Public: 'false',
        PauseEmpty: 'false',
      },
      mods: [
        {
          workshopId: '2200148440',
          modName: 'Brita;Arsenal26GunFighter',
          isEnabled: true,
        },
      ],
    })

    expect(result.DefaultPort).toBe('17261')
    expect(result.UDPPort).toBe('17262')
    expect(result.RCONPort).toBe('28015')
    expect(result.RCONPassword).toBe('super-secret')
    expect(result.Map).toBe('Riverside, KY')
    expect(result.MaxPlayers).toBe('24')
    expect(result.PVP).toBe('false')
    expect(result.Public).toBe('false')
    expect(result.PauseEmpty).toBe('false')
    expect(result.Mods).toBe('Brita;Arsenal26GunFighter;ZomboidManager')
    expect(result.WorkshopItems).toBe('2200148440;3685323705')
  })
})

describe('splitServerIniEditorSettings', () => {
  it('splits profile-backed values from override values and drops default overrides', () => {
    const result = splitServerIniEditorSettings({
      DefaultPort: '17261',
      UDPPort: '17262',
      RCONPort: '28015',
      RCONPassword: 'super-secret',
      Map: 'Riverside, KY',
      MaxPlayers: '24',
      PVP: 'false',
      Public: 'true',
      PauseEmpty: 'false',
      Mods: 'Brita;Arsenal26GunFighter;ZomboidManager',
      WorkshopItems: '2200148440;3685323705',
    })

    expect(result.profileData).toEqual({
      gamePort: 17261,
      directPort: 17262,
      rconPort: 28015,
      rconPassword: 'super-secret',
      mapName: 'Riverside, KY',
      maxPlayers: 24,
      pvp: false,
    })

    expect(result.overrideSettings).toEqual({
      PauseEmpty: 'false',
    })
  })
})

describe('normalizeSandboxEditorSettings', () => {
  it('parses raw sandbox values into nested objects and omits metadata defaults', () => {
    const result = normalizeSandboxEditorSettings({
      DayLength: '3',
      'ZombieLore.Speed': '2',
      'ZombieConfig.RespawnHours': '48',
      'ZombieConfig.RespawnMultiplier': '0.25',
      FoodLoot: '4',
      XpMultiplier: '2.5',
    }, {})

    expect(result).toEqual({
      ZombieLore: {
        Speed: 2,
      },
      ZombieConfig: {
        RespawnHours: 48,
        RespawnMultiplier: 0.25,
      },
      FoodLoot: 4,
      XpMultiplier: 2.5,
    })
  })
})