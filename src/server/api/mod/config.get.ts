import * as v from 'valibot'

import { buildCompiledModConfig } from '../../utils/telemetry-config'

const QuerySchema = v.object({
  serverName: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { serverName } = await getValidatedQuery(event, v.parser(QuerySchema))

  const profile = serverName
    ? await prisma.serverProfile.findFirst({
        where: {
          OR: [
            { servername: serverName },
            { name: serverName },
          ],
        },
      })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for mod config' })
  }

  const listeners = await prisma.telemetryListener.findMany({
    where: { profileId: profile.id },
    orderBy: { adapterKey: 'asc' },
  })

  return {
    profileId: profile.id,
    serverName: profile.servername,
    ...buildCompiledModConfig(listeners),
  }
})