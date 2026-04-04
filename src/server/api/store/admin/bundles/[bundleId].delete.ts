export default defineEventHandler(async (event) => {
  const user = requireStoreAdmin(event)
  const bundleId = getRouterParam(event, 'bundleId')

  if (!bundleId) {
    throw createError({ statusCode: 400, message: 'Bundle ID is required' })
  }

  const bundle = await prisma.storeBundle.findUnique({
    where: { id: bundleId },
  })

  if (!bundle) {
    throw createError({ statusCode: 404, message: 'Bundle not found' })
  }

  await prisma.storeBundle.delete({
    where: { id: bundleId },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'store.bundle.delete',
      target: bundle.name,
      details: {
        profileId: bundle.profileId,
        bundleId: bundle.id,
      },
    },
  })

  return { message: 'Bundle deleted' }
})
