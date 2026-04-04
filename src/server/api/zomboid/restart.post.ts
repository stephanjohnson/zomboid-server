import * as v from 'valibot'

const RestartSchema = v.object({
  countdown: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(600)), 0),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  const body = await readValidatedBody(event, v.parser(RestartSchema))

  if (body.countdown > 0) {
    await publishJob('jobs.restart', {
      countdown: body.countdown,
      requestedBy: user.sub,
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'server.restart.scheduled',
        details: { countdown: body.countdown },
      },
    })

    return { message: `Server restart scheduled in ${body.countdown} seconds` }
  }

  try {
    try {
      await sendRconCommand('servermsg "Server restarting..."')
      await sendRconCommand('save')
    }
    catch {
      // RCON may not be available
    }

    const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })

    if (!profile) {
      throw createError({ statusCode: 409, message: 'No active server profile' })
    }

    const serverIniOverrides = profile.serverIniOverrides as Record<string, string> | null

    await reconcileGameContainer({
      servername: profile.servername,
      gamePort: profile.gamePort,
      directPort: profile.directPort,
      rconPort: profile.rconPort,
      steamBuild: profile.steamBuild,
      serverIniOverrides: serverIniOverrides ?? undefined,
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'server.restart',
      },
    })

    return { message: 'Game server restarting' }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to restart game server' })
  }
})
