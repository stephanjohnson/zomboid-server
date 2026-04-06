export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)
  const categoryId = getRouterParam(event, 'categoryId')

  if (!categoryId) {
    throw createError({ statusCode: 400, message: 'Category ID is required' })
  }

  const category = await prisma.storeCategory.findUnique({
    where: { id: categoryId },
    include: {
      productLinks: {
        include: { product: { select: { id: true, name: true, slug: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!category) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  return { category }
})
