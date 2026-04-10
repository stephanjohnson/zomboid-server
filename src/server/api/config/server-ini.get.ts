import * as v from 'valibot'

import { buildServerIniEditorSettings } from '../../utils/config-editor'

const QuerySchema = v.object({
  profileId: v.optional(v.string()),
  servername: v.optional(v.string()),
})

export default defineEventHandler(async (event) => {
  const { profileId, servername } = await getValidatedQuery(event, v.parser(QuerySchema))

  const profile = profileId
    ? await prisma.serverProfile.findUnique({ where: { id: profileId }, include: { mods: true } })
    : servername
      ? await prisma.serverProfile.findFirst({ where: { servername }, include: { mods: true } })
      : await prisma.serverProfile.findFirst({ where: { isActive: true }, include: { mods: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for server.ini config' })
  }

  return {
    servername: profile.servername,
    settings: buildServerIniEditorSettings(profile),
  }
})
