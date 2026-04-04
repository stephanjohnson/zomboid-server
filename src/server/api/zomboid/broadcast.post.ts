import * as v from 'valibot'

const BroadcastSchema = v.object({
  message: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  const body = await readValidatedBody(event, v.parser(BroadcastSchema))

  try {
    await sendRconCommand(`servermsg "${body.message}"`)

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'server.broadcast',
        details: { message: body.message },
      },
    })

    return { message: 'Broadcast sent' }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to send broadcast (is the server running?)' })
  }
})
