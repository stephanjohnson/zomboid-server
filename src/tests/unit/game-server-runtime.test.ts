import { describe, expect, it } from 'vitest'

import { buildSandboxVarsSettings, buildServerIniSettings } from '../../server/utils/game-server-runtime'

describe('buildServerIniSettings', () => {
  it('builds a first-boot server.ini from the profile and preserves required mod wiring', () => {
    const result = buildServerIniSettings({
      servername: 'weekend-survivors',
      gamePort: 17261,
      directPort: 17262,
      rconPort: 28015,
      mapName: 'Riverside, KY',
      maxPlayers: 24,
      pvp: false,
      serverIniOverrides: {
        Mods: 'TsarsCommonLibrary',
        WorkshopItems: '2392709985',
        Public: 'false',
      },
    }, 'secret-rcon')

    expect(result.DefaultPort).toBe('17261')
    expect(result.UDPPort).toBe('17262')
    expect(result.RCONPort).toBe('28015')
    expect(result.RCONPassword).toBe('secret-rcon')
    expect(result.Map).toBe('Riverside, KY')
    expect(result.MaxPlayers).toBe('24')
    expect(result.PVP).toBe('false')
    expect(result.Public).toBe('false')
    expect(result.DoLuaChecksum).toBe('false')
    expect(result.Mods).toBe('TsarsCommonLibrary;ZomboidManager')
    expect(result.WorkshopItems).toBe('2392709985;3685323705')
  })

  it('merges ordered profile mods into Mods and WorkshopItems', () => {
    const result = buildServerIniSettings({
      servername: 'weekend-survivors',
      gamePort: 17261,
      directPort: 17262,
      rconPort: 28015,
      mapName: 'Riverside, KY',
      maxPlayers: 24,
      pvp: false,
      serverIniOverrides: {
        Mods: 'TsarsCommonLibrary',
        WorkshopItems: '2392709985',
      },
      mods: [
        {
          workshopId: '2200148440',
          modName: 'Brita;Arsenal26GunFighter',
          isEnabled: true,
        },
      ],
    }, 'secret-rcon')

    expect(result.Mods).toBe('TsarsCommonLibrary;Brita;Arsenal26GunFighter;ZomboidManager')
    expect(result.WorkshopItems).toBe('2392709985;2200148440;3685323705')
  })

  it('preserves a DoLuaChecksum override instead of forcing it off', () => {
    const result = buildServerIniSettings({
      servername: 'weekend-survivors',
      gamePort: 17261,
      directPort: 17262,
      rconPort: 28015,
      mapName: 'Riverside, KY',
      maxPlayers: 24,
      pvp: false,
      serverIniOverrides: {
        DoLuaChecksum: 'true',
      },
    }, 'secret-rcon')

    expect(result.DoLuaChecksum).toBe('true')
  })
})

describe('buildSandboxVarsSettings', () => {
  it('returns DB-backed sandbox overrides as-is', () => {
    const result = buildSandboxVarsSettings({
      servername: 'weekend-survivors',
      gamePort: 16261,
      directPort: 16262,
      rconPort: 27015,
      mapName: 'Muldraugh, KY',
      maxPlayers: 16,
      pvp: true,
      sandboxVarsOverrides: {
        Zombies: 2,
        ZombieLore: {
          Speed: 2,
        },
      },
    })

    expect(result).toEqual({
      Zombies: 2,
      ZombieLore: {
        Speed: 2,
      },
    })
  })
})
