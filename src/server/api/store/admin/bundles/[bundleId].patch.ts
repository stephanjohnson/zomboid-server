import * as v from 'valibot'

const BundleItemSchema = v.object({
  variantId: v.pipe(v.string(), v.minLength(1)),
  quantity: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  sortOrder: v.optional(v.number(), 0),
})

const BundlePatchSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  slug: v.optional(v.string()),
  summary: v.optional(v.nullable(v.string())),
  description: v.optional(v.nullable(v.string())),
  badge: v.optional(v.nullable(v.string())),
  accentColor: v.optional(v.nullable(v.string())),
  price: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  compareAtPrice: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  pricingMode: v.optional(v.picklist(['manual', 'discount'])),
  discountPercent: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
  isFeatured: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  items: v.optional(v.pipe(v.array(BundleItemSchema), v.minLength(1))),
})

export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const bundleId = getRouterParam(event, 'bundleId')

  if (!bundleId) {
    throw createError({ statusCode: 400, message: 'Bundle ID is required' })
  }

  const body = await readValidatedBody(event, v.parser(BundlePatchSchema))

  const existing = await prisma.storeBundle.findUnique({
    where: { id: bundleId },
    select: { id: true, profileId: true, slug: true, name: true, metadata: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Bundle not found' })
  }

  const profileId = existing.profileId

  let slug = existing.slug
  if (body.slug !== undefined || body.name !== undefined) {
    const newSlugBase = toStoreSlug((body.slug ?? '').trim() || body.name || existing.name) || existing.slug
    if (newSlugBase !== existing.slug) {
      slug = newSlugBase
      let suffix = 2
      while (await prisma.storeBundle.findFirst({ where: { profileId, slug, id: { not: bundleId } } })) {
        slug = `${newSlugBase}-${suffix}`
        suffix++
      }
    }
  }

  const bundle = await prisma.$transaction(async (tx) => {
    // Resolve pricing if items are being updated
    const existingMeta = (existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata))
      ? existing.metadata as Record<string, unknown>
      : {}
    const pricingMode = body.pricingMode ?? (existingMeta.pricingMode as string) ?? 'discount'
    const discountPercent = body.discountPercent ?? (existingMeta.discountPercent as number) ?? 0

    let computedPrice: number | undefined
    let computedCompareAt: number | undefined

    if (body.items !== undefined) {
      const items = [...new Map(body.items.map(i => [i.variantId, i])).values()]

      const variants = await tx.storeProductVariant.findMany({
        where: {
          id: { in: items.map(i => i.variantId) },
          product: { profileId },
        },
        include: { product: true },
      })

      if (variants.length !== items.length) {
        throw createError({ statusCode: 422, message: 'One or more bundle items are invalid for this profile' })
      }

      const variantsById = new Map(variants.map(v => [v.id, v]))
      const derivedCompareAt = items.reduce((total, item) => {
        const v = variantsById.get(item.variantId)!
        return total + ((v.compareAtPrice ?? v.price) * item.quantity)
      }, 0)
      const derivedBase = items.reduce((total, item) => {
        const v = variantsById.get(item.variantId)!
        return total + (v.price * item.quantity)
      }, 0)

      computedPrice = pricingMode === 'manual' && typeof body.price === 'number'
        ? Math.round(body.price)
        : Math.max(0, Math.round(derivedBase * (100 - discountPercent) / 100))

      computedCompareAt = typeof body.compareAtPrice === 'number' ? Math.round(body.compareAtPrice) : derivedCompareAt

      // Replace items
      await tx.storeBundleItem.deleteMany({ where: { bundleId } })
      await tx.storeBundleItem.createMany({
        data: items.map((item, index) => ({
          bundleId,
          variantId: item.variantId,
          quantity: Math.max(1, Math.floor(item.quantity)),
          sortOrder: Math.floor(item.sortOrder ?? index),
        })),
      })
    }

    await tx.storeBundle.update({
      where: { id: bundleId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        slug,
        ...(body.summary !== undefined && { summary: body.summary?.trim() || null }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.badge !== undefined && { badge: body.badge?.trim() || null }),
        ...(body.accentColor !== undefined && { accentColor: body.accentColor?.trim() || null }),
        ...(computedPrice !== undefined && { price: computedPrice }),
        ...(computedCompareAt !== undefined && { compareAtPrice: computedCompareAt }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: Math.floor(body.sortOrder) }),
        metadata: { pricingMode, discountPercent },
      },
    })

    return tx.storeBundle.findUniqueOrThrow({
      where: { id: bundleId },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
      },
    })
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.bundle.update',
      target: bundle.name,
      details: { profileId, bundleId: bundle.id },
    },
  })

  return {
    message: 'Bundle updated',
    bundle: mapStoreBundleSummary(bundle),
  }
})
