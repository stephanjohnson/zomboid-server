import * as v from 'valibot'

const StopSchema = v.object({
  graceful: v.optional(v.boolean(), true),
  countdown: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(600)), 0),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  const body = await readValidatedBody(event, v.parser(StopSchema))

  if (body.countdown > 0) {
    // Queue a delayed stop job
    await publishJob('jobs.stop', {
      countdown: body.countdown,
      graceful: body.graceful,
      requestedBy: user.sub,
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'server.stop.scheduled',
        details: { countdown: body.countdown },
      },
    })

    return { message: `Server stop scheduled in ${body.countdown} seconds` }
  }

  try {
    if (body.graceful) {
      try {
        await sendRconCommand('servermsg "Server shutting down..."')
        await sendRconCommand('save')
        await sendRconCommand('quit')
      }
      catch {
        // RCON may not be available, fall through to Docker stop
      }
    }

    await stopGameContainer()

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'server.stop',
        details: { graceful: body.graceful },
      },
    })

    return { message: 'Game server stopped' }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to stop game server' })
  }
})
