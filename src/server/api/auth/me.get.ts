export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      steamId: true,
      createdAt: true,
    },
  })

  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return dbUser
})
