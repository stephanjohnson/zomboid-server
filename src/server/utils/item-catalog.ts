import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface GameCatalogEntry {
  fullType: string
  name: string
  category: string | null
  iconName: string | null
  source: 'lua_bridge' | 'telemetry'
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

  const iconName = typeof record.icon_name === 'string'
    ? record.icon_name
    : typeof record.iconName === 'string'
      ? record.iconName
      : null

  return {
    fullType,
    name,
    category,
    iconName,
    source,
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
        iconName: null,
        source: 'telemetry',
      })
    }
  }

  return [...entries.values()].sort((left, right) => left.fullType.localeCompare(right.fullType))
}

export async function getGameItemCatalog(profileId: string) {
  const luaBridgeItems = await readLuaBridgeCatalog()
  if (luaBridgeItems.length > 0) {
    return {
      source: 'lua_bridge' as const,
      items: luaBridgeItems,
    }
  }

  const telemetryItems = await readTelemetryCatalog(profileId)
  return {
    source: 'telemetry' as const,
    items: telemetryItems,
  }
}

function scoreCatalogMatch(item: GameCatalogEntry, query: string) {
  const normalizedQuery = query.toLowerCase()
  const fullType = item.fullType.toLowerCase()
  const name = item.name.toLowerCase()

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
