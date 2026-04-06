import * as v from 'valibot'

import { buildEnrichedCatalogItem } from '../../../../utils/item-enrichment'
import { analyzeMultiImport } from '../../../../utils/item-import-analyzer'
import { getGameCatalogItem, getGameItemCatalog } from '../../../../utils/item-catalog'

const BodySchema = v.object({
  profileId: v.optional(v.string()),
  fullTypes: v.pipe(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))), v.minLength(1), v.maxLength(50)),
})

export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)

  const { profileId, fullTypes } = await readValidatedBody(event, v.parser(BodySchema))
  const profile = await resolveStoreProfile(profileId)

  const items = await Promise.all(
    fullTypes.map(async (fullType) => {
      const item = await getGameCatalogItem(profile.id, fullType)
      if (!item) return null
      return item
    }),
  )

  const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null)

  if (validItems.length === 0) {
    throw createError({ statusCode: 404, message: 'None of the selected catalog items were found' })
  }

  const enrichments = await Promise.all(
    validItems.map(item => buildEnrichedCatalogItem(item)),
  )

  const { items: allCatalogItems } = await getGameItemCatalog(profile.id)
  const analysis = analyzeMultiImport(validItems, allCatalogItems)

  return {
    profile: { id: profile.id, name: profile.name },
    enrichments,
    analysis,
  }
})
