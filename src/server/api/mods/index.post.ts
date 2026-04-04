import * as v from 'valibot'

const AddModSchema = v.object({
  profileId: v.string(),
  workshopId: v.pipe(v.string(), v.minLength(1)),
  modName: v.pipe(v.string(), v.minLength(1)),
  displayName: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(AddModSchema))

  // Get next order position
  const lastMod = await prisma.mod.findFirst({
    where: { profileId: body.profileId },
    orderBy: { order: 'desc' },
  })

  const mod = await prisma.mod.create({
    data: {
      profileId: body.profileId,
      workshopId: body.workshopId,
      modName: body.modName,
      displayName: body.displayName,
      order: (lastMod?.order ?? -1) + 1,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'mod.add',
      target: mod.id,
      details: { workshopId: body.workshopId, modName: body.modName },
    },
  })

  setResponseStatus(event, 201)
  return mod
})
