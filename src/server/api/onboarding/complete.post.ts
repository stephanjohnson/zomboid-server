import * as v from 'valibot'

const OnboardingSchema = v.object({
  admin: v.object({
    username: v.pipe(v.string(), v.minLength(3)),
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8)),
  }),
  profile: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    mapName: v.optional(v.string(), 'Muldraugh, KY'),
    maxPlayers: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(128)), 16),
    pvp: v.optional(v.boolean(), true),
  }),
})

export default defineEventHandler(async (event) => {
  // Prevent re-running onboarding
  const existingAdmin = await prisma.user.count({ where: { role: 'ADMIN' } })
  if (existingAdmin > 0) {
    throw createError({ statusCode: 400, message: 'Onboarding has already been completed' })
  }

  const body = await readValidatedBody(event, v.parser(OnboardingSchema))

  const passwordHash = await hashPassword(body.admin.password)

  const user = await prisma.user.create({
    data: {
      username: body.admin.username,
      email: body.admin.email,
      passwordHash,
      role: 'ADMIN',
    },
  })

  await prisma.serverProfile.create({
    data: {
      name: body.profile.name,
      isActive: true,
      servername: body.profile.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      mapName: body.profile.mapName,
      maxPlayers: body.profile.maxPlayers,
      pvp: body.profile.pvp,
    },
  })

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    loggedInAt: Date.now(),
  })

  setResponseStatus(event, 201)
  return { message: 'Onboarding complete' }
})
