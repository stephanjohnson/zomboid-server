import * as v from 'valibot'

const CategoryBodySchema = v.object({
  profileId: v.optional(v.string()),
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  slug: v.optional(v.string()),
  description: v.optional(v.string()),
  heroTitle: v.optional(v.string()),
  heroDescription: v.optional(v.string()),
  accentColor: v.optional(v.string()),
  icon: v.optional(v.string()),
  sortOrder: v.optional(v.number(), 0),
  isFeatured: v.optional(v.boolean(), false),
  isActive: v.optional(v.boolean(), true),
})

export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const body = await readValidatedBody(event, v.parser(CategoryBodySchema))
  const profile = await resolveStoreProfile(body.profileId)

  const baseSlug = toStoreSlug(body.slug?.trim() || body.name) || `category-${Date.now().toString(36)}`
  let slug = baseSlug
  let suffix = 2

  while (await prisma.storeCategory.findUnique({ where: { profileId_slug: { profileId: profile.id, slug } } })) {
    slug = `${baseSlug}-${suffix}`
    suffix = suffix + 1
  }

  const category = await prisma.storeCategory.create({
    data: {
      profileId: profile.id,
      name: body.name,
      slug,
      description: body.description?.trim() || null,
      heroTitle: body.heroTitle?.trim() || null,
      heroDescription: body.heroDescription?.trim() || null,
      accentColor: body.accentColor?.trim() || null,
      icon: body.icon?.trim() || null,
      sortOrder: Math.floor(body.sortOrder ?? 0),
      isFeatured: body.isFeatured ?? false,
      isActive: body.isActive ?? true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.category.create',
      target: category.name,
      details: {
        profileId: profile.id,
        categoryId: category.id,
      },
    },
  })

  return {
    message: 'Category created',
    category,
  }
})
