import * as v from 'valibot'

const TeleportSchema = v.object({
  x: v.number(),
  y: v.number(),
  z: v.optional(v.number(), 0),
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

  const body = await readValidatedBody(event, v.parser(TeleportSchema))

  try {
    await sendRconCommand(`teleport "${playerId}" ${body.x},${body.y},${body.z}`)

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'player.teleport',
        target: playerId,
        details: { x: body.x, y: body.y, z: body.z },
      },
    })

    return { message: `Player "${playerId}" teleported` }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to teleport player' })
  }
})
