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
  const baseSlug = slugify(baseName)

  // Remove the base from the raw name, then remove side indicators
  let suffix = rawName
  const basePattern = baseName.replace(/\s+/g, '_')
  if (suffix.startsWith(basePattern)) {
    suffix = suffix.slice(basePattern.length)
  }

  suffix = suffix
    .replace(/^_+/, '')
    .replace(/_(Left|Right|L|R)(?=_|$)/gi, '')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!suffix || slugify(humanizeToken(suffix)) === baseSlug) {
    return 'Standard'
  }

  return humanizeToken(suffix)
}

/**
 * Extract color variants from IconsForTexture property stored in scriptProperties.
 */
function extractColorVariants(item: GameCatalogEntry): string[] {
  const iconsForTexture = item.scriptProperties?.IconsForTexture

  if (!iconsForTexture) return []

  return iconsForTexture
    .split(';')
    .map(icon => icon.trim())
    .filter(Boolean)
    .map((icon) => {
      // Strip common prefixes to get the color name
      // e.g. "KneePad_BlackWhite" → "Black White", "KneePad_Green" → "Green"
      const parts = icon.split('_')
      // Remove parts that look like the item base name
      const colorParts = parts.filter((p, i) => i > 0 || !/^[A-Z][a-z]/.test(p))
      return colorParts.length > 0
        ? humanizeToken(colorParts.join('_'))
        : humanizeToken(icon)
    })
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
  const pairs = detectPairs(selectedItems)
  const selectedFullTypes = new Set(selectedItems.map(i => i.fullType))

  // Determine styles from pair groups
  const styleMap = new Map<string, { items: GameCatalogEntry[], representative: GameCatalogEntry }>()
  for (const [_pairKey, pairItems] of pairs) {
    const rep = pairItems[0]!
    const style = extractStyleSuffix(rep, productName)
    const existing = styleMap.get(style)
    if (existing) {
      existing.items.push(...pairItems)
    }
    else {
      styleMap.set(style, { items: [...pairItems], representative: rep })
    }
  }

  // Collect color variants from all items
  const allColors = new Set<string>()
  for (const item of selectedItems) {
    for (const color of extractColorVariants(item)) {
      allColors.add(color)
    }
  }

  // Build option groups
  const optionGroups: AnalyzedOptionGroup[] = []

  // Style option group (only if more than one style)
  if (styleMap.size > 1) {
    const styleValues: AnalyzedOptionValue[] = []
    for (const [style, { items }] of styleMap) {
      styleValues.push({
        label: style,
        slug: slugify(style),
        colorHex: '',
        sourceFullTypes: items.map(i => i.fullType),
      })
    }
    optionGroups.push({
      name: 'Style',
      slug: 'style',
      displayType: 'TEXT',
      values: styleValues,
    })
  }

  // Color option group (if any colors detected)
  if (allColors.size > 1) {
    const colorValues: AnalyzedOptionValue[] = [...allColors].map(color => ({
      label: color,
      slug: slugify(color),
      colorHex: '',
      sourceFullTypes: [],
    }))
    optionGroups.push({
      name: 'Color',
      slug: 'color',
      displayType: 'COLOR',
      values: colorValues,
    })
  }

  // Build variants — one per style×color combination (or just per style if no colors)
  const variants: AnalyzedVariant[] = []
  let isFirst = true

  const styles = styleMap.size > 0 ? [...styleMap.entries()] : [['Standard', { items: selectedItems, representative: selectedItems[0]! }] as const]

  for (const [style, { representative }] of styles) {
    if (allColors.size > 1) {
      for (const color of allColors) {
        const variantName = `${style} — ${color}`
        const selections: Record<string, string> = {}
        if (styleMap.size > 1) selections.style = slugify(style)
        selections.color = slugify(color)

        variants.push({
          name: variantName,
          itemCode: representative.fullType,
          gameName: representative.name,
          gameCategory: representative.displayCategory || representative.category,
          weight: representative.weight,
          imageUrl: representative.iconUrl,
          isDefault: isFirst,
          selections,
          metadata: { sourceFullTypes: styleMap.get(style)?.items.map(i => i.fullType) || [] },
        })
        isFirst = false
      }
    }
    else {
      const selections: Record<string, string> = {}
      if (styleMap.size > 1) selections.style = slugify(style)

      variants.push({
        name: style === 'Standard' && styleMap.size <= 1 ? representative.name : style,
        itemCode: representative.fullType,
        gameName: representative.name,
        gameCategory: representative.displayCategory || representative.category,
        weight: representative.weight,
        imageUrl: representative.iconUrl,
        isDefault: isFirst,
        selections,
        metadata: { sourceFullTypes: styleMap.get(style)?.items.map(i => i.fullType) || [] },
      })
      isFirst = false
    }
  }

  // Find related items the user might have missed
  const related = findRelatedItems(selectedFullTypes, productName, allCatalogItems)

  return {
    productName: productName || selectedItems[0]!.name,
    suggestedOptionGroups: optionGroups,
    suggestedVariants: variants,
    related,
  }
}
