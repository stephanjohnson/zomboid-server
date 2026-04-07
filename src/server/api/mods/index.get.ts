import { fetchWorkshopItemSummaries } from '../../utils/workshop'

import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { profileId } = await getValidatedQuery(event, v.parser(QuerySchema))

  const where = profileId ? { profileId } : {}
  const mods = await prisma.mod.findMany({
    where,
    orderBy: { order: 'asc' },
  })

  const missingPreviewMods = mods.filter(mod => !mod.previewUrl)

  if (!missingPreviewMods.length) {
    return mods
  }

  try {
    const summaries = await fetchWorkshopItemSummaries(missingPreviewMods.map(mod => mod.workshopId))
    const previewUpdates = missingPreviewMods.flatMap((mod) => {
      const previewUrl = summaries.get(mod.workshopId)?.previewUrl ?? null
      if (!previewUrl) {
        return []
      }

      return prisma.mod.update({
        where: { id: mod.id },
        data: { previewUrl },
      })
    })

    if (previewUpdates.length) {
      await prisma.$transaction(previewUpdates)
    }

    return mods.map(mod => ({
      ...mod,
      previewUrl: summaries.get(mod.workshopId)?.previewUrl ?? mod.previewUrl,
    }))
  }
  catch {
    return mods
  }
})
