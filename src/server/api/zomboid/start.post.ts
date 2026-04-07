import * as v from 'valibot'

import { getProfileSandboxVarsOverrides, getProfileServerIniOverrides } from '../../utils/profile-runtime-config'

const StartSchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  try {
    const body = await readValidatedBody(event, v.parser(StartSchema))
    const config = useRuntimeConfig()

    const profile = body.profileId
      ? await prisma.serverProfile.findUnique({
          where: { id: body.profileId },
          include: { mods: { where: { isEnabled: true }, orderBy: { order: 'asc' } } },
        })
      : await prisma.serverProfile.findFirst({
          where: { isActive: true },
          include: { mods: { where: { isEnabled: true }, orderBy: { order: 'asc' } } },
        })

    if (!profile) {
      throw createError({ statusCode: 409, message: 'No server profile found to start' })
    }

    await startGameContainer({
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
      mods: profile.mods,
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'server.start',
      },
    })

    return { message: 'Game server starting' }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to start game server' })
  }
})
