import { getGameItemCatalog } from '../../../utils/item-catalog'

import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)

  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)

  const [categories, products, bundles, catalog] = await Promise.all([
    prisma.storeCategory.findMany({
      where: { profileId: profile.id },
      include: {
        _count: {
          select: {
            productLinks: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.storeProduct.findMany({
      where: { profileId: profile.id },
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
        recommendationsFrom: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.storeBundle.findMany({
      where: { profileId: profile.id },
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
    getGameItemCatalog(profile.id),
  ])

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      servername: profile.servername,
    },
    catalog: {
      source: catalog.source,
      total: catalog.items.length,
    },
    categories: categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      heroTitle: category.heroTitle,
      heroDescription: category.heroDescription,
      accentColor: category.accentColor,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isFeatured: category.isFeatured,
      isActive: category.isActive,
      productCount: category._count.productLinks,
    })),
    products: products.map(product => ({
      ...mapStoreProductDetail({
        ...product,
        recommendationsFrom: product.recommendationsFrom.map(recommendation => ({
          ...recommendation,
          targetProduct: products.find(candidate => candidate.id === recommendation.targetProductId)!,
        })),
      }),
      recommendationProductIds: product.recommendationsFrom
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map(recommendation => recommendation.targetProductId),
    })),
    bundles: bundles.map(mapStoreBundleSummary),
    recommendationOptions: products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
    })),
    variantOptions: products.flatMap(product => product.variants.map(variant => ({
      id: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: variant.name,
      itemCode: variant.itemCode,
      price: variant.price,
      stock: variant.stock,
      label: `${product.name} / ${variant.name}`,
    }))),
  }
})
