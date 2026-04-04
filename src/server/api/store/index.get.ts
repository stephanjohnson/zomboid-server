import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)

  const [categories, products, bundles, viewer] = await Promise.all([
    prisma.storeCategory.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            productLinks: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.storeProduct.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
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
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.storeBundle.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
      },
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
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    event.context.user
      ? resolveStorePlayerForUser(profile.id, event.context.user.sub)
      : null,
  ])

  const productCards = products.map(mapStoreProductSummary)
  const bundleCards = bundles.map(mapStoreBundleSummary)

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      servername: profile.servername,
    },
    viewer: viewer
      ? {
          id: viewer.id,
          username: viewer.username,
          isOnline: viewer.isOnline,
          walletBalance: viewer.wallet?.balance ?? 0,
          walletTotalSpent: viewer.wallet?.totalSpent ?? 0,
        }
      : null,
    categories: categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      heroTitle: category.heroTitle,
      heroDescription: category.heroDescription,
      accentColor: category.accentColor,
      icon: category.icon,
      isFeatured: category.isFeatured,
      productCount: category._count.productLinks,
    })),
    featuredProducts: productCards.filter(product => product.isFeatured).slice(0, 6),
    products: productCards,
    featuredBundles: bundleCards.filter(bundle => bundle.isFeatured).slice(0, 4),
    bundles: bundleCards,
  }
})
