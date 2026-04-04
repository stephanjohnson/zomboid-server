import * as v from 'valibot'

const OnboardingSchema = v.object({
  admin: v.object({
    username: v.pipe(v.string(), v.trim(), v.minLength(3)),
    password: v.pipe(v.string(), v.minLength(8)),
  }),
  server: v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1)),
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

  try {
    await applyDatabaseSchema()
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Unable to initialize the database schema',
    })
  }

  const updatedStatus = await getSetupStatus()
  if (!updatedStatus.schemaReady) {
    throw createError({ statusCode: 500, message: 'Database schema initialization did not complete' })
  }

  const { user } = await seedInitialSetup({
    serverName: body.server.name,
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
  return { message: 'Onboarding complete' }
})
