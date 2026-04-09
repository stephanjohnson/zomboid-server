export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)
  const productId = getRouterParam(event, 'productId')

  if (!productId) {
    throw createError({ statusCode: 400, message: 'Product ID is required' })
  }

  const product = await prisma.storeProduct.findUnique({
    where: { id: productId },
    include: {
      categories: {
        include: { category: true },
      },
      optionGroups: {
        orderBy: { sortOrder: 'asc' },
        include: {
          values: { orderBy: { sortOrder: 'asc' } },
        },
      },
      variants: {
        orderBy: { sortOrder: 'asc' },
        include: {
          selections: {
            include: {
              optionValue: {
                include: { optionGroup: true },
              },
            },
          },
        },
      },
      recommendationsFrom: {
        orderBy: { sortOrder: 'asc' },
        include: {
          targetProduct: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  })

  if (!product) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  return {
    product: {
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        weight: variant.weight === null ? null : Number(variant.weight),
      })),
    },
  }
})
