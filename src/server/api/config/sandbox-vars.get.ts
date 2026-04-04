import * as v from 'valibot'

import { getProfileSandboxVarsOverrides } from '../../utils/profile-runtime-config'

const QuerySchema = v.object({
  servername: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { servername } = await getValidatedQuery(event, v.parser(QuerySchema))

  const profile = servername
    ? await prisma.serverProfile.findFirst({ where: { servername } })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for sandbox config' })
  }

  return {
    servername: profile.servername,
    vars: getProfileSandboxVarsOverrides(profile),
  }
})
