import * as v from 'valibot'

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

  const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })
  const name = body.servername || profile?.servername || 'servertest'

  try {
    let existing: Record<string, unknown> = {}
    try {
      existing = readSandboxVars(name)
    }
    catch {
      // File doesn't exist yet
    }

    const merged = { ...existing, ...body.vars }
    writeSandboxVars(name, merged)

    if (profile) {
      await prisma.serverProfile.update({
        where: { id: profile.id },
        data: { sandboxVarsOverrides: body.vars as Record<string, unknown> },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'config.sandbox_vars.update',
        details: { servername: name, keys: Object.keys(body.vars) },
      },
    })

    return { message: 'SandboxVars.lua updated', servername: name }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to update SandboxVars.lua' })
  }
})
