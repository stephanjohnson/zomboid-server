import { describe, it, expect } from 'vitest'
import { parseServerIni, serializeServerIni, parseSandboxVars, serializeSandboxVars } from '../../server/utils/config-parser'

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
    const input = `# comment\n\n; another comment\nKey=Value`
    const result = parseServerIni(input)
    expect(result).toEqual({ Key: 'Value' })
  })

  it('handles values with = signs', () => {
    const input = `ModList=mod1=v1;mod2=v2`
    const result = parseServerIni(input)
    expect(result).toEqual({ ModList: 'mod1=v1;mod2=v2' })
  })
})

describe('serializeServerIni', () => {
  it('serializes key-value pairs', () => {
    const data = { DefaultPort: '16261', MaxPlayers: '16' }
    const result = serializeServerIni(data)
    expect(result).toBe('DefaultPort=16261\nMaxPlayers=16')
  })
})

describe('parseSandboxVars', () => {
  it('parses Lua sandbox vars', () => {
    const input = `SandboxVars = {
    Zombies = 3,
    ZombieLore = true,
    Speed = 2.5,
    MapName = "Muldraugh",
}`
    const result = parseSandboxVars(input)
    expect(result).toEqual({
      Zombies: 3,
      ZombieLore: true,
      Speed: 2.5,
      MapName: 'Muldraugh',
    })
  })
})

describe('serializeSandboxVars', () => {
  it('serializes to Lua format', () => {
    const data = { Zombies: 3, MapName: 'Test' }
    const result = serializeSandboxVars(data)
    expect(result).toContain('SandboxVars = {')
    expect(result).toContain('Zombies = 3,')
    expect(result).toContain('MapName = "Test",')
    expect(result).toContain('}')
  })
})
