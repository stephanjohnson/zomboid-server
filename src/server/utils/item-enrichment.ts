import { humanizeItemCode } from './item-catalog'
import type { GameCatalogEntry } from './item-catalog'

export interface GameItemSpecRow {
  group: string
  label: string
  value: string
}

export interface EnrichedGameCatalogItem {
  item: GameCatalogEntry
  wiki: {
    pageTitle: string | null
    pageUrl: string | null
    imageUrl: string | null
    summary: string | null
    status: 'fetched' | 'blocked' | 'derived' | 'unavailable'
    note: string | null
  }
  derived: {
    summary: string
    overview: string
    featureBullets: string[]
    specs: GameItemSpecRow[]
  }
  importPayload: {
    product: {
      name: string
      summary: string
      description: string
      overview: string
      featureBullets: string[]
      specs: GameItemSpecRow[]
    }
    variant: {
      name: string
      itemCode: string
      gameName: string
      gameCategory: string | null
      weight: number | null
      imageUrl: string | null
      metadata: Record<string, unknown>
    }
  }
}

interface WikiSummaryResult {
  pageTitle: string | null
  pageUrl: string | null
  summary: string | null
  status: 'fetched' | 'blocked' | 'derived' | 'unavailable'
  note: string | null
}

function articleFor(value: string) {
  return /^[aeiou]/i.test(value.trim()) ? 'An' : 'A'
}

function sentenceCase(value: string) {
  if (!value.length) {
    return value
  }

  return value.charAt(0).toLowerCase() + value.slice(1)
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
}

function formatDamageRange(item: GameCatalogEntry) {
  if (typeof item.minDamage !== 'number' && typeof item.maxDamage !== 'number') {
    return null
  }

  if (typeof item.minDamage === 'number' && typeof item.maxDamage === 'number') {
    return item.minDamage === item.maxDamage
      ? formatNumber(item.minDamage)
      : `${formatNumber(item.minDamage)}-${formatNumber(item.maxDamage)}`
  }

  return formatNumber(item.minDamage ?? item.maxDamage ?? null)
}

function formatRange(item: GameCatalogEntry) {
  if (typeof item.minRange !== 'number' && typeof item.maxRange !== 'number') {
    return null
  }

  if (typeof item.minRange === 'number' && typeof item.maxRange === 'number') {
    return item.minRange === item.maxRange
      ? formatNumber(item.maxRange)
      : `${formatNumber(item.minRange)}-${formatNumber(item.maxRange)}`
  }

  return formatNumber(item.minRange ?? item.maxRange ?? null)
}

function buildKindLabel(item: GameCatalogEntry) {
  const primaryCategory = item.categories[0]?.replace(/^base:/i, '').replace(/_/g, ' ').trim()
  const category = item.displayCategory || item.category

  if (category?.toLowerCase() === 'weapon' && primaryCategory) {
    return `${primaryCategory.toLowerCase()} weapon`
  }

  if (category) {
    return `${category.toLowerCase()} item`
  }

  if (primaryCategory) {
    return `${primaryCategory.toLowerCase()} item`
  }

  return 'Project Zomboid item'
}

function buildDerivedSummary(item: GameCatalogEntry) {
  const handedness = item.isTwoHandWeapon === true
    ? 'two-handed '
    : item.isTwoHandWeapon === false
      ? 'one-handed '
      : ''
  const displayName = /^[A-Z][a-z]/.test(item.name) ? sentenceCase(item.name) : item.name

  return `${articleFor(item.name)} ${displayName} is a ${handedness}${buildKindLabel(item)}.`
}

function pushSpec(rows: GameItemSpecRow[], group: string, label: string, value?: string | null) {
  if (!value) {
    return
  }

  rows.push({ group, label, value })
}

