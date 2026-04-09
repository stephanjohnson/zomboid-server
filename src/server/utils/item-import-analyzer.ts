import type { GameCatalogEntry } from './item-catalog'

export interface AnalyzedOptionValue {
  label: string
  slug: string
  colorHex: string
  sourceFullTypes: string[]
}

export interface AnalyzedOptionGroup {
  name: string
  slug: string
  displayType: 'TEXT' | 'COLOR'
  values: AnalyzedOptionValue[]
}

export interface AnalyzedVariant {
  name: string
  itemCode: string
  gameName: string
  gameCategory: string | null
  weight: number | null
  imageUrl: string | null
  isDefault: boolean
  selections: Record<string, string>
  metadata: Record<string, unknown>
}

export interface MultiImportAnalysis {
  productName: string
  suggestedOptionGroups: AnalyzedOptionGroup[]
  suggestedVariants: AnalyzedVariant[]
  related: GameCatalogEntry[]
}

interface VariantCandidate {
  label: string
  slug: string
  representative: GameCatalogEntry
  items: GameCatalogEntry[]
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function humanizeToken(token: string): string {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find the longest common prefix among item names, then trim trailing
 * partial words and side indicators (Left, Right, L, R).
 */
function findCommonBaseName(items: GameCatalogEntry[]): string {
  const names = items.map(i => i.fullType.split('.').pop() || i.fullType)
  if (names.length === 0) return ''
  if (names.length === 1) return humanizeToken(names[0]!)

  // Find shared prefix in the raw item names (before humanizing)
  let prefix = names[0]!
  for (let i = 1; i < names.length; i++) {
    while (!names[i]!.startsWith(prefix) && prefix.length > 0) {
      prefix = prefix.slice(0, -1)
    }
  }

  // Trim trailing underscores and partial tokens
  prefix = prefix.replace(/_+$/, '')

  const humanized = humanizeToken(prefix)

  // Remove trailing side indicators
  return humanized
    .replace(/\s+(Left|Right|L|R)\s*$/i, '')
    .trim()
}

/**
 * Detect left/right pairs based on naming patterns.
 * Items like Kneepad_Right_Leather + Kneepad_Left_Leather form a pair.
 */
function detectPairs(items: GameCatalogEntry[]): Map<string, GameCatalogEntry[]> {
  const pairs = new Map<string, GameCatalogEntry[]>()

  for (const item of items) {
    const rawName = item.fullType.split('.').pop() || item.fullType
    // Normalize by removing _Left/_Right/_L/_R from the name
    const pairKey = rawName
      .replace(/_(Left|Right|L|R)(?=_|$)/i, '')
      .replace(/__+/g, '_')
      .replace(/_$/, '')
    const existing = pairs.get(pairKey) || []
    existing.push(item)
    pairs.set(pairKey, existing)
  }

  return pairs
}

/**
 * Extract style suffix from an item name relative to the base.
 * E.g. base="Kneepad", fullName="Kneepad_Right_Leather" → "Leather"
 */
function extractStyleSuffix(item: GameCatalogEntry, baseName: string): string {
  const rawName = item.fullType.split('.').pop() || item.fullType
  const baseTokens = humanizeToken(baseName)
    .split(/\s+/)
    .map(token => slugify(token))
    .filter(Boolean)

  const remainingTokens = humanizeToken(rawName)
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !/^(Left|Right|L|R)$/i.test(token))

  let prefixLength = 0
  while (
    prefixLength < baseTokens.length
    && prefixLength < remainingTokens.length
    && slugify(remainingTokens[prefixLength] || '') === baseTokens[prefixLength]
  ) {
    prefixLength += 1
  }

  const suffix = remainingTokens.slice(prefixLength).join(' ').trim()

  if (!suffix) {
    return 'Standard'
  }

  return suffix
}

/**
 * Find related items in the full catalog that share the same base name pattern
 * but weren't in the user's selection.
 */
function findRelatedItems(
  selectedFullTypes: Set<string>,
  baseName: string,
  allItems: GameCatalogEntry[],
): GameCatalogEntry[] {
  const baseSlug = slugify(baseName)
  if (!baseSlug) return []

  const baseTokens = baseSlug.split('-').filter(Boolean)

  return allItems.filter((item) => {
    if (selectedFullTypes.has(item.fullType)) return false

    const nameSlug = slugify(item.name)
    const rawName = item.fullType.split('.').pop() || ''
    const rawSlug = slugify(humanizeToken(rawName))

    // The item name must start with the base tokens
    return baseTokens.every(token => rawSlug.includes(token) || nameSlug.includes(token))
  })
}

function buildVariantCandidates(selectedItems: GameCatalogEntry[], productName: string) {
  const pairs = detectPairs(selectedItems)
  const styleMap = new Map<string, { items: GameCatalogEntry[], representative: GameCatalogEntry }>()

  for (const [_pairKey, pairItems] of pairs) {
    const representative = pairItems[0]!
    const style = extractStyleSuffix(representative, productName)
    const existing = styleMap.get(style)

    if (existing) {
      existing.items.push(...pairItems)
      continue
    }

    styleMap.set(style, { items: [...pairItems], representative })
  }

  const variants = (styleMap.size > 0
    ? [...styleMap.entries()].map(([style, group]) => ({
        label: style,
        slug: slugify(style),
        representative: group.representative,
        items: group.items,
      }))
    : [{
        label: 'Standard',
        slug: 'standard',
        representative: selectedItems[0]!,
        items: selectedItems,
      }])

  const imageBackedVariants = variants.filter(variant => Boolean(variant.representative.iconUrl))

  return imageBackedVariants.length > 0 ? imageBackedVariants : variants
}

export function analyzeMultiImport(
  selectedItems: GameCatalogEntry[],
  allCatalogItems: GameCatalogEntry[],
): MultiImportAnalysis {
  if (selectedItems.length === 0) {
    return {
      productName: '',
      suggestedOptionGroups: [],
      suggestedVariants: [],
      related: [],
    }
  }

  if (selectedItems.length === 1) {
    const item = selectedItems[0]!
    return {
      productName: item.name,
      suggestedOptionGroups: [],
      suggestedVariants: [{
        name: item.name,
        itemCode: item.fullType,
        gameName: item.name,
        gameCategory: item.displayCategory || item.category,
        weight: item.weight,
        imageUrl: item.iconUrl,
        isDefault: true,
        selections: {},
        metadata: {},
      }],
      related: findRelatedItems(new Set([item.fullType]), item.name, allCatalogItems),
    }
  }

  const productName = findCommonBaseName(selectedItems)
  const selectedFullTypes = new Set(selectedItems.map(i => i.fullType))
  const variantCandidates = buildVariantCandidates(selectedItems, productName)
  const usesVariantOptions = variantCandidates.length > 1

  // Build option groups
  const optionGroups: AnalyzedOptionGroup[] = []

  if (usesVariantOptions) {
    optionGroups.push({
      name: 'Style',
      slug: 'style',
      displayType: 'TEXT',
      values: variantCandidates.map((variant) => ({
        label: variant.label,
        slug: variant.slug,
        colorHex: '',
        sourceFullTypes: variant.items.map(item => item.fullType),
      })),
    })
  }

  const variants: AnalyzedVariant[] = variantCandidates.map((variant, index) => {
    const selections: Record<string, string> = usesVariantOptions
      ? { style: variant.slug }
      : {}

    return {
      name: usesVariantOptions ? variant.label : variant.representative.name,
      itemCode: variant.representative.fullType,
      gameName: variant.representative.name,
      gameCategory: variant.representative.displayCategory || variant.representative.category,
      weight: variant.representative.weight,
      imageUrl: variant.representative.iconUrl,
      isDefault: index === 0,
      selections,
      metadata: { sourceFullTypes: variant.items.map(item => item.fullType) },
    }
  })

  const related = findRelatedItems(selectedFullTypes, productName, allCatalogItems)

  return {
    productName: productName || selectedItems[0]!.name,
    suggestedOptionGroups: optionGroups,
    suggestedVariants: variants,
    related,
  }
}
