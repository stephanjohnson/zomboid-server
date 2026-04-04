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
 * Auth middleware: reads nuxt-auth-utils session and populates event.context.user.
 * Skips auth for public routes.
 */
export default defineEventHandler(async (event) => {
  const path = event.path

  // Public routes that don't require auth
  const publicPaths = ['/api/auth/login', '/api/health', '/api/onboarding/status']
  if (publicPaths.some(p => path.startsWith(p))) return

  // Only protect /api/ routes (skip the internal session endpoint)
  if (!path.startsWith('/api/') || path.startsWith('/api/_auth/')) return

  const session = await getUserSession(event)

  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  // Populate event.context.user for backward compatibility with existing API routes
  event.context.user = {
    sub: session.user.id,
    username: session.user.username,
    role: session.user.role,
  }
})
