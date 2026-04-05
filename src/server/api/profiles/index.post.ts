import * as v from 'valibot'

const CreateProfileSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  servername: v.optional(v.string()),
  gamePort: v.optional(v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)), 16261),
  directPort: v.optional(v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)), 16262),
  rconPort: v.optional(v.pipe(v.number(), v.minValue(1024), v.maxValue(65535)), 27015),
  mapName: v.optional(v.string(), 'Muldraugh, KY'),
  maxPlayers: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(128)), 16),
  pvp: v.optional(v.boolean(), true),
  difficulty: v.optional(v.string(), 'Normal'),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(CreateProfileSchema))
  const config = useRuntimeConfig()
  const activeProfile = await prisma.serverProfile.findFirst({ where: { isActive: true } })

  const profile = await prisma.serverProfile.create({
    data: {
      name: body.name,
      servername: body.servername || body.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      gamePort: body.gamePort,
      directPort: body.directPort,
      rconPort: body.rconPort,
      rconPassword: activeProfile?.rconPassword || config.pzRconPassword,
      mapName: body.mapName,
      maxPlayers: body.maxPlayers,
      pvp: body.pvp,
      difficulty: body.difficulty,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'profile.create',
      target: profile.id,
      details: { name: profile.name },
    },
  })

  setResponseStatus(event, 201)
  return profile
})
