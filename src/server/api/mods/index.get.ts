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
  return mods
})
