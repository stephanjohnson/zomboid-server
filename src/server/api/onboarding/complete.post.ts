import * as v from 'valibot'

import { steamBuildValues } from '../../../shared/game-build'

const OnboardingSchema = v.object({
  admin: v.object({
    username: v.pipe(v.string(), v.trim(), v.minLength(3)),
    password: v.pipe(v.string(), v.minLength(8)),
  }),
  server: v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1)),
    build: v.optional(v.picklist(steamBuildValues), 'public'),
  }),
})

export default defineEventHandler(async (event) => {
  const existingStatus = await getSetupStatus()

  if (existingStatus.isComplete) {
    throw createError({ statusCode: 400, message: 'Onboarding has already been completed' })
  }

  if (existingStatus.hasAdmin || existingStatus.hasProfile) {
    throw createError({
      statusCode: 409,
      message: 'Onboarding cannot continue because the database is partially initialized.',
    })
  }

  const body = await readValidatedBody(event, v.parser(OnboardingSchema))

  const { user } = await seedInitialSetup({
    serverName: body.server.name,
    steamBuild: body.server.build,
    adminUsername: body.admin.username,
    adminPassword: body.admin.password,
  })

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    loggedInAt: Date.now(),
  })

  setResponseStatus(event, 201)
  return {
    message: 'Onboarding complete',
    build: body.server.build,
  }
})
