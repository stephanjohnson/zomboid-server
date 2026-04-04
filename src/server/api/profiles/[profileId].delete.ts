export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const profileId = getRouterParam(event, 'profileId')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Profile ID required' })
  }

  const profile = await prisma.serverProfile.findUnique({
    where: { id: profileId },
  })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  if (profile.isActive) {
    throw createError({ statusCode: 400, message: 'Cannot delete the active profile' })
  }

  await prisma.serverProfile.delete({ where: { id: profileId } })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'profile.delete',
      target: profileId,
      details: { name: profile.name },
    },
  })

  return { message: 'Profile deleted' }
})
