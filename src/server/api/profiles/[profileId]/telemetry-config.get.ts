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
    include: {
      telemetryListeners: {
        orderBy: { adapterKey: 'asc' },
      },
      workflows: {
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
      actionRules: {
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const [xpBalances, xpCategories] = await Promise.all([
    prisma.playerXpBalance.findMany({
      where: {
        player: { profileId },
      },
      include: {
        player: {
          select: { username: true },
        },
      },
      orderBy: { totalXp: 'desc' },
    }),
    prisma.playerXpCategoryBalance.findMany({
      where: {
        player: { profileId },
      },
      include: {
        player: {
          select: { username: true },
        },
      },
      orderBy: [
        { category: 'asc' },
        { totalXp: 'desc' },
      ],
    }),
  ])

  return {
    profile,
    xpBalances,
    xpCategories,
  }
})