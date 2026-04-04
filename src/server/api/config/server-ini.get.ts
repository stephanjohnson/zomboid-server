import * as v from 'valibot'

const QuerySchema = v.object({
  servername: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { servername } = await getValidatedQuery(event, v.parser(QuerySchema))

  const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })
  const name = servername || profile?.servername || 'servertest'

  try {
    const settings = readServerIni(name)
    return { servername: name, settings }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to read server.ini' })
  }
})
