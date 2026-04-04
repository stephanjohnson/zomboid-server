export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  try {
    const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })

    if (!profile) {
      throw createError({ statusCode: 409, message: 'No active server profile available to start' })
    }

    await startGameContainer({
      servername: profile.servername,
      gamePort: profile.gamePort,
      directPort: profile.directPort,
      rconPort: profile.rconPort,
      steamBuild: profile.steamBuild,
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
