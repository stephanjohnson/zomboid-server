export interface StoreCategorySummary {
  id: string
  name: string
  slug: string
  description?: string | null
  heroTitle?: string | null
  heroDescription?: string | null
  accentColor?: string | null
  icon?: string | null
  isFeatured?: boolean
  productCount?: number
}

export interface StoreProductCategoryLink {
  id: string
  name: string
  slug: string
  accentColor: string
}

export interface StoreVariantSelection {
  optionGroupId: string
  optionGroupName: string
  optionGroupSlug: string
  displayType: 'TEXT' | 'COLOR'
  optionValueId: string
  optionValueLabel: string
  optionValueSlug: string
  colorHex?: string | null
}

export interface StoreProductVariant {
  id: string
  name: string
  sku: string
  itemCode: string
  gameName?: string | null
  gameCategory?: string | null
  price: number
  compareAtPrice?: number | null
  quantity: number
  stock?: number | null
  weight?: number | null
  badge?: string | null
  imageUrl?: string | null
  metadata?: Record<string, unknown> | null
  isDefault: boolean
  isActive: boolean
  selections: StoreVariantSelection[]
  selectionMap: Record<string, string>
}

export interface StoreProductSummary {
  id: string
  name: string
  slug: string
  summary?: string | null
  badge?: string | null
  accentColor: string
  overview?: string | null
  featureBullets: unknown[]
  isFeatured: boolean
  isActive: boolean
  categories: StoreProductCategoryLink[]
  defaultVariant: StoreProductVariant | null
  pricing: {
    min: number
    max: number
    compareAtMin?: number | null
    compareAtMax?: number | null
    hasRange: boolean
  }
  stock: {
    inStock: boolean
    total?: number | null
  }
  variantCount: number
}

export interface StoreOptionGroup {
  id: string
  name: string
  slug: string
  displayType: 'TEXT' | 'COLOR'
  values: Array<{
    id: string
    label: string
    slug: string
    description?: string | null
    colorHex?: string | null
  }>
}

export interface StoreProductDetail extends StoreProductSummary {
  description?: string | null
  specs?: unknown
  optionGroups: StoreOptionGroup[]
  variants: StoreProductVariant[]
  recommendations: Array<{
    id: string
    reason?: string | null
    product: StoreProductSummary
  }>
}

export interface StoreBundleSummary {
  id: string
  name: string
  slug: string
  summary?: string | null
  description?: string | null
  badge?: string | null
  accentColor: string
  price: number
  compareAtPrice?: number | null
  isFeatured: boolean
  isActive: boolean
  stock?: number | null
  itemCount: number
  items: Array<{
    quantity: number
    variantId: string
    variantName: string
    itemCode: string
    productId: string
    productName: string
    productSlug: string
  }>
}

export interface StoreCartItem {
  key: string
  kind: 'variant' | 'bundle'
  title: string
  subtitle?: string | null
  slug: string
  unitPrice: number
  compareAtUnitPrice?: number | null
  quantity: number
  accentColor?: string | null
  itemCode?: string | null
  variantId?: string
  bundleId?: string
}

export function formatStoreMoney(value?: number | null) {
  return `Z$ ${new Intl.NumberFormat('en-US').format(value ?? 0)}`
}

export function formatStorePriceRange(pricing: StoreProductSummary['pricing']) {
  if (!pricing.hasRange) {
    return formatStoreMoney(pricing.min)
  }

  return `${formatStoreMoney(pricing.min)} - ${formatStoreMoney(pricing.max)}`
}

export function summarizeVariantSelections(variant?: StoreProductVariant | null) {
  if (!variant || variant.selections.length === 0) {
    return null
  }

  return variant.selections.map(selection => selection.optionValueLabel).join(' / ')
}

export function resolveVariantForSelections(
  variants: StoreProductVariant[],
  selected: Record<string, string>,
) {
  return variants.find((variant) => {
    if (!variant.isActive) {
      return false
    }

    return Object.entries(selected).every(([groupSlug, valueSlug]) => variant.selectionMap[groupSlug] === valueSlug)
  }) ?? variants.find(variant => variant.isDefault && variant.isActive) ?? variants.find(variant => variant.isActive) ?? null
}

export function flattenSpecs(specs: unknown) {
  if (!Array.isArray(specs)) {
    return []
  }

  return specs
    .filter((row): row is { group?: string, label: string, value: string } => {
      return Boolean(row) && typeof row === 'object' && !Array.isArray(row)
        && typeof (row as { label?: unknown }).label === 'string'
        && typeof (row as { value?: unknown }).value === 'string'
    })
}
