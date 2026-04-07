import * as v from 'valibot'

const RuntimeModReportSchema = v.object({
  serverName: v.optional(v.string()),
  reason: v.optional(v.string()),
  reportedAt: v.optional(v.string()),
  activeModIds: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))), []),
  activeWorkshopIds: v.optional(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))), []),
})

function parseReportedAt(value?: string): Date {
  if (!value) {
    return new Date()
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }

  return parsed
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))]
}

function getModRuntimeReportDelegate() {
  const delegate = (prisma as Record<string, unknown>).modRuntimeReport

  if (!delegate || typeof delegate !== 'object' || !('create' in delegate) || typeof delegate.create !== 'function') {
    return null
  }

  return delegate as {
    create: (args: {
      data: {
        profileId: string
        serverName: string
        reason: string | null
        reportedAt: Date
        activeModIds: string[]
        activeWorkshopIds: string[]
      }
    }) => Promise<{ id: string }>
  }
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, v.parser(RuntimeModReportSchema))
  const modRuntimeReport = getModRuntimeReportDelegate()

  if (!modRuntimeReport) {
    throw createError({
      statusCode: 503,
      message: 'Mod runtime reporting is temporarily unavailable while Prisma regenerates the new client model',
    })
  }

  const profile = body.serverName
    ? await prisma.serverProfile.findFirst({
        where: {
          OR: [
            { servername: body.serverName },
            { name: body.serverName },
          ],
        },
      })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for mod runtime report' })
  }

  const activeModIds = uniqueStrings(body.activeModIds ?? [])
  const activeWorkshopIds = uniqueStrings(body.activeWorkshopIds ?? [])

  const report = await modRuntimeReport.create({
    data: {
      profileId: profile.id,
      serverName: profile.servername,
      reason: body.reason?.trim() || null,
      reportedAt: parseReportedAt(body.reportedAt),
      activeModIds,
      activeWorkshopIds,
    },
  })

  return {
    ok: true,
    reportId: report.id,
  }
})