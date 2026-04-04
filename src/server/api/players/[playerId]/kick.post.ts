import * as v from 'valibot'

const KickSchema = v.object({
  reason: v.optional(v.string(), 'Kicked by admin'),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  const playerId = getRouterParam(event, 'playerId')
  if (!playerId) {
    throw createError({ statusCode: 400, message: 'Player ID required' })
  }

  const body = await readValidatedBody(event, v.parser(KickSchema))

  try {
    await sendRconCommand(`kickuser "${playerId}" -r "${body.reason}"`)

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'player.kick',
        target: playerId,
        details: { reason: body.reason },
      },
    })

    return { message: `Player "${playerId}" kicked` }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to kick player' })
  }
})
