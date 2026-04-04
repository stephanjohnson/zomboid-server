import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = profileId
    ? await prisma.serverProfile.findUnique({ where: { id: profileId } })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const players = await prisma.serverPlayer.findMany({
    where: { profileId: profile.id },
    include: {
      wallet: true,
      xpBalance: true,
      xpCategories: {
        orderBy: { category: 'asc' },
      },
    },
    orderBy: [
      { isOnline: 'desc' },
      { username: 'asc' },
    ],
  })

  return {
    profile,
    players,
  }
})