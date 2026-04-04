import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface ParsedItemScriptRecord {
  fullType: string
  moduleName: string
  itemName: string
  sourceFile: string
  itemType: string | null
  displayCategory: string | null
  icon: string | null
  weight: number | null
  tags: string[]
  categories: string[]
  attachmentType: string | null
  attachmentSlots: string[]
  isTwoHandWeapon: boolean | null
  conditionMax: number | null
  conditionLowerChanceOneIn: number | null
  minDamage: number | null
  maxDamage: number | null
  minRange: number | null
  maxRange: number | null
  baseSpeed: number | null
  criticalChance: number | null
  maxHitCount: number | null
  treeDamage: number | null
  doorDamage: number | null
  knockback: number | null
  sharpness: number | null
  rawProperties: Record<string, string>
}

function stripInlineComments(line: string) {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/#.*$/, '')
    .trim()
}

function normalizeValue(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim().replace(/,$/, '').trim()
  if (!trimmed.length) {
    return null
  }

  return trimmed.replace(/^"(.*)"$/, '$1')
}

function parseNumber(value?: string | null) {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseBoolean(value?: string | null) {
  const normalized = normalizeValue(value)?.toLowerCase()
  if (!normalized) {
    return null
  }

  if (['true', 'yes', '1'].includes(normalized)) {
    return true
  }

  if (['false', 'no', '0'].includes(normalized)) {
    return false
  }

  return null
}

function parseStringList(value?: string | null) {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return []
  }

  return normalized
    .split(/[;,]/g)
    .map(entry => entry.trim())
    .filter(Boolean)
}

function parseAttachmentSlots(rawProperties: Record<string, string>) {
  const slots = new Set<string>()

  for (const key of ['CanBeEquipped', 'BodyLocation', 'ClothingItemExtra']) {
    const value = normalizeValue(rawProperties[key])
    if (!value) {
      continue
    }

    for (const entry of value.split(/[;/]/g).map(part => part.trim()).filter(Boolean)) {
      slots.add(entry)
    }
  }

  return [...slots]
}

function parseItemProperties(body: string) {
  const properties: Record<string, string> = {}

  for (const rawLine of body.split(/\r?\n/g)) {
    const line = stripInlineComments(rawLine)
    if (!line || line === '{' || line === '}') {
      continue
    }

    const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+?)\s*,?$/)
    if (!match) {
      continue
    }

    const key = match[1]
    const value = match[2]
    if (!key || !value) {
      continue
    }

    properties[key] = value.trim()
  }

  return properties
}

export function parseItemScriptText(content: string, sourceFile = 'unknown.txt') {
  const records: ParsedItemScriptRecord[] = []
  const modulePattern = /module\s+([A-Za-z0-9_.-]+)\s*(?:\r?\n\s*)?\{([\s\S]*?)^}/gm

  for (const moduleMatch of content.matchAll(modulePattern)) {
    const moduleName = moduleMatch[1]?.trim()
    const moduleBody = moduleMatch[2]

    if (!moduleName || !moduleBody) {
      continue
    }

    const itemPattern = /^\s*item\s+([A-Za-z0-9_.-]+)\s*(?:\r?\n\s*)?\{([\s\S]*?)^\s*}/gm
    for (const itemMatch of moduleBody.matchAll(itemPattern)) {
      const itemName = itemMatch[1]?.trim()
      const itemBody = itemMatch[2]

      if (!itemName || !itemBody) {
        continue
      }

      const rawProperties = parseItemProperties(itemBody)
      records.push({
        fullType: `${moduleName}.${itemName}`,
        moduleName,
        itemName,
        sourceFile,
        itemType: normalizeValue(rawProperties.ItemType),
        displayCategory: normalizeValue(rawProperties.DisplayCategory),
        icon: normalizeValue(rawProperties.Icon),
        weight: parseNumber(rawProperties.Weight),
        tags: parseStringList(rawProperties.Tags),
        categories: parseStringList(rawProperties.Categories),
        attachmentType: normalizeValue(rawProperties.AttachmentType),
        attachmentSlots: parseAttachmentSlots(rawProperties),
        isTwoHandWeapon: parseBoolean(rawProperties.TwoHandWeapon),
        conditionMax: parseNumber(rawProperties.ConditionMax),
        conditionLowerChanceOneIn: parseNumber(rawProperties.ConditionLowerChanceOneIn),
        minDamage: parseNumber(rawProperties.MinDamage),
        maxDamage: parseNumber(rawProperties.MaxDamage),
        minRange: parseNumber(rawProperties.MinRange),
        maxRange: parseNumber(rawProperties.MaxRange),
        baseSpeed: parseNumber(rawProperties.BaseSpeed),
        criticalChance: parseNumber(rawProperties.CriticalChance),
        maxHitCount: parseNumber(rawProperties.MaxHitCount),
        treeDamage: parseNumber(rawProperties.TreeDamage),
        doorDamage: parseNumber(rawProperties.DoorDamage),
        knockback: parseNumber(rawProperties.PushBackMod) ?? parseNumber(rawProperties.KnockdownMod),
        sharpness: parseNumber(rawProperties.Sharpness),
        rawProperties,
      })
    }
  }

  return records
}

async function collectScriptDirectories(rootDir: string, result: string[]) {
  const entries = await readdir(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }

    const fullPath = join(rootDir, entry.name)

    if (entry.name === 'scripts') {
      result.push(fullPath)
      continue
    }

    await collectScriptDirectories(fullPath, result)
  }
}

async function collectTextFiles(rootDir: string, result: string[]) {
  const entries = await readdir(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name)

    if (entry.isDirectory()) {
      await collectTextFiles(fullPath, result)
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.txt')) {
      result.push(fullPath)
    }
  }
}

let cachedRootDir = ''
let cachedScriptIndexPromise: Promise<Map<string, ParsedItemScriptRecord>> | null = null

export async function loadItemScriptCatalog(rootDir: string) {
  if (!rootDir || !existsSync(rootDir)) {
    return new Map<string, ParsedItemScriptRecord>()
  }

  if (cachedScriptIndexPromise && cachedRootDir === rootDir) {
    return cachedScriptIndexPromise
  }

  cachedRootDir = rootDir
  cachedScriptIndexPromise = (async () => {
    const scriptDirectories: string[] = []
    await collectScriptDirectories(rootDir, scriptDirectories)

    const scriptFiles: string[] = []
    for (const directory of scriptDirectories) {
      await collectTextFiles(directory, scriptFiles)
    }

    const records = new Map<string, ParsedItemScriptRecord>()

    for (const filePath of scriptFiles) {
      try {
        const content = await readFile(filePath, 'utf-8')
        for (const record of parseItemScriptText(content, filePath)) {
          if (!records.has(record.fullType)) {
            records.set(record.fullType, record)
          }
        }
      }
      catch (error) {
        logger.warn({ error, filePath }, 'Failed to parse Project Zomboid script file')
      }
    }

    return records
  })()

  return cachedScriptIndexPromise
}
