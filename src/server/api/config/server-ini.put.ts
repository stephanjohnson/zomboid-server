import * as v from 'valibot'

import { splitServerIniEditorSettings } from '../../utils/config-editor'

const UpdateIniSchema = v.object({
  profileId: v.optional(v.string()),
  servername: v.optional(v.string()),
  settings: v.record(v.string(), v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(UpdateIniSchema))
  const profile = body.profileId
    ? await prisma.serverProfile.findUnique({ where: { id: body.profileId } })
    : body.servername
      ? await prisma.serverProfile.findFirst({ where: { servername: body.servername } })
      : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for server.ini config' })
  }

  let splitSettings

  try {
    splitSettings = splitServerIniEditorSettings(body.settings)
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Invalid server.ini values',
    })
  }

  await prisma.serverProfile.update({
    where: { id: profile.id },
    data: {
      ...splitSettings.profileData,
      serverIniOverrides: Object.keys(splitSettings.overrideSettings).length > 0
        ? splitSettings.overrideSettings
        : null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'config.server_ini.update',
      details: {
        servername: profile.servername,
        keys: Object.keys(body.settings),
        profileKeys: Object.keys(splitSettings.profileData),
        overrideKeys: Object.keys(splitSettings.overrideSettings),
      },
    },
  })

  return { message: 'server.ini config saved', servername: profile.servername }
})
