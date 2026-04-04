export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw createError({ statusCode: 403, message: 'Admin or moderator access required' })
  }

  try {
    await startGameContainer()

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
