import * as v from 'valibot'

const SpecRowSchema = v.object({
  group: v.optional(v.string()),
  label: v.pipe(v.string(), v.trim(), v.minLength(1)),
  value: v.pipe(v.string(), v.trim(), v.minLength(1)),
})

const OptionValueSchema = v.object({
  label: v.pipe(v.string(), v.trim(), v.minLength(1)),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  colorHex: v.optional(v.string()),
  sortOrder: v.optional(v.number(), 0),
})

const OptionGroupSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  slug: v.optional(v.string()),
  displayType: v.optional(v.picklist(['TEXT', 'COLOR']), 'TEXT'),
  sortOrder: v.optional(v.number(), 0),
  values: v.pipe(v.array(OptionValueSchema), v.minLength(1)),
})

const VariantSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  sku: v.optional(v.string()),
  itemCode: v.pipe(v.string(), v.trim(), v.minLength(1)),
  gameName: v.optional(v.string()),
  gameCategory: v.optional(v.string()),
  price: v.pipe(v.number(), v.minValue(0)),
  compareAtPrice: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  quantity: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  stock: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  weight: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  badge: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  metadata: v.optional(v.nullable(v.record(v.string(), v.unknown()))),
  isDefault: v.optional(v.boolean(), false),
  isActive: v.optional(v.boolean(), true),
  sortOrder: v.optional(v.number(), 0),
  selections: v.optional(v.record(v.string(), v.string()), {}),
})

const ProductBodySchema = v.object({
  profileId: v.optional(v.string()),
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  slug: v.optional(v.string()),
  summary: v.optional(v.string()),
  description: v.optional(v.string()),
  overview: v.optional(v.string()),
  featureBullets: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))), []),
  specs: v.optional(v.array(SpecRowSchema), []),
  badge: v.optional(v.string()),
  accentColor: v.optional(v.string()),
  categoryIds: v.optional(v.array(v.string()), []),
  recommendationProductIds: v.optional(v.array(v.string()), []),
  isFeatured: v.optional(v.boolean(), false),
  isActive: v.optional(v.boolean(), true),
  sortOrder: v.optional(v.number(), 0),
  optionGroups: v.optional(v.array(OptionGroupSchema), []),
  variants: v.pipe(v.array(VariantSchema), v.minLength(1)),
})

