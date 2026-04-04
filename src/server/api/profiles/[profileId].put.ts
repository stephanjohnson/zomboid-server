import * as v from 'valibot'

import { steamBuildValues } from '../../../shared/game-build'

const UpdateProfileSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1))),
  servername: v.optional(v.string()),
  steamBuild: v.optional(v.picklist(steamBuildValues)),
  gamePort: v.optional(v.pipe(v.number(), v.minValue(1024), v.maxValue(65535))),
  directPort: v.optional(v.pipe(v.number(), v.minValue(1024), v.maxValue(65535))),
  rconPort: v.optional(v.pipe(v.number(), v.minValue(1024), v.maxValue(65535))),
  mapName: v.optional(v.string()),
  maxPlayers: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(128))),
  pvp: v.optional(v.boolean()),
  difficulty: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const profileId = getRouterParam(event, 'profileId')
  if (!profileId) {
    throw createError({ statusCode: 400, message: 'Profile ID required' })
  }

  const body = await readValidatedBody(event, v.parser(UpdateProfileSchema))

  // If activating this profile, deactivate all others
  if (body.isActive) {
    await prisma.serverProfile.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })
  }

  const profile = await prisma.serverProfile.update({
    where: { id: profileId },
    data: body,
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'profile.update',
      target: profile.id,
      details: body as Record<string, unknown>,
    },
  })

  return profile
})
