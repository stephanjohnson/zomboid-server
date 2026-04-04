export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const productId = getRouterParam(event, 'productId')

  if (!productId) {
    throw createError({ statusCode: 400, message: 'Product ID is required' })
  }

  const product = await prisma.storeProduct.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw createError({ statusCode: 404, message: 'Product not found' })
  }

  await prisma.storeProduct.delete({
    where: { id: productId },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.product.delete',
      target: product.name,
      details: {
        profileId: product.profileId,
        productId: product.id,
      },
    },
  })

  return { message: 'Product deleted' }
})
