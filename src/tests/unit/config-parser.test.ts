import { describe, expect, it } from 'vitest'

import {
  parseSandboxVars,
  parseServerIni,
  serializeSandboxVars,
  serializeServerIni,
} from '../../server/utils/config-parser'

describe('parseServerIni', () => {
  it('parses key=value pairs', () => {
    const input = `
# Comment
DefaultPort=16261
MaxPlayers=16
PVP=true
ServerName=My Server
`

    const result = parseServerIni(input)

    expect(result).toEqual({
      DefaultPort: '16261',
      MaxPlayers: '16',
      PVP: 'true',
      ServerName: 'My Server',
    })
  })

  it('ignores comments and empty lines', () => {
    const result = parseServerIni(`# comment\n\n; another comment\nKey=Value`)

    expect(result).toEqual({ Key: 'Value' })
  })

  it('handles values with = signs', () => {
    const result = parseServerIni('ModList=mod1=v1;mod2=v2')

    expect(result).toEqual({ ModList: 'mod1=v1;mod2=v2' })
  })
})

describe('serializeServerIni', () => {
  it('serializes key-value pairs', () => {
    const result = serializeServerIni({ DefaultPort: '16261', MaxPlayers: '16' })

    expect(result).toBe('DefaultPort=16261\nMaxPlayers=16')
  })
})

describe('serializeSandboxVars', () => {
  it('writes nested sandbox groups as valid Lua tables', () => {
    const result = serializeSandboxVars({
      DayLength: 3,
      'ZombieLore.Speed': 2,
      ZombieConfig: {
        RespawnHours: 72,
        RespawnMultiplier: 0.1,
      },
    })

    expect(result).toContain('SandboxVars = {')
    expect(result).toContain('DayLength = 3,')
    expect(result).toContain('ZombieLore = {')
    expect(result).toContain('Speed = 2,')
    expect(result).toContain('ZombieConfig = {')
    expect(result).toContain('RespawnHours = 72,')
    expect(result).toContain('RespawnMultiplier = 0.1,')
  })
})

describe('parseSandboxVars', () => {
  it('parses nested Lua tables into nested objects', () => {
    const result = parseSandboxVars(`SandboxVars = {
    DayLength = 3,
    ZombieLore = {
        Speed = 2,
        Strength = 3,
    },
    ZombieConfig = {
        RespawnHours = 72,
    },
}`)

    expect(result).toEqual({
      DayLength: 3,
      ZombieLore: {
        Speed: 2,
        Strength: 3,
      },
      ZombieConfig: {
        RespawnHours: 72,
      },
    })
  })
})
