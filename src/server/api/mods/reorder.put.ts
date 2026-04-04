import * as v from 'valibot'

const ReorderSchema = v.object({
  profileId: v.string(),
  modIds: v.array(v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(ReorderSchema))

  // Update order for each mod
  await prisma.$transaction(
    body.modIds.map((modId, index) =>
      prisma.mod.update({
        where: { id: modId },
        data: { order: index },
      }),
    ),
  )

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'mod.reorder',
      details: { profileId: body.profileId },
    },
  })

  return { message: 'Mods reordered' }
})