export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const body = await readValidatedBody(event, v.parser(ProductBodySchema))
  const profile = await resolveStoreProfile(body.profileId)

  const baseSlug = toStoreSlug(body.slug?.trim() || body.name) || `product-${Date.now().toString(36)}`
  let slug = baseSlug
  let suffix = 2

  while (await prisma.storeProduct.findUnique({ where: { profileId_slug: { profileId: profile.id, slug } } })) {
    slug = `${baseSlug}-${suffix}`
    suffix = suffix + 1
  }

  const categoryIds = [...new Set(body.categoryIds ?? [])]
  const recommendationIds = [...new Set(body.recommendationProductIds ?? [])]
  const hasExplicitDefault = body.variants.some(variant => variant.isDefault)

  const product = await prisma.$transaction(async (transaction) => {
    const validCategories = categoryIds.length > 0
      ? await transaction.storeCategory.findMany({
          where: {
            profileId: profile.id,
            id: { in: categoryIds },
          },
          select: { id: true },
        })
      : []

    const validRecommendations = recommendationIds.length > 0
      ? await transaction.storeProduct.findMany({
          where: {
            profileId: profile.id,
            id: { in: recommendationIds },
          },
          select: { id: true },
        })
      : []

    const createdProduct = await transaction.storeProduct.create({
      data: {
        profileId: profile.id,
        name: body.name,
        slug,
        summary: body.summary?.trim() || null,
        description: body.description?.trim() || null,
        overview: body.overview?.trim() || null,
        featureBullets: body.featureBullets ?? [],
        specs: body.specs ?? [],
        badge: body.badge?.trim() || null,
        accentColor: body.accentColor?.trim() || null,
        isFeatured: body.isFeatured ?? false,
        isActive: body.isActive ?? true,
        sortOrder: Math.floor(body.sortOrder ?? 0),
      },
    })

    if (validCategories.length > 0) {
      await transaction.storeProductCategory.createMany({
        data: validCategories.map((category, index) => ({
          productId: createdProduct.id,
          categoryId: category.id,
          sortOrder: index,
        })),
      })
    }

    const optionValueIdMap = new Map<string, string>()

    for (const [groupIndex, group] of (body.optionGroups ?? []).entries()) {
      const groupSlug = toStoreSlug(group.slug?.trim() || group.name) || `option-${groupIndex + 1}`
      const createdGroup = await transaction.storeProductOptionGroup.create({
        data: {
          productId: createdProduct.id,
          name: group.name,
          slug: groupSlug,
          displayType: group.displayType ?? 'TEXT',
          sortOrder: Math.floor(group.sortOrder ?? groupIndex),
        },
      })

      for (const [valueIndex, value] of group.values.entries()) {
        const valueSlug = toStoreSlug(value.slug?.trim() || value.label) || `value-${valueIndex + 1}`
        const createdValue = await transaction.storeProductOptionValue.create({
          data: {
            optionGroupId: createdGroup.id,
            label: value.label,
            slug: valueSlug,
            description: value.description?.trim() || null,
            colorHex: value.colorHex?.trim() || null,
            sortOrder: Math.floor(value.sortOrder ?? valueIndex),
          },
        })

        optionValueIdMap.set(`${groupSlug}:${valueSlug}`, createdValue.id)
      }
    }

    for (const [variantIndex, variant] of body.variants.entries()) {
      const variantSkuBase = toStoreSlug(variant.sku?.trim() || `${slug}-${variant.name}`) || `${slug}-${variantIndex + 1}`
      let variantSku = variantSkuBase
      let variantSkuSuffix = 2

      while (await transaction.storeProductVariant.findUnique({ where: { sku: variantSku } })) {
        variantSku = `${variantSkuBase}-${variantSkuSuffix}`
        variantSkuSuffix = variantSkuSuffix + 1
      }

      const selectionIds = Object.entries(variant.selections ?? {})
        .map(([groupKey, valueKey]) => optionValueIdMap.get(`${toStoreSlug(groupKey)}:${toStoreSlug(valueKey)}`))
        .filter((value): value is string => Boolean(value))

      await transaction.storeProductVariant.create({
        data: {
          productId: createdProduct.id,
          name: variant.name,
          sku: variantSku,
          itemCode: variant.itemCode,
          gameName: variant.gameName?.trim() || null,
          gameCategory: variant.gameCategory?.trim() || null,
          price: Math.round(variant.price),
          compareAtPrice: typeof variant.compareAtPrice === 'number' ? Math.round(variant.compareAtPrice) : null,
          quantity: Math.max(1, Math.floor(variant.quantity ?? 1)),
          stock: typeof variant.stock === 'number' ? Math.floor(variant.stock) : null,
          weight: typeof variant.weight === 'number' ? variant.weight : null,
          badge: variant.badge?.trim() || null,
          imageUrl: variant.imageUrl?.trim() || null,
          metadata: variant.metadata ?? undefined,
          isDefault: hasExplicitDefault ? Boolean(variant.isDefault) : variantIndex === 0,
          isActive: variant.isActive ?? true,
          sortOrder: Math.floor(variant.sortOrder ?? variantIndex),
          selections: selectionIds.length > 0
            ? {
                create: selectionIds.map(optionValueId => ({ optionValueId })),
              }
            : undefined,
        },
      })
    }

    if (validRecommendations.length > 0) {
      await transaction.storeProductRecommendation.createMany({
        data: validRecommendations
          .filter(recommendation => recommendation.id !== createdProduct.id)
          .map((recommendation, index) => ({
            sourceProductId: createdProduct.id,
            targetProductId: recommendation.id,
            sortOrder: index,
          })),
      })
    }

    return transaction.storeProduct.findUniqueOrThrow({
      where: { id: createdProduct.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        optionGroups: {
          include: {
            values: true,
          },
        },
        variants: {
          include: {
            selections: {
              include: {
                optionValue: {
                  include: {
                    optionGroup: true,
                  },
                },
              },
            },
          },
        },
        recommendationsFrom: {
          include: {
            targetProduct: {
              include: {
                categories: {
                  include: {
                    category: true,
                  },
                },
                variants: {
                  include: {
                    selections: {
                      include: {
                        optionValue: {
                          include: {
                            optionGroup: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.product.create',
      target: product.name,
      details: {
        profileId: profile.id,
        productId: product.id,
        variantCount: product.variants.length,
      },
    },
  })

  return {
    message: 'Product created',
    product: mapStoreProductDetail(product),
  }
})
