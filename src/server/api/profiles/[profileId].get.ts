export default defineEventHandler(async (event) => {
  const profileId = getRouterParam(event, 'profileId')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Profile ID required' })
  }

  const profile = await prisma.serverProfile.findUnique({
    where: { id: profileId },
    include: {
      mods: { orderBy: { order: 'asc' } },
      _count: { select: { backups: true } },
    },
  })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  return profile
})
