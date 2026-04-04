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

  await prisma.mod.delete({ where: { id: modId } })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'mod.remove',
      target: modId,
      details: { workshopId: mod.workshopId, modName: mod.modName },
    },
  })

  return { message: 'Mod removed' }
})
