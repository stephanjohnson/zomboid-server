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

const ProductPatchSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  slug: v.optional(v.string()),
  summary: v.optional(v.nullable(v.string())),
  description: v.optional(v.nullable(v.string())),
  overview: v.optional(v.nullable(v.string())),
  featureBullets: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1)))),
  specs: v.optional(v.array(SpecRowSchema)),
  badge: v.optional(v.nullable(v.string())),
  accentColor: v.optional(v.nullable(v.string())),
  categoryIds: v.optional(v.array(v.string())),
  recommendationProductIds: v.optional(v.array(v.string())),
  isFeatured: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  optionGroups: v.optional(v.array(OptionGroupSchema)),
  variants: v.optional(v.pipe(v.array(VariantSchema), v.minLength(1))),
})

export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const productId = getRouterParam(event, 'productId')

  if (!productId) {
    throw createError({ statusCode: 400, message: 'Product ID is required' })
  }

  const body = await readValidatedBody(event, v.parser(ProductPatchSchema))

  const existing = await prisma.storeProduct.findUnique({
    where: { id: productId },
    select: { id: true, profileId: true, slug: true, name: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  const profileId = existing.profileId

  // Resolve slug if changed
  let slug = existing.slug
  if (body.slug !== undefined || body.name !== undefined) {
    const newSlugBase = toStoreSlug((body.slug ?? '').trim() || body.name || existing.name) || existing.slug
    if (newSlugBase !== existing.slug) {
      slug = newSlugBase
      let suffix = 2
      while (await prisma.storeProduct.findFirst({ where: { profileId, slug, id: { not: productId } } })) {
        slug = `${newSlugBase}-${suffix}`
        suffix++
      }
    }
  }

  const product = await prisma.$transaction(async (tx) => {
    // Update scalar fields
    await tx.storeProduct.update({
      where: { id: productId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        slug,
        ...(body.summary !== undefined && { summary: body.summary?.trim() || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.overview !== undefined && { overview: body.overview?.trim() || null }),
        ...(body.featureBullets !== undefined && { featureBullets: body.featureBullets }),
        ...(body.specs !== undefined && { specs: body.specs }),
        ...(body.badge !== undefined && { badge: body.badge?.trim() || null }),
        ...(body.accentColor !== undefined && { accentColor: body.accentColor?.trim() || null }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: Math.floor(body.sortOrder) }),
      },
    })

    // Replace categories if provided
    if (body.categoryIds !== undefined) {
      await tx.storeProductCategory.deleteMany({ where: { productId } })
      const categoryIds = [...new Set(body.categoryIds)]
      if (categoryIds.length > 0) {
        const validCategories = await tx.storeCategory.findMany({
          where: { profileId, id: { in: categoryIds } },
          select: { id: true },
        })
        if (validCategories.length > 0) {
          await tx.storeProductCategory.createMany({
            data: validCategories.map((cat, i) => ({ productId, categoryId: cat.id, sortOrder: i })),
          })
        }
      }
    }

    // Replace recommendations if provided
    if (body.recommendationProductIds !== undefined) {
      await tx.storeProductRecommendation.deleteMany({ where: { sourceProductId: productId } })
      const recIds = [...new Set(body.recommendationProductIds)].filter(id => id !== productId)
      if (recIds.length > 0) {
        const validRecs = await tx.storeProduct.findMany({
          where: { profileId, id: { in: recIds } },
          select: { id: true },
        })
        if (validRecs.length > 0) {
          await tx.storeProductRecommendation.createMany({
            data: validRecs.map((rec, i) => ({ sourceProductId: productId, targetProductId: rec.id, sortOrder: i })),
          })
        }
      }
    }

    // Replace option groups if provided (delete-and-recreate)
    const optionValueIdMap = new Map<string, string>()
    if (body.optionGroups !== undefined) {
      // Delete existing option groups (cascades to values and variant-option links)
      await tx.storeProductVariantOptionValue.deleteMany({
        where: { optionValue: { optionGroup: { productId } } },
      })
      await tx.storeProductOptionValue.deleteMany({
        where: { optionGroup: { productId } },
      })
      await tx.storeProductOptionGroup.deleteMany({ where: { productId } })

      for (const [groupIndex, group] of body.optionGroups.entries()) {
        const groupSlug = toStoreSlug(group.slug?.trim() || group.name) || `option-${groupIndex + 1}`
        const createdGroup = await tx.storeProductOptionGroup.create({
          data: {
            productId,
            name: group.name,
            slug: groupSlug,
            displayType: group.displayType ?? 'TEXT',
            sortOrder: Math.floor(group.sortOrder ?? groupIndex),
          },
        })

        for (const [valueIndex, value] of group.values.entries()) {
          const valueSlug = toStoreSlug(value.slug?.trim() || value.label) || `value-${valueIndex + 1}`
          const createdValue = await tx.storeProductOptionValue.create({
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
    }

    // Replace variants if provided (delete-and-recreate)
    if (body.variants !== undefined) {
      // If option groups weren't updated, load existing option value map
      if (body.optionGroups === undefined) {
        const existingGroups = await tx.storeProductOptionGroup.findMany({
          where: { productId },
          include: { values: true },
        })
        for (const group of existingGroups) {
          for (const value of group.values) {
            optionValueIdMap.set(`${group.slug}:${value.slug}`, value.id)
          }
        }
      }

      await tx.storeProductVariantOptionValue.deleteMany({
        where: { variant: { productId } },
      })
      await tx.storeProductVariant.deleteMany({ where: { productId } })

      const hasExplicitDefault = body.variants.some(v => v.isDefault)

      for (const [variantIndex, variant] of body.variants.entries()) {
        const variantSkuBase = toStoreSlug(variant.sku?.trim() || `${slug}-${variant.name}`) || `${slug}-${variantIndex + 1}`
        let variantSku = variantSkuBase
        let variantSkuSuffix = 2
        while (await tx.storeProductVariant.findUnique({ where: { sku: variantSku } })) {
          variantSku = `${variantSkuBase}-${variantSkuSuffix}`
          variantSkuSuffix++
        }

        const selectionIds = Object.entries(variant.selections ?? {})
          .map(([gk, vk]) => optionValueIdMap.get(`${toStoreSlug(gk)}:${toStoreSlug(vk)}`))
          .filter((id): id is string => Boolean(id))

        await tx.storeProductVariant.create({
          data: {
            productId,
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
            metadata: (variant.metadata ?? undefined) as typeof variant.metadata,
            isDefault: hasExplicitDefault ? Boolean(variant.isDefault) : variantIndex === 0,
            isActive: variant.isActive ?? true,
            sortOrder: Math.floor(variant.sortOrder ?? variantIndex),
            selections: selectionIds.length > 0
              ? { create: selectionIds.map(optionValueId => ({ optionValueId })) }
              : undefined,
          },
        })
      }
    }

    return tx.storeProduct.findUniqueOrThrow({
      where: { id: productId },
      include: {
        categories: { include: { category: true } },
        optionGroups: { include: { values: true } },
        variants: {
          include: {
            selections: {
              include: { optionValue: { include: { optionGroup: true } } },
            },
          },
        },
        recommendationsFrom: {
          include: {
            targetProduct: {
              include: {
                categories: { include: { category: true } },
                variants: {
                  include: {
                    selections: {
                      include: { optionValue: { include: { optionGroup: true } } },
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
      action: 'store.product.update',
      target: product.name,
      details: { profileId, productId: product.id },
    },
  })

  return {
    message: 'Product updated',
    product: mapStoreProductDetail(product),
  }
})
