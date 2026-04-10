import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { expandDotNotationRecord } from '../../shared/config-settings'
import { getPzDataPath } from './runtime-paths'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseSandboxValue(rawValue: string): unknown {
  const normalizedValue = rawValue.trim().replace(/,$/, '')

  if (normalizedValue === 'true') {
    return true
  }

  if (normalizedValue === 'false') {
    return false
  }

  if (/^-?\d+(\.\d+)?$/.test(normalizedValue)) {
    return Number(normalizedValue)
  }

  if (normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) {
    return normalizedValue.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }

  return normalizedValue
}

function formatSandboxValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0'
  }

  const normalizedValue = typeof value === 'string' ? value : String(value ?? '')
  return `"${normalizedValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function normalizeSandboxTree(data: Record<string, unknown>): Record<string, unknown> {
  const expandedData = expandDotNotationRecord(data)
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(expandedData)) {
    result[key] = isPlainObject(value)
      ? normalizeSandboxTree(value)
      : value
  }

  return result
}

function stringifySandboxTable(data: Record<string, unknown>, indentLevel: number): string[] {
  const lines: string[] = []
  const indent = '    '.repeat(indentLevel)

  for (const [key, value] of Object.entries(data)) {
    if (isPlainObject(value)) {
      lines.push(`${indent}${key} = {`)
      lines.push(...stringifySandboxTable(value, indentLevel + 1))
      lines.push(`${indent}},`)
      continue
    }

    lines.push(`${indent}${key} = ${formatSandboxValue(value)},`)
  }

  return lines
}

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
 * Handles the common `SandboxVars = { ZombieLore = { Speed = 3 } }` format.
 */
export function parseSandboxVars(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = content.split('\n')
  const stack: Record<string, unknown>[] = [result]

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('--')) continue

    const openTableMatch = trimmed.match(/^(\w+)\s*=\s*\{$/)
    if (openTableMatch) {
      const [, key] = openTableMatch
      if (key === 'SandboxVars' && stack.length === 1) {
        continue
      }

      const nextTable: Record<string, unknown> = {}
      stack[stack.length - 1]![key] = nextTable
      stack.push(nextTable)
      continue
    }

    if (/^\},?$/.test(trimmed)) {
      if (stack.length > 1) {
        stack.pop()
      }
      continue
    }

    const match = trimmed.match(/^(\w+)\s*=\s*(.+?),?\s*(--.*)?$/)
    if (match) {
      const [, key, rawValue] = match
      stack[stack.length - 1]![key] = parseSandboxValue(rawValue)
    }
  }

  return result
}

/**
 * Serialize a nested object back to SandboxVars.lua format.
 */
export function serializeSandboxVars(data: Record<string, unknown>): string {
  const lines = ['SandboxVars = {']
  lines.push(...stringifySandboxTable(normalizeSandboxTree(data), 1))
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
