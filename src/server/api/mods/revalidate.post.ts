import * as v from 'valibot'

const RevalidateAllModsSchema = v.object({
  profileId: v.string(),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(RevalidateAllModsSchema))
  const profile = await prisma.serverProfile.findUnique({ where: { id: body.profileId } })
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Server profile not found' })
  }

  const revalidatedAt = new Date()
  const result = await prisma.mod.updateMany({
    where: { profileId: body.profileId },
    data: { updatedAt: revalidatedAt },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'mod.revalidate_all',
      details: {
        profileId: body.profileId,
        count: result.count,
        revalidatedAt,
      },
    },
  })

  return {
    message: 'Mod verification restarted',
    count: result.count,
    revalidatedAt,
  }
})