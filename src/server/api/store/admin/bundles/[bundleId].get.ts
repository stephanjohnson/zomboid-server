export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)
  const bundleId = getRouterParam(event, 'bundleId')

  if (!bundleId) {
    throw createError({ statusCode: 400, message: 'Bundle ID is required' })
  }

  const bundle = await prisma.storeBundle.findUnique({
    where: { id: bundleId },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  })

  if (!bundle) {
    throw createError({ statusCode: 404, message: 'Bundle not found' })
  }

  return { bundle }
})
