import type { UserRole } from '@prisma/client'

declare module '#auth-utils' {
  interface User {
    id: string
    username: string
    email: string
    role: UserRole
    steamId?: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
