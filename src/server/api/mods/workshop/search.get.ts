import * as v from 'valibot'

import { searchWorkshopItems } from '../../../utils/workshop'

const SearchWorkshopSchema = v.object({
  q: v.pipe(v.string(), v.minLength(2)),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const { q } = await getValidatedQuery(event, v.parser(SearchWorkshopSchema))

  try {
    const results = await searchWorkshopItems(q)
    return {
      query: q,
      total: results.length,
      results,
    }
  }
  catch (error) {
    throw createError({
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Failed to search Steam Workshop.',
    })
  }
})