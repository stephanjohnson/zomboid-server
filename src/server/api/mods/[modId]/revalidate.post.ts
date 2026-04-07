export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const modId = getRouterParam(event, 'modId')
  if (!modId) {
    throw createError({ statusCode: 400, message: 'Mod ID required' })
  }

  const mod = await prisma.mod.findUnique({ where: { id: modId } })
  if (!mod) {
    throw createError({ statusCode: 404, message: 'Mod not found' })
  }

  const revalidatedAt = new Date()

  await prisma.mod.update({
    where: { id: modId },
    data: { updatedAt: revalidatedAt },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'mod.revalidate',
      target: modId,
      details: {
        profileId: mod.profileId,
        workshopId: mod.workshopId,
        revalidatedAt,
      },
    },
  })

  return {
    message: 'Mod verification restarted',
    revalidatedAt,
  }
})