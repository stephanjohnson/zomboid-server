import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Category slug is required' })
  }

  const category = await prisma.storeCategory.findFirst({
    where: {
      profileId: profile.id,
      slug,
      isActive: true,
    },
    include: {
      productLinks: {
        include: {
          product: {
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

  if (!category) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  return {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      heroTitle: category.heroTitle,
      heroDescription: category.heroDescription,
      accentColor: category.accentColor,
      icon: category.icon,
    },
    products: category.productLinks
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(link => mapStoreProductSummary(link.product)),
  }
})
