import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)

  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)

  const [catalog, existingCategories] = await Promise.all([
    getGameItemCatalog(profile.id),
    prisma.storeCategory.findMany({
      where: { profileId: profile.id },
      select: { id: true, name: true, slug: true },
    }),
  ])

  const existingByName = new Map(
    existingCategories.map(category => [category.name.trim().toLowerCase(), category] as const),
  )
  const existingBySlug = new Map(
    existingCategories.map(category => [category.slug, category] as const),
  )

  const categories = new Map<string, {
    name: string
    slug: string
    itemCount: number
    sampleItems: string[]
    alreadyImported: boolean
    existingCategoryId: string | null
    existingCategorySlug: string | null
  }>()

  for (const item of catalog.items) {
    const name = item.displayCategory?.trim() || item.category?.trim() || item.itemType?.trim() || null

    if (!name) {
      continue
    }

    const key = name.toLowerCase()
    const slug = toStoreSlug(name) || key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const existingCategory = existingByName.get(key) ?? existingBySlug.get(slug)
    const current = categories.get(key)

    if (current) {
      current.itemCount += 1

      if (item.name && current.sampleItems.length < 3 && !current.sampleItems.includes(item.name)) {
        current.sampleItems.push(item.name)
      }

      continue
    }

    categories.set(key, {
      name,
      slug,
      itemCount: 1,
      sampleItems: item.name ? [item.name] : [],
      alreadyImported: Boolean(existingCategory),
      existingCategoryId: existingCategory?.id ?? null,
      existingCategorySlug: existingCategory?.slug ?? null,
    })
  }

  const sortedCategories = [...categories.values()].sort((left, right) => {
    if (left.alreadyImported !== right.alreadyImported) {
      return Number(left.alreadyImported) - Number(right.alreadyImported)
    }

    if (right.itemCount !== left.itemCount) {
      return right.itemCount - left.itemCount
    }

    return left.name.localeCompare(right.name)
  })

  return {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    source: catalog.source,
    total: sortedCategories.length,
    categories: sortedCategories,
  }
})