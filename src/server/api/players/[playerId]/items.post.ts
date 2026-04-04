import * as v from 'valibot'

const GiveItemSchema = v.object({
  itemId: v.pipe(v.string(), v.minLength(1)),
  count: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(999)), 1),
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

  const body = await readValidatedBody(event, v.parser(GiveItemSchema))

  try {
    await sendRconCommand(`additem "${playerId}" "${body.itemId}" ${body.count}`)

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'player.give_item',
        target: playerId,
        details: { itemId: body.itemId, count: body.count },
      },
    })

    return { message: `Gave ${body.count}x ${body.itemId} to "${playerId}"` }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to give item' })
  }
})
