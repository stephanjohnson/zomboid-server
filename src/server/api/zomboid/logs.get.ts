import * as v from 'valibot'

const QuerySchema = v.object({
  tail: v.optional(v.pipe(v.string(), v.transform(Number)), '100'),
})

export default defineEventHandler(async (event) => {
  const { tail } = await getValidatedQuery(event, v.parser(QuerySchema))
  const logs = await getContainerLogs(tail)
  return { logs }
})
