import * as v from 'valibot'

import { normalizeSandboxEditorSettings } from '../../utils/config-editor'
import { getProfileSandboxVarsOverrides } from '../../utils/profile-runtime-config'

const UpdateSandboxSchema = v.object({
  profileId: v.optional(v.string()),
  servername: v.optional(v.string()),
  vars: v.record(v.string(), v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(UpdateSandboxSchema))
  const profile = body.profileId
    ? await prisma.serverProfile.findUnique({ where: { id: body.profileId } })
    : body.servername
      ? await prisma.serverProfile.findFirst({ where: { servername: body.servername } })
      : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for sandbox config' })
  }

  let normalizedVars

  try {
    normalizedVars = normalizeSandboxEditorSettings(body.vars as Record<string, string>, getProfileSandboxVarsOverrides(profile))
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Invalid sandbox values',
    })
  }

  await prisma.serverProfile.update({
    where: { id: profile.id },
    data: {
      sandboxVarsOverrides: Object.keys(normalizedVars).length > 0
        ? normalizedVars
        : null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.sub,
      action: 'config.sandbox_vars.update',
      details: { servername: profile.servername, keys: Object.keys(body.vars) },
    },
  })

  return { message: 'SandboxVars config saved', servername: profile.servername }
})
