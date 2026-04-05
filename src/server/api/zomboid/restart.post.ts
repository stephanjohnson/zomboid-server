import * as v from 'valibot'

import { getProfileSandboxVarsOverrides, getProfileServerIniOverrides } from '../../utils/profile-runtime-config'

const RestartSchema = v.object({
  profileId: v.optional(v.string()),
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
    const config = useRuntimeConfig()
    try {
      await sendRconCommand('servermsg "Server restarting..."')
      await sendRconCommand('save')
    }
    catch {
      // RCON may not be available
    }

    const profile = body.profileId
      ? await prisma.serverProfile.findUnique({ where: { id: body.profileId } })
      : await prisma.serverProfile.findFirst({ where: { isActive: true } })

    if (!profile) {
      throw createError({ statusCode: 409, message: 'No server profile found to restart' })
    }

    await reconcileGameContainer({
      servername: profile.servername,
      gamePort: profile.gamePort,
      directPort: profile.directPort,
      rconPort: profile.rconPort,
      rconPassword: profile.rconPassword || config.pzRconPassword,
      steamBuild: profile.steamBuild,
      mapName: profile.mapName,
      maxPlayers: profile.maxPlayers,
      pvp: profile.pvp,
      serverIniOverrides: getProfileServerIniOverrides(profile),
      sandboxVarsOverrides: getProfileSandboxVarsOverrides(profile),
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
