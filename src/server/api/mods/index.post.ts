import * as v from 'valibot'

import { extractWorkshopId, fetchWorkshopItemSummaries, normalizeSemicolonList } from '../../utils/workshop'

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
  const workshopId = extractWorkshopId(body.workshopId)
  const modName = normalizeSemicolonList(body.modName)
  const displayName = body.displayName?.trim() || null

  if (!workshopId) {
    throw createError({ statusCode: 400, message: 'Enter a valid Steam Workshop URL or workshop ID.' })
  }

  if (!modName.length) {
    throw createError({ statusCode: 400, message: 'At least one Mod ID is required.' })
  }

  const existingMod = await prisma.mod.findFirst({
    where: {
      profileId: body.profileId,
      workshopId,
    },
  })

  if (existingMod) {
    throw createError({ statusCode: 409, message: 'That workshop item is already added to this profile.' })
  }

  // Get next order position
  const lastMod = await prisma.mod.findFirst({
    where: { profileId: body.profileId },
    orderBy: { order: 'desc' },
  })

  let previewUrl: string | null = null

  try {
    previewUrl = (await fetchWorkshopItemSummaries([workshopId])).get(workshopId)?.previewUrl ?? null
  }
  catch {
    previewUrl = null
  }

  const mod = await prisma.mod.create({
    data: {
      profileId: body.profileId,
      workshopId,
      modName,
      displayName,
      previewUrl,
      order: (lastMod?.order ?? -1) + 1,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'mod.add',
      target: mod.id,
      details: { workshopId, modName },
    },
  })

  setResponseStatus(event, 201)
  return mod
})
