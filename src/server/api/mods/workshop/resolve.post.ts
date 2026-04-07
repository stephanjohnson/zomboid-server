import * as v from 'valibot'

import { resolveWorkshopItem } from '../../../utils/workshop'

const ResolveWorkshopSchema = v.object({
  input: v.pipe(v.string(), v.minLength(1)),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(ResolveWorkshopSchema))

  try {
    return await resolveWorkshopItem(body.input)
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Failed to resolve workshop item.',
    })
  }
})