import { describe, expect, it } from 'vitest'

import { buildEditorDisplayValues, groupConfigEntries } from '../../shared/config-settings'
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
      DoLuaChecksum: 'true',
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
      DoLuaChecksum: 'true',
      PauseEmpty: 'false',
    })
  })
})

describe('server.ini config metadata coverage', () => {
  it('surfaces the expanded server setting catalog with defaults and group placement', () => {
    const values = buildEditorDisplayValues('server-ini', {})

    expect(values.GlobalChat).toBe('true')
    expect(values.ChatStreams).toBe('s,r,a,w,y,sh,f,all')
    expect(values.DoLuaChecksum).toBe('false')
    expect(values.BadWordPolicy).toBe('3')
    expect(values.SteamScoreboard).toBe('false')
    expect(values.PublicDescription).toBe('')

    const groups = groupConfigEntries('server-ini', {
      PublicDescription: values.PublicDescription,
      GlobalChat: values.GlobalChat,
      SafetySystem: values.SafetySystem,
      Faction: values.Faction,
      AntiCheatSafety: values.AntiCheatSafety,
    })

    const entriesByGroup = Object.fromEntries(groups.map(group => [
      group.group,
      group.entries.map(entry => entry.key),
    ]))

    expect(entriesByGroup['Access & Visibility']).toContain('PublicDescription')
    expect(entriesByGroup['Chat & Identity']).toContain('GlobalChat')
    expect(entriesByGroup['PvP & Safety']).toContain('SafetySystem')
    expect(entriesByGroup['Safehouses & Factions']).toContain('Faction')
    expect(entriesByGroup['Anti-Cheat']).toContain('AntiCheatSafety')
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

describe('sandbox config metadata coverage', () => {
  it('surfaces sibling-derived sandbox settings with defaults and expected groups', () => {
    const values = buildEditorDisplayValues('sandbox', {})

    expect(values.StartMonth).toBe('7')
    expect(values.Zombies).toBe('3')
    expect(values['ZombieConfig.PopulationStartMultiplier']).toBe('1')
    expect(values['ZombieLore.Decomp']).toBe('1')
    expect(values.WaterShut).toBe('2')
    expect(values.ElecShut).toBe('2')

    const groups = groupConfigEntries('sandbox', {
      StartMonth: values.StartMonth,
      Zombies: values.Zombies,
      'ZombieLore.Decomp': values['ZombieLore.Decomp'],
      WaterShut: values.WaterShut,
    })

    expect(groups).toEqual([
      {
        group: 'World Time',
        entries: [
          expect.objectContaining({ key: 'StartMonth' }),
        ],
      },
      {
        group: 'Zombie Population',
        entries: [
          expect.objectContaining({ key: 'Zombies' }),
        ],
      },
      {
        group: 'Zombie Behavior',
        entries: [
          expect.objectContaining({ key: 'ZombieLore.Decomp' }),
        ],
      },
      {
        group: 'Climate & Utilities',
        entries: [
          expect.objectContaining({ key: 'WaterShut' }),
        ],
      },
    ])
  })
})