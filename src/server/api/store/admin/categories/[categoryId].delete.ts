export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const categoryId = getRouterParam(event, 'categoryId')

  if (!categoryId) {
    throw createError({ statusCode: 400, message: 'Category ID is required' })
  }

  const category = await prisma.storeCategory.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    throw createError({ statusCode: 404, message: 'Category not found' })
  }

  await prisma.storeCategory.delete({
    where: { id: categoryId },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.category.delete',
      target: category.name,
      details: {
        profileId: category.profileId,
        categoryId: category.id,
      },
    },
  })

  return { message: 'Category deleted' }
})
