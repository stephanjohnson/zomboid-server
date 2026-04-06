import * as v from 'valibot'

const CategoryPatchSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  slug: v.optional(v.string()),
  description: v.optional(v.nullable(v.string())),
  heroTitle: v.optional(v.nullable(v.string())),
  heroDescription: v.optional(v.nullable(v.string())),
  accentColor: v.optional(v.nullable(v.string())),
  icon: v.optional(v.nullable(v.string())),
  sortOrder: v.optional(v.number()),
  isFeatured: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
})

export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const categoryId = getRouterParam(event, 'categoryId')

  if (!categoryId) {
    throw createError({ statusCode: 400, message: 'Category ID is required' })
  }

  const body = await readValidatedBody(event, v.parser(CategoryPatchSchema))

  const existing = await prisma.storeCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, profileId: true, slug: true, name: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  const profileId = existing.profileId

  let slug = existing.slug
  if (body.slug !== undefined || body.name !== undefined) {
    const newSlugBase = toStoreSlug((body.slug ?? '').trim() || body.name || existing.name) || existing.slug
    if (newSlugBase !== existing.slug) {
      slug = newSlugBase
      let suffix = 2
      while (await prisma.storeCategory.findFirst({ where: { profileId, slug, id: { not: categoryId } } })) {
        slug = `${newSlugBase}-${suffix}`
        suffix++
      }
    }
  }

  const category = await prisma.storeCategory.update({
    where: { id: categoryId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      slug,
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.heroTitle !== undefined && { heroTitle: body.heroTitle?.trim() || null }),
      ...(body.heroDescription !== undefined && { heroDescription: body.heroDescription?.trim() || null }),
      ...(body.accentColor !== undefined && { accentColor: body.accentColor?.trim() || null }),
      ...(body.icon !== undefined && { icon: body.icon?.trim() || null }),
      ...(body.sortOrder !== undefined && { sortOrder: Math.floor(body.sortOrder) }),
      ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.category.update',
      target: category.name,
      details: { profileId, categoryId: category.id },
    },
  })

  return { message: 'Category updated', category }
})
