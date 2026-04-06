import * as v from 'valibot'
import { verifyPassword } from '../../lib/password'

const LoginSchema = v.object({
  username: v.pipe(v.string(), v.minLength(1)),
  password: v.pipe(v.string(), v.minLength(1)),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, v.parser(LoginSchema))

  const user = await prisma.user.findUnique({
    where: { username: body.username },
  })

  if (!user || !user.isActive) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const valid = await verifyPassword(user.passwordHash, body.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    loggedInAt: Date.now(),
  })

  return setResponseStatus(event, 201)
})
