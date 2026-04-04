import * as v from 'valibot'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
  q: v.optional(v.string(), ''),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 25),
})

export default defineEventHandler(async (event) => {
  requireStoreAdmin(event)

  const { profileId, q, limit } = await getValidatedQuery(event, v.parser(QuerySchema))
  const profile = await resolveStoreProfile(profileId)
  const result = await searchGameItemCatalog(profile.id, q, limit)

  return {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    ...result,
  }
})
