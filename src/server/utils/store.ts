import type { H3Event } from 'h3'

import type { Prisma } from '@prisma/client'

type StoreProductSummaryInput = Prisma.StoreProductGetPayload<{
  include: {
    categories: {
      include: {
        category: true
      }
    }
    variants: {
      include: {
        selections: {
          include: {
            optionValue: {
              include: {
                optionGroup: true
              }
            }
          }
        }
      }
    }
  }
}>

type StoreProductDetailInput = Prisma.StoreProductGetPayload<{
  include: {
    categories: {
      include: {
        category: true
      }
    }
    optionGroups: {
      include: {
        values: true
      }
    }
    variants: {
      include: {
        selections: {
          include: {
            optionValue: {
              include: {
                optionGroup: true
              }
            }
          }
        }
      }
    }
    recommendationsFrom: {
      include: {
        targetProduct: {
          include: {
            categories: {
              include: {
                category: true
              }
            }
            variants: {
              include: {
                selections: {
                  include: {
                    optionValue: {
                      include: {
                        optionGroup: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}>

type StoreBundleSummaryInput = Prisma.StoreBundleGetPayload<{
  include: {
    items: {
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    }
  }
}>

function sortBySortOrder<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    return JSON.stringify(left).localeCompare(JSON.stringify(right))
  })
}

function normalizeColor(value?: string | null) {
  if (!value) {
    return '#6B7280'
  }

  const trimmed = value.trim()
  return /^#?[0-9a-fA-F]{6}$/.test(trimmed)
    ? (trimmed.startsWith('#') ? trimmed : `#${trimmed}`)
    : '#6B7280'
}

function getVariantSelections(
  variant: StoreProductSummaryInput['variants'][number] | StoreProductDetailInput['variants'][number],
) {
  return [...variant.selections]
    .sort((left, right) => {
      if (left.optionValue.optionGroup.sortOrder !== right.optionValue.optionGroup.sortOrder) {
        return left.optionValue.optionGroup.sortOrder - right.optionValue.optionGroup.sortOrder
      }

      return left.optionValue.sortOrder - right.optionValue.sortOrder
    })
    .map(selection => ({
      optionGroupId: selection.optionValue.optionGroup.id,
      optionGroupName: selection.optionValue.optionGroup.name,
      optionGroupSlug: selection.optionValue.optionGroup.slug,
      displayType: selection.optionValue.optionGroup.displayType,
      optionValueId: selection.optionValue.id,
      optionValueLabel: selection.optionValue.label,
      optionValueSlug: selection.optionValue.slug,
      colorHex: selection.optionValue.colorHex,
    }))
}

function getPricingSummary(
  variants: Array<StoreProductSummaryInput['variants'][number] | StoreProductDetailInput['variants'][number]>,
) {
  if (variants.length === 0) {
    return {
      min: 0,
      max: 0,
      compareAtMin: null as number | null,
      compareAtMax: null as number | null,
      hasRange: false,
    }
  }

  const prices = variants.map(variant => variant.price)
  const compareAtPrices = variants
    .map(variant => variant.compareAtPrice)
    .filter((value): value is number => typeof value === 'number')

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    compareAtMin: compareAtPrices.length > 0 ? Math.min(...compareAtPrices) : null,
    compareAtMax: compareAtPrices.length > 0 ? Math.max(...compareAtPrices) : null,
    hasRange: Math.min(...prices) !== Math.max(...prices),
  }
}

function getStockSummary(
  variants: Array<StoreProductSummaryInput['variants'][number] | StoreProductDetailInput['variants'][number]>,
) {
  const activeVariants = variants.filter(variant => variant.isActive)
  const hasUnlimitedStock = activeVariants.some(variant => variant.stock === null)
  const stockTotal = hasUnlimitedStock
    ? null
    : activeVariants.reduce((total, variant) => total + (variant.stock ?? 0), 0)

  return {
    inStock: activeVariants.some(variant => variant.stock === null || (variant.stock ?? 0) > 0),
    total: stockTotal,
  }
}

function mapCategoryLink(link: StoreProductSummaryInput['categories'][number]) {
  return {
    id: link.category.id,
    name: link.category.name,
    slug: link.category.slug,
    accentColor: normalizeColor(link.category.accentColor),
  }
}

function mapVariantSummary(
  variant: StoreProductSummaryInput['variants'][number] | StoreProductDetailInput['variants'][number],
) {
  const selections = getVariantSelections(variant)

  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    itemCode: variant.itemCode,
    gameName: variant.gameName,
    gameCategory: variant.gameCategory,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    quantity: variant.quantity,
    stock: variant.stock,
    weight: variant.weight ? Number(variant.weight) : null,
    badge: variant.badge,
    imageUrl: variant.imageUrl,
    metadata: variant.metadata && typeof variant.metadata === 'object' && !Array.isArray(variant.metadata)
      ? variant.metadata as Record<string, unknown>
      : null,
    isDefault: variant.isDefault,
    isActive: variant.isActive,
    selections,
    selectionMap: Object.fromEntries(
      selections.map(selection => [selection.optionGroupSlug, selection.optionValueSlug]),
    ),
  }
}

export function mapStoreProductSummary(product: StoreProductSummaryInput) {
  const activeVariants = sortBySortOrder(product.variants).filter(variant => variant.isActive)
  const defaultVariant = activeVariants.find(variant => variant.isDefault) ?? activeVariants[0] ?? null
  const pricing = getPricingSummary(activeVariants)
  const stock = getStockSummary(activeVariants)

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    badge: product.badge,
    accentColor: normalizeColor(product.accentColor),
    overview: product.overview,
    featureBullets: Array.isArray(product.featureBullets) ? product.featureBullets : [],
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    categories: sortBySortOrder(product.categories).map(mapCategoryLink),
    defaultVariant: defaultVariant ? mapVariantSummary(defaultVariant) : null,
    pricing,
    stock,
    variantCount: activeVariants.length,
  }
}

export function mapStoreProductDetail(product: StoreProductDetailInput) {
  const summary = mapStoreProductSummary(product)

  return {
    ...summary,
    description: product.description,
    specs: product.specs,
    optionGroups: sortBySortOrder(product.optionGroups).map(group => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      displayType: group.displayType,
      values: sortBySortOrder(group.values).map(value => ({
        id: value.id,
        label: value.label,
        slug: value.slug,
        description: value.description,
        colorHex: value.colorHex,
      })),
    })),
    variants: sortBySortOrder(product.variants).map(mapVariantSummary),
    recommendations: sortBySortOrder(product.recommendationsFrom).map((recommendation) => ({
      id: recommendation.targetProduct.id,
      reason: recommendation.reason,
      product: mapStoreProductSummary(recommendation.targetProduct),
    })),
  }
}

export function mapStoreBundleSummary(bundle: StoreBundleSummaryInput) {
  const compareAtPrice = bundle.compareAtPrice ?? bundle.items.reduce(
    (total, item) => total + ((item.variant.compareAtPrice ?? item.variant.price) * item.quantity),
    0,
  )

  const stockValues = bundle.items.map((item) => {
    if (item.variant.stock === null) {
      return null
    }

    return Math.floor((item.variant.stock ?? 0) / Math.max(item.quantity, 1))
  })

  const stock = stockValues.some(value => value === null)
    ? null
    : Math.min(...stockValues.filter((value): value is number => typeof value === 'number'))

  return {
    id: bundle.id,
    name: bundle.name,
    slug: bundle.slug,
    summary: bundle.summary,
    description: bundle.description,
    badge: bundle.badge,
    accentColor: normalizeColor(bundle.accentColor),
    price: bundle.price,
    compareAtPrice,
    isFeatured: bundle.isFeatured,
    isActive: bundle.isActive,
    stock,
    itemCount: bundle.items.reduce((total, item) => total + item.quantity, 0),
    items: sortBySortOrder(bundle.items).map(item => ({
      quantity: item.quantity,
      variantId: item.variant.id,
      variantName: item.variant.name,
      itemCode: item.variant.itemCode,
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
    })),
  }
}

export async function resolveStoreProfile(profileId?: string) {
  const profile = profileId
    ? await prisma.serverProfile.findUnique({ where: { id: profileId } })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Store profile not found' })
  }

  return profile
}

export function requireStoreAdmin(event: H3Event) {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  return user
}

export function toStoreSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function resolveStorePlayerForUser(profileId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      steamId: true,
    },
  })

  if (!user) {
    return null
  }

  const player = await prisma.serverPlayer.findFirst({
    where: {
      profileId,
      OR: [
        ...(user.steamId
          ? [{ steamId: user.steamId }]
          : []),
        {
          username: {
            equals: user.username,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      wallet: true,
    },
  })

  return player
}
