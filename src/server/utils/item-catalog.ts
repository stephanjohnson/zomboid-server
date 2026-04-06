import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { loadItemScriptCatalog } from './item-script-catalog'
import type { ParsedItemScriptRecord } from './item-script-catalog'

export interface GameCatalogEntry {
  fullType: string
  name: string
  category: string | null
  displayCategory: string | null
  iconName: string | null
  textureIcon: string | null
  iconUrl: string | null
  source: 'lua_bridge' | 'scripts' | 'telemetry'
  itemType: string | null
  weight: number | null
  tags: string[]
  categories: string[]
  attachmentType: string | null
  attachmentSlots: string[]
  isTwoHandWeapon: boolean | null
  maxCondition: number | null
  conditionLowerChance: number | null
  minDamage: number | null
  maxDamage: number | null
  minRange: number | null
  maxRange: number | null
  attackSpeed: number | null
  critChance: number | null
  maxHitCount: number | null
  treeDamage: number | null
  doorDamage: number | null
  knockback: number | null
  sharpness: number | null
  scriptSource: string | null
  scriptProperties: Record<string, string> | null
}

function humanizeItemToken(token: string) {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function humanizeItemCode(fullType: string) {
  const [, rawName = fullType] = fullType.split('.', 2)
  return humanizeItemToken(rawName)
}

function mapScriptCatalogEntry(record: ParsedItemScriptRecord): GameCatalogEntry {
  const category = record.displayCategory ?? record.itemType

  return {
    fullType: record.fullType,
    name: humanizeItemToken(record.itemName),
    category,
    displayCategory: category,
    iconName: record.icon,
    textureIcon: record.icon,
    iconUrl: buildPzWikiFileUrl(record.icon),
    source: 'scripts',
    itemType: record.itemType,
    weight: record.weight,
    tags: record.tags,
    categories: record.categories,
    attachmentType: record.attachmentType,
    attachmentSlots: record.attachmentSlots,
    isTwoHandWeapon: record.isTwoHandWeapon,
    maxCondition: record.conditionMax,
    conditionLowerChance: record.conditionLowerChanceOneIn,
    minDamage: record.minDamage,
    maxDamage: record.maxDamage,
    minRange: record.minRange,
    maxRange: record.maxRange,
    attackSpeed: record.baseSpeed,
    critChance: record.criticalChance,
    maxHitCount: record.maxHitCount,
    treeDamage: record.treeDamage,
    doorDamage: record.doorDamage,
    knockback: record.knockback,
    sharpness: record.sharpness,
    scriptSource: record.sourceFile,
    scriptProperties: record.rawProperties,
  }
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))
      ? Number(value)
      : null
}

function normalizeBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(entry => typeof entry === 'string' ? entry.trim() : '')
        .filter(Boolean)
    : []
}

export function buildPzWikiFileUrl(fileName?: string | null) {
  if (!fileName || !fileName.trim().length) {
    return null
  }

  const normalizedFileName = fileName.trim().endsWith('.png')
    ? fileName.trim()
    : `${fileName.trim()}.png`

  return `https://pzwiki.net/wiki/Special:FilePath/${encodeURIComponent(normalizedFileName)}`
}

function normalizeCatalogEntry(
  value: unknown,
  source: GameCatalogEntry['source'],
): GameCatalogEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const fullType = typeof record.full_type === 'string'
    ? record.full_type
    : typeof record.fullType === 'string'
      ? record.fullType
      : null

  if (!fullType) {
    return null
  }

  const name = typeof record.name === 'string' && record.name.trim().length > 0
    ? record.name.trim()
    : humanizeItemCode(fullType)

  const category = typeof record.category === 'string' && record.category.trim().length > 0
    ? record.category.trim()
    : null

  const displayCategory = normalizeString(record.display_category) ?? category
  const iconName = typeof record.icon_name === 'string'
    ? record.icon_name
    : typeof record.iconName === 'string'
      ? record.iconName
      : null
  const textureIcon = normalizeString(record.texture_icon) ?? normalizeString(record.textureIcon)
  const itemType = normalizeString(record.item_type) ?? normalizeString(record.itemType)
  const weight = normalizeNumber(record.weight)
  const tags = normalizeStringArray(record.tags)
  const categories = normalizeStringArray(record.categories)
  const attachmentType = normalizeString(record.attachment_type) ?? normalizeString(record.attachmentType)
  const attachmentSlots = normalizeStringArray(record.attachment_slots ?? record.attachmentSlots)
  const isTwoHandWeapon = normalizeBoolean(record.is_two_handed ?? record.isTwoHandWeapon)
  const maxCondition = normalizeNumber(record.max_condition ?? record.maxCondition)
  const conditionLowerChance = normalizeNumber(record.condition_lower_chance ?? record.conditionLowerChance)
  const minDamage = normalizeNumber(record.min_damage ?? record.minDamage)
  const maxDamage = normalizeNumber(record.max_damage ?? record.maxDamage)
  const minRange = normalizeNumber(record.min_range ?? record.minRange)
  const maxRange = normalizeNumber(record.max_range ?? record.maxRange)
  const attackSpeed = normalizeNumber(record.attack_speed ?? record.attackSpeed)
  const critChance = normalizeNumber(record.crit_chance ?? record.critChance)
  const maxHitCount = normalizeNumber(record.max_hit_count ?? record.maxHitCount)
  const treeDamage = normalizeNumber(record.tree_damage ?? record.treeDamage)
  const doorDamage = normalizeNumber(record.door_damage ?? record.doorDamage)
  const knockback = normalizeNumber(record.knockback)
  const sharpness = normalizeNumber(record.sharpness)
  const scriptSource = normalizeString(record.script_source ?? record.scriptSource)

  return {
    fullType,
    name,
    category,
    displayCategory,
    iconName,
    textureIcon,
    iconUrl: buildPzWikiFileUrl(textureIcon ?? iconName),
    source,
    itemType,
    weight,
    tags,
    categories,
    attachmentType,
    attachmentSlots,
    isTwoHandWeapon,
    maxCondition,
    conditionLowerChance,
    minDamage,
    maxDamage,
    minRange,
    maxRange,
    attackSpeed,
    critChance,
    maxHitCount,
    treeDamage,
    doorDamage,
    knockback,
    sharpness,
    scriptSource,
    scriptProperties: null,
  }
}

