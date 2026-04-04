import * as v from 'valibot'

const UpdateIniSchema = v.object({
  servername: v.optional(v.string()),
  settings: v.record(v.string(), v.string()),
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readValidatedBody(event, v.parser(UpdateIniSchema))

  const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })
  const name = body.servername || profile?.servername || 'servertest'

  try {
    // Read existing, merge, write back
    let existing: Record<string, string> = {}
    try {
      existing = readServerIni(name)
    }
    catch {
      // File doesn't exist yet, start fresh
    }

    const merged = { ...existing, ...body.settings }
    writeServerIni(name, merged)

    // Also save overrides to DB
    if (profile) {
      await prisma.serverProfile.update({
        where: { id: profile.id },
        data: { serverIniOverrides: body.settings },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.sub,
        action: 'config.server_ini.update',
        details: { servername: name, keys: Object.keys(body.settings) },
      },
    })

    return { message: 'server.ini updated', servername: name }
  }
  catch (error) {
    handleApiError(error, { message: 'Failed to update server.ini' })
  }
})
