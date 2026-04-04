import * as v from 'valibot'

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

  const valid = await verifyPassword(body.password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const token = await signJwt({
    sub: user.id,
    username: user.username,
    role: user.role,
  })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  }
})
