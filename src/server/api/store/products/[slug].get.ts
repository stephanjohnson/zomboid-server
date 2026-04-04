import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Product slug is required' })
  }

  const product = await prisma.storeProduct.findFirst({
    where: {
      profileId: profile.id,
      slug,
      isActive: true,
    },
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

  if (!product) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  const viewer = event.context.user
    ? await resolveStorePlayerForUser(profile.id, event.context.user.sub)
    : null

  return {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    viewer: viewer
      ? {
          id: viewer.id,
          username: viewer.username,
          isOnline: viewer.isOnline,
          walletBalance: viewer.wallet?.balance ?? 0,
        }
      : null,
    product: mapStoreProductDetail(product),
  }
})
