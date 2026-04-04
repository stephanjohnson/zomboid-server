import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@prisma/client'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

interface JwtPayload {
  sub: string
  username: string
  role: UserRole
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JwtPayload
}
