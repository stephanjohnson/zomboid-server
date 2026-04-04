import * as v from 'valibot'

const BanSchema = v.object({
  reason: v.optional(v.string(), 'Banned by admin'),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const playerId = getRouterParam(event, 'playerId')
  if (!playerId) {
    throw createError({ statusCode: 400, message: 'Player ID required' })
  }

  const body = await readValidatedBody(event, v.parser(BanSchema))

  try {
    await sendRconCommand(`banuser "${playerId}" -r "${body.reason}"`)

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'player.ban',
        target: playerId,
        details: { reason: body.reason },
      },
    })

    return { message: `Player "${playerId}" banned` }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to ban player' })
  }
})
