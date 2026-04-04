import * as v from 'valibot'

import { buildEnrichedCatalogItem } from '../../../../utils/item-enrichment'
import { getGameCatalogItem } from '../../../../utils/item-catalog'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
  fullType: v.pipe(v.string(), v.trim(), v.minLength(1)),
})

export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)

  const { profileId, fullType } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)
  const item = await getGameCatalogItem(profile.id, fullType)

  if (!item) {
    throw createError({ statusCode: 404, message: 'Catalog item not found' })
  }

  return {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    enrichment: await buildEnrichedCatalogItem(item),
  }
})
