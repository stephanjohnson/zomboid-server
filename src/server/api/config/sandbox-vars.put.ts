import * as v from 'valibot'

import { getProfileSandboxVarsOverrides } from '../../utils/profile-runtime-config'

const UpdateSandboxSchema = v.object({
  servername: v.optional(v.string()),
  vars: v.record(v.string(), v.unknown()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(UpdateSandboxSchema))
  const profile = body.servername
    ? await prisma.serverProfile.findFirst({ where: { servername: body.servername } })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for sandbox config' })
  }

  const merged = {
    ...getProfileSandboxVarsOverrides(profile),
    ...body.vars,
  }

  await prisma.serverProfile.update({
    where: { id: profile.id },
    data: { sandboxVarsOverrides: merged },
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
