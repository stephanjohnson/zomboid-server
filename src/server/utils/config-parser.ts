import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { getPzDataPath } from './runtime-paths'

/**
 * Parse a PZ server.ini file into a key-value map.
 */
export function parseServerIni(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    result[key] = value
  }
  return result
}

/**
 * Serialize a key-value map back to server.ini format.
 */
export function serializeServerIni(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

/**
 * Read and parse server.ini from disk.
 */
export function readServerIni(servername: string): Record<string, string> {
  const iniPath = join(getPzDataPath(), 'Server', `${servername}.ini`)

  if (!existsSync(iniPath)) {
    throw createError({ statusCode: 404, message: `server.ini not found for "${servername}"` })
  }

  const content = readFileSync(iniPath, 'utf-8')
  return parseServerIni(content)
}

/**
 * Write server.ini to disk.
 */
export function writeServerIni(servername: string, data: Record<string, string>): void {
  const iniPath = join(getPzDataPath(), 'Server', `${servername}.ini`)
  mkdirSync(dirname(iniPath), { recursive: true })
  writeFileSync(iniPath, serializeServerIni(data), 'utf-8')
}

/**
 * Parse SandboxVars.lua into a nested object.
 * Handles the basic `SandboxVars = { key = value }` format.
 */
export function parseSandboxVars(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('--') || trimmed === 'SandboxVars = {' || trimmed === '}') continue

    const match = trimmed.match(/^(\w+)\s*=\s*(.+?),?\s*$/)
    if (match) {
      const [, key, rawValue] = match
      let value: unknown = rawValue

      if (rawValue === 'true') value = true
      else if (rawValue === 'false') value = false
      else if (/^\d+(\.\d+)?$/.test(rawValue)) value = Number(rawValue)
      else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
        value = rawValue.slice(1, -1)
      }

      result[key] = value
    }
  }
  return result
}

/**
 * Serialize a flat object back to SandboxVars.lua format.
 */
export function serializeSandboxVars(data: Record<string, unknown>): string {
  const lines = ['SandboxVars = {']
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      lines.push(`    ${key} = "${value}",`)
    }
    else {
      lines.push(`    ${key} = ${value},`)
    }
  }
  lines.push('}')
  return lines.join('\n')
}

/**
 * Read SandboxVars.lua from disk.
 */
export function readSandboxVars(servername: string): Record<string, unknown> {
  const luaPath = join(getPzDataPath(), 'Server', `${servername}_SandboxVars.lua`)

  if (!existsSync(luaPath)) {
    throw createError({ statusCode: 404, message: `SandboxVars.lua not found for "${servername}"` })
  }

  const content = readFileSync(luaPath, 'utf-8')
  return parseSandboxVars(content)
}

/**
 * Write SandboxVars.lua to disk.
 */
export function writeSandboxVars(servername: string, data: Record<string, unknown>): void {
  const luaPath = join(getPzDataPath(), 'Server', `${servername}_SandboxVars.lua`)
  mkdirSync(dirname(luaPath), { recursive: true })
  writeFileSync(luaPath, serializeSandboxVars(data), 'utf-8')
}