export function buildDerivedSpecs(item: GameCatalogEntry) {
  const rows: GameItemSpecRow[] = []

  pushSpec(rows, 'General', 'Category', item.displayCategory || item.category)
  pushSpec(rows, 'General', 'Encumbrance', formatNumber(item.weight))
  pushSpec(rows, 'General', 'Equipped', item.isTwoHandWeapon === true ? 'Two-handed' : item.isTwoHandWeapon === false ? 'One-handed' : null)
  pushSpec(rows, 'General', 'Slot attached', item.attachmentSlots.length ? item.attachmentSlots.join(', ') : item.attachmentType)
  pushSpec(rows, 'Properties', 'Max condition', formatNumber(item.maxCondition))
  pushSpec(rows, 'Properties', 'Condition lower chance', formatNumber(item.conditionLowerChance))
  pushSpec(rows, 'Performance', 'Damage', formatDamageRange(item))
  pushSpec(rows, 'Performance', 'Range', formatRange(item))
  pushSpec(rows, 'Performance', 'Attack speed', formatNumber(item.attackSpeed))
  pushSpec(rows, 'Performance', 'Crit chance', typeof item.critChance === 'number' ? `${formatNumber(item.critChance)}%` : null)
  pushSpec(rows, 'Performance', 'Hit count', formatNumber(item.maxHitCount))
  pushSpec(rows, 'Performance', 'Door damage', formatNumber(item.doorDamage))
  pushSpec(rows, 'Performance', 'Tree damage', formatNumber(item.treeDamage))
  pushSpec(rows, 'Performance', 'Knockback', formatNumber(item.knockback))
  pushSpec(rows, 'Performance', 'Sharpness', formatNumber(item.sharpness))
  pushSpec(rows, 'Technical', 'Tags', item.tags.length ? item.tags.join(', ') : null)
  pushSpec(rows, 'Technical', 'Item ID', item.fullType)
  pushSpec(rows, 'Technical', 'Script source', item.scriptSource)

  return rows
}

function buildDerivedFeatureBullets(item: GameCatalogEntry) {
  const bullets: string[] = []
  const handedness = item.isTwoHandWeapon === true
    ? 'Two-handed loadout item.'
    : item.isTwoHandWeapon === false
      ? 'Can be used one-handed.'
      : null

  if (handedness) {
    bullets.push(handedness)
  }

  const damage = formatDamageRange(item)
  const range = formatRange(item)
  if (damage || range) {
    const parts = [
      damage ? `Damage ${damage}` : null,
      range ? `range ${range}` : null,
    ].filter(Boolean)
    if (parts.length) {
      bullets.push(`${parts.join(' with ')} extracted from the installed game scripts.`)
    }
  }

  if (typeof item.maxCondition === 'number') {
    const durability = typeof item.conditionLowerChance === 'number'
      ? `Max condition ${formatNumber(item.maxCondition)} with a lower-chance rating of ${formatNumber(item.conditionLowerChance)}.`
      : `Max condition ${formatNumber(item.maxCondition)}.`
    bullets.push(durability)
  }

  if (item.tags.length) {
    bullets.push(`Tags: ${item.tags.join(', ')}.`)
  }

  return bullets.slice(0, 4)
}

function buildDerivedOverview(item: GameCatalogEntry) {
  return [
    `This entry is built from the installed Project Zomboid game scripts for ${item.fullType}.`,
    'Structured specs, weight, and performance values can be refreshed as the game build changes.',
  ].join(' ')
}

function buildWikiPageTitleCandidates(item: GameCatalogEntry) {
  return [
    item.name.replace(/\s*\([^)]*\)\s*$/, '').trim(),
    item.name,
    humanizeItemCode(item.fullType),
  ].filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
}

function buildWikiPageUrl(pageTitle: string | null) {
  if (!pageTitle) {
    return null
  }

  return `https://pzwiki.net/wiki/${encodeURIComponent(pageTitle.replace(/\s+/g, '_'))}`
}

function sanitizeWikiHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[[^\]]*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function tryFetchWikiSummary(pageTitle: string | null): Promise<WikiSummaryResult> {
  const cacheKey = pageTitle || '__none__'
  if (wikiSummaryCache.has(cacheKey)) {
    return wikiSummaryCache.get(cacheKey)!
  }

  const resultPromise = (async () => {
    const pageUrl = buildWikiPageUrl(pageTitle)
    if (!pageTitle || !pageUrl) {
      return {
        pageTitle,
        pageUrl,
        summary: null,
        status: 'unavailable' as const,
        note: 'No wiki page title could be resolved for this item.',
      }
    }

    try {
      const response = await fetch(pageUrl, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; ZomboidServerManager/1.0; +https://projectzomboid.com)',
          'accept-language': 'en-US,en;q=0.9',
        },
      })

      const html = await response.text()
      if (!response.ok || /Just a moment/i.test(html) || /cf-mitigated/i.test(html)) {
        return {
          pageTitle,
          pageUrl,
          summary: null,
          status: 'blocked' as const,
          note: 'PZwiki blocked automated page fetches, so the importer fell back to script-derived copy.',
        }
      }

      const paragraphMatches = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
        .map(match => sanitizeWikiHtml(match[1] || ''))
        .filter(text => text.length > 40)

      return {
        pageTitle,
        pageUrl,
        summary: paragraphMatches[0] ?? null,
        status: paragraphMatches[0] ? 'fetched' as const : 'unavailable' as const,
        note: paragraphMatches[0] ? null : 'No suitable lead paragraph was found on the wiki page.',
      }
    }
    catch (error) {
      logger.warn({ error, pageTitle }, 'Failed to fetch PZwiki page summary')
      return {
        pageTitle,
        pageUrl,
        summary: null,
        status: 'blocked' as const,
        note: 'The wiki request failed, so the importer fell back to script-derived copy.',
      }
    }
  })()

  wikiSummaryCache.set(cacheKey, resultPromise)
  return resultPromise
}

const wikiSummaryCache = new Map<string, Promise<WikiSummaryResult>>()

export async function buildEnrichedCatalogItem(item: GameCatalogEntry): Promise<EnrichedGameCatalogItem> {
  const pageTitle = buildWikiPageTitleCandidates(item)[0] ?? null
  const wikiResult = await tryFetchWikiSummary(pageTitle)
  const derivedSummary = buildDerivedSummary(item)
  const derivedOverview = buildDerivedOverview(item)
  const derivedSpecs = buildDerivedSpecs(item)
  const derivedFeatureBullets = buildDerivedFeatureBullets(item)
  const imageUrl = item.iconUrl

  return {
    item,
    wiki: {
      ...wikiResult,
      imageUrl,
      summary: wikiResult.summary,
    },
    derived: {
      summary: derivedSummary,
      overview: derivedOverview,
      featureBullets: derivedFeatureBullets,
      specs: derivedSpecs,
    },
    importPayload: {
      product: {
        name: item.name,
        summary: wikiResult.summary ?? derivedSummary,
        description: wikiResult.summary ?? derivedSummary,
        overview: wikiResult.summary
          ? `${wikiResult.summary} ${derivedOverview}`
          : derivedOverview,
        featureBullets: derivedFeatureBullets,
        specs: derivedSpecs,
      },
      variant: {
        name: item.name,
        itemCode: item.fullType,
        gameName: item.name,
        gameCategory: item.displayCategory || item.category,
        weight: item.weight,
        imageUrl,
        metadata: {
          importSource: item.source,
          wikiStatus: wikiResult.status,
          wikiPageTitle: wikiResult.pageTitle,
          wikiPageUrl: wikiResult.pageUrl,
          textureIcon: item.textureIcon,
          iconName: item.iconName,
          itemType: item.itemType,
          attachmentType: item.attachmentType,
          attachmentSlots: item.attachmentSlots,
          isTwoHandWeapon: item.isTwoHandWeapon,
          maxCondition: item.maxCondition,
          conditionLowerChance: item.conditionLowerChance,
          minDamage: item.minDamage,
          maxDamage: item.maxDamage,
          minRange: item.minRange,
          maxRange: item.maxRange,
          attackSpeed: item.attackSpeed,
          critChance: item.critChance,
          maxHitCount: item.maxHitCount,
          treeDamage: item.treeDamage,
          doorDamage: item.doorDamage,
          knockback: item.knockback,
          sharpness: item.sharpness,
          tags: item.tags,
          categories: item.categories,
          scriptSource: item.scriptSource,
        },
      },
    },
  }
}
