import type { UserRole } from '@prisma/client'

declare module 'h3' {
  interface H3EventContext {
    user?: {
      sub: string
      username: string
      role: UserRole
    }
  }
}

/**
 * Auth middleware: validates JWT from Authorization header or cookie.
 * Skips auth for public routes.
 */
export default defineEventHandler(async (event) => {
  const path = event.path

  // Public routes that don't require auth
  const publicPaths = ['/api/auth/login', '/api/health', '/api/onboarding/status']
  if (publicPaths.some(p => path.startsWith(p))) return

  // Only protect /api/ routes
  if (!path.startsWith('/api/')) return

  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  try {
    const payload = await verifyJwt(token)
    event.context.user = payload
  }
  catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }
})
