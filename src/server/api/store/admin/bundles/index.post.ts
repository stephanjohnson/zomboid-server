import * as v from 'valibot'

const BundleItemSchema = v.object({
  variantId: v.pipe(v.string(), v.minLength(1)),
  quantity: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  sortOrder: v.optional(v.number(), 0),
})

const BundleBodySchema = v.object({
  profileId: v.optional(v.string()),
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  slug: v.optional(v.string()),
  summary: v.optional(v.string()),
  description: v.optional(v.string()),
  badge: v.optional(v.string()),
  accentColor: v.optional(v.string()),
  price: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  compareAtPrice: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0)))),
  pricingMode: v.optional(v.picklist(['manual', 'discount']), 'discount'),
  discountPercent: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))),
  isFeatured: v.optional(v.boolean(), false),
  isActive: v.optional(v.boolean(), true),
  sortOrder: v.optional(v.number(), 0),
  items: v.pipe(v.array(BundleItemSchema), v.minLength(1)),
})

export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const body = await readValidatedBody(event, v.parser(BundleBodySchema))
  const profile = await resolveStoreProfile(body.profileId)

  const baseSlug = toStoreSlug(body.slug?.trim() || body.name) || `bundle-${Date.now().toString(36)}`
  let slug = baseSlug
  let suffix = 2

  while (await prisma.storeBundle.findUnique({ where: { profileId_slug: { profileId: profile.id, slug } } })) {
    slug = `${baseSlug}-${suffix}`
    suffix = suffix + 1
  }

  const items = [...new Map(body.items.map(item => [item.variantId, item])).values()]

  const bundle = await prisma.$transaction(async (transaction) => {
    const variants = await transaction.storeProductVariant.findMany({
      where: {
        id: { in: items.map(item => item.variantId) },
        product: {
          profileId: profile.id,
        },
      },
      include: {
        product: true,
      },
    })

    if (variants.length !== items.length) {
      throw createError({ statusCode: 422, message: 'One or more bundle items are invalid for this profile' })
    }

    const variantsById = new Map(variants.map(variant => [variant.id, variant]))
    const derivedCompareAtPrice = items.reduce((total, item) => {
      const variant = variantsById.get(item.variantId)!
      return total + ((variant.compareAtPrice ?? variant.price) * item.quantity)
    }, 0)
    const derivedBasePrice = items.reduce((total, item) => {
      const variant = variantsById.get(item.variantId)!
      return total + (variant.price * item.quantity)
    }, 0)

    const discountPercent = body.discountPercent ?? 0
    const computedPrice = body.pricingMode === 'manual' && typeof body.price === 'number'
      ? Math.round(body.price)
      : Math.max(0, Math.round(derivedBasePrice * (100 - discountPercent) / 100))

    const createdBundle = await transaction.storeBundle.create({
      data: {
        profileId: profile.id,
        name: body.name,
        slug,
        summary: body.summary?.trim() || null,
        description: body.description?.trim() || null,
        badge: body.badge?.trim() || null,
        accentColor: body.accentColor?.trim() || null,
        price: computedPrice,
        compareAtPrice: typeof body.compareAtPrice === 'number' ? Math.round(body.compareAtPrice) : derivedCompareAtPrice,
        isFeatured: body.isFeatured ?? false,
        isActive: body.isActive ?? true,
        sortOrder: Math.floor(body.sortOrder ?? 0),
        metadata: {
          pricingMode: body.pricingMode ?? 'discount',
          discountPercent,
        },
      },
    })

    await transaction.storeBundleItem.createMany({
      data: items.map((item, index) => ({
        bundleId: createdBundle.id,
        variantId: item.variantId,
        quantity: Math.max(1, Math.floor(item.quantity)),
        sortOrder: Math.floor(item.sortOrder ?? index),
      })),
    })

    return transaction.storeBundle.findUniqueOrThrow({
      where: { id: createdBundle.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
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
      action: 'store.bundle.create',
      target: bundle.name,
      details: {
        profileId: profile.id,
        bundleId: bundle.id,
        itemCount: bundle.items.length,
      },
    },
  })

  return {
    message: 'Bundle created',
    bundle: mapStoreBundleSummary(bundle),
  }
})