async function readLuaBridgeCatalog(): Promise<GameCatalogEntry[]> {
  const config = useRuntimeConfig()
  const catalogPath = join(String(config.luaBridgePath || '/lua-bridge'), 'items_catalog.json')

  if (!existsSync(catalogPath)) {
    return []
  }

  try {
    const content = await readFile(catalogPath, 'utf-8')
    const parsed = JSON.parse(content) as { items?: unknown[] }

    if (!Array.isArray(parsed.items)) {
      return []
    }

    return parsed.items
      .map(item => normalizeCatalogEntry(item, 'lua_bridge'))
      .filter((item): item is GameCatalogEntry => item !== null)
  }
  catch (error) {
    logger.warn({ error }, 'Failed to read lua-bridge item catalog')
    return []
  }
}

function mergeScriptCatalogEntry(entry: GameCatalogEntry, scriptEntry: ParsedItemScriptRecord) {
  return {
    ...entry,
    displayCategory: scriptEntry.displayCategory ?? entry.displayCategory ?? entry.category,
    textureIcon: scriptEntry.icon ?? entry.textureIcon,
    iconUrl: buildPzWikiFileUrl(scriptEntry.icon ?? entry.textureIcon ?? entry.iconName),
    itemType: scriptEntry.itemType ?? entry.itemType,
    weight: scriptEntry.weight ?? entry.weight,
    tags: scriptEntry.tags.length ? scriptEntry.tags : entry.tags,
    categories: scriptEntry.categories.length ? scriptEntry.categories : entry.categories,
    attachmentType: scriptEntry.attachmentType ?? entry.attachmentType,
    attachmentSlots: scriptEntry.attachmentSlots.length ? scriptEntry.attachmentSlots : entry.attachmentSlots,
    isTwoHandWeapon: scriptEntry.isTwoHandWeapon ?? entry.isTwoHandWeapon,
    maxCondition: scriptEntry.conditionMax ?? entry.maxCondition,
    conditionLowerChance: scriptEntry.conditionLowerChanceOneIn ?? entry.conditionLowerChance,
    minDamage: scriptEntry.minDamage ?? entry.minDamage,
    maxDamage: scriptEntry.maxDamage ?? entry.maxDamage,
    minRange: scriptEntry.minRange ?? entry.minRange,
    maxRange: scriptEntry.maxRange ?? entry.maxRange,
    attackSpeed: scriptEntry.baseSpeed ?? entry.attackSpeed,
    critChance: scriptEntry.criticalChance ?? entry.critChance,
    maxHitCount: scriptEntry.maxHitCount ?? entry.maxHitCount,
    treeDamage: scriptEntry.treeDamage ?? entry.treeDamage,
    doorDamage: scriptEntry.doorDamage ?? entry.doorDamage,
    knockback: scriptEntry.knockback ?? entry.knockback,
    sharpness: scriptEntry.sharpness ?? entry.sharpness,
    scriptSource: scriptEntry.sourceFile,
    scriptProperties: scriptEntry.rawProperties,
  } satisfies GameCatalogEntry
}

function getScriptCatalogRoots() {
  const config = useRuntimeConfig()
  const home = homedir()

  return [
    String(config.pzServerPath || ''),
    join(home, '.local/share/Steam/steamapps/common/ProjectZomboid/projectzomboid'),
    join(home, '.steam/steam/steamapps/common/ProjectZomboid/projectzomboid'),
  ].filter((root, index, roots) => root.length > 0 && roots.indexOf(root) === index)
}

async function loadBestScriptCatalog() {
  for (const rootDir of getScriptCatalogRoots()) {
    const catalog = await loadItemScriptCatalog(rootDir)
    if (catalog.size > 0) {
      return catalog
    }
  }

  return new Map<string, ParsedItemScriptRecord>()
}

