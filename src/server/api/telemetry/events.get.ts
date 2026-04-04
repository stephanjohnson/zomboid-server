import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(250)), 100),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  const { profileId, limit } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = profileId
    ? await prisma.serverProfile.findUnique({ where: { id: profileId } })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const events = await prisma.playerTelemetryEvent.findMany({
    where: { profileId: profile.id },
    include: {
      player: {
        select: {
          username: true,
        },
      },
      grants: true,
      xpGrants: true,
    },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  })

  return {
    profile,
    events,
  }
})