async function readTelemetryCatalog(profileId: string): Promise<GameCatalogEntry[]> {
  const players = await prisma.serverPlayer.findMany({
    where: { profileId },
    select: { inventory: true },
  })

  const entries = new Map<string, GameCatalogEntry>()

  for (const player of players) {
    if (!Array.isArray(player.inventory)) {
      continue
    }

    for (const inventoryItem of player.inventory) {
      if (!inventoryItem || typeof inventoryItem !== 'object' || Array.isArray(inventoryItem)) {
        continue
      }

      const record = inventoryItem as Record<string, unknown>
      const fullType = typeof record.fullType === 'string'
        ? record.fullType
        : typeof record.full_type === 'string'
          ? record.full_type
          : null

      if (!fullType || entries.has(fullType)) {
        continue
      }

      entries.set(fullType, {
        fullType,
        name: humanizeItemCode(fullType),
        category: typeof record.container === 'string' ? record.container : null,
        displayCategory: typeof record.container === 'string' ? record.container : null,
        iconName: null,
        textureIcon: null,
        iconUrl: null,
        source: 'telemetry',
        itemType: null,
        weight: null,
        tags: [],
        categories: [],
        attachmentType: null,
        attachmentSlots: [],
        isTwoHandWeapon: null,
        maxCondition: null,
        conditionLowerChance: null,
        minDamage: null,
        maxDamage: null,
        minRange: null,
        maxRange: null,
        attackSpeed: null,
        critChance: null,
        maxHitCount: null,
        treeDamage: null,
        doorDamage: null,
        knockback: null,
        sharpness: null,
        scriptSource: null,
        scriptProperties: null,
      })
    }
  }

  return [...entries.values()].sort((left, right) => left.fullType.localeCompare(right.fullType))
}

export async function getGameItemCatalog(profileId: string) {
  const scriptCatalog = await loadBestScriptCatalog()
  const luaBridgeItems = await readLuaBridgeCatalog()
  if (luaBridgeItems.length > 0) {
    return {
      source: 'lua_bridge' as const,
      items: luaBridgeItems.map(item => {
        const scriptEntry = scriptCatalog.get(item.fullType)
        return scriptEntry ? mergeScriptCatalogEntry(item, scriptEntry) : item
      }),
    }
  }

  if (scriptCatalog.size > 0) {
    return {
      source: 'scripts' as const,
      items: [...scriptCatalog.values()]
        .map(mapScriptCatalogEntry)
        .sort((left, right) => left.name.localeCompare(right.name)),
    }
  }

  const telemetryItems = await readTelemetryCatalog(profileId)
  return {
    source: 'telemetry' as const,
    items: telemetryItems.map(item => {
      const scriptEntry = scriptCatalog.get(item.fullType)
      return scriptEntry ? mergeScriptCatalogEntry(item, scriptEntry) : item
    }),
  }
}

function scoreCatalogMatch(item: GameCatalogEntry, query: string) {
  const normalizedQuery = query.toLowerCase()
  const fullType = item.fullType.toLowerCase()
  const name = item.name.toLowerCase()
  const displayCategory = (item.displayCategory || '').toLowerCase()
  const itemType = (item.itemType || '').toLowerCase()
  const iconName = (item.iconName || '').toLowerCase()
  const textureIcon = (item.textureIcon || '').toLowerCase()
  const tags = item.tags.map(tag => tag.toLowerCase())
  const categories = item.categories.map(category => category.toLowerCase())

  if (fullType === normalizedQuery) {
    return 100
  }

  if (name === normalizedQuery) {
    return 95
  }

  if (fullType.startsWith(normalizedQuery)) {
    return 85
  }

  if (name.startsWith(normalizedQuery)) {
    return 75
  }

  if (fullType.includes(normalizedQuery)) {
    return 65
  }

  if (name.includes(normalizedQuery)) {
    return 55
  }

  if (displayCategory.includes(normalizedQuery) || itemType.includes(normalizedQuery)) {
    return 45
  }

  if (iconName.includes(normalizedQuery) || textureIcon.includes(normalizedQuery)) {
    return 42
  }

  if (tags.some(tag => tag.includes(normalizedQuery)) || categories.some(category => category.includes(normalizedQuery))) {
    return 40
  }

  return 0
}

export async function searchGameItemCatalog(
  profileId: string,
  query: string,
  limit = 25,
) {
  const { items, source } = await getGameItemCatalog(profileId)
  const trimmedQuery = query.trim()

  const scoredItems = (trimmedQuery.length > 0 ? items : items.slice(0, limit * 2))
    .map((item) => {
      const score = trimmedQuery.length > 0 ? scoreCatalogMatch(item, trimmedQuery) : 1
      return { ...item, score }
    })
    .filter(item => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.name.localeCompare(right.name)
    })

  return {
    source,
    items: scoredItems.slice(0, limit).map(({ score: _score, ...item }) => item),
    total: scoredItems.length,
  }
}

export async function getGameCatalogItem(profileId: string, fullType: string) {
  const { items } = await getGameItemCatalog(profileId)
  return items.find(item => item.fullType === fullType) ?? null
}
