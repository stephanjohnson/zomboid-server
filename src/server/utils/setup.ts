import { Prisma, UserRole } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { execFile } from 'node:child_process'
import { constants } from 'node:fs'
import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { hashPassword } from './auth'
import { prisma } from './db'

const execFileAsync = promisify(execFile)

export interface SetupStatus {
  databaseReachable: boolean
  schemaReady: boolean
  hasAdmin: boolean
  hasProfile: boolean
  isComplete: boolean
}

interface SeedInitialSetupInput {
  serverName: string
  adminUsername: string
  adminPassword: string
  adminEmail?: string
  mapName?: string
  maxPlayers?: number
  pvp?: boolean
}

function isMissingSchemaError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021'
}

function isDatabaseUnavailableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true
  }

  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001'
}

async function hasMigrations(): Promise<boolean> {
  const migrationsPath = join(process.cwd(), 'prisma', 'migrations')

  try {
    await access(migrationsPath, constants.R_OK)
    const entries = await readdir(migrationsPath, { withFileTypes: true })
    return entries.some(entry => entry.isDirectory())
  }
  catch {
    return false
  }
}

function getPrismaBinaryPath(): string {
  return join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
  )
}

function getLocalAdminEmail(username: string): string {
  return `${username.toLowerCase()}@local.invalid`
}

export function toServerSlug(serverName: string): string {
  const slug = serverName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'servertest'
}

export async function applyDatabaseSchema(): Promise<'migrate' | 'db-push'> {
  const mode = await hasMigrations() ? 'migrate' : 'db-push'
  const args = mode === 'migrate'
    ? ['migrate', 'deploy']
    : ['db', 'push', '--skip-generate']

  try {
    await execFileAsync(getPrismaBinaryPath(), args, {
      cwd: process.cwd(),
      env: process.env,
    })
  }
  catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown Prisma error'
    throw new Error(`Unable to initialize the database schema: ${details}`)
  }

  return mode
}

export async function getSetupStatus(client: PrismaClient = prisma): Promise<SetupStatus> {
  try {
    const [adminCount, profileCount] = await client.$transaction([
      client.user.count({ where: { role: UserRole.ADMIN } }),
      client.serverProfile.count(),
    ])

    return {
      databaseReachable: true,
      schemaReady: true,
      hasAdmin: adminCount > 0,
      hasProfile: profileCount > 0,
      isComplete: adminCount > 0 && profileCount > 0,
    }
  }
  catch (error) {
    if (isMissingSchemaError(error)) {
      return {
        databaseReachable: true,
        schemaReady: false,
        hasAdmin: false,
        hasProfile: false,
        isComplete: false,
      }
    }

    if (isDatabaseUnavailableError(error)) {
      return {
        databaseReachable: false,
        schemaReady: false,
        hasAdmin: false,
        hasProfile: false,
        isComplete: false,
      }
    }

    throw error
  }
}

export async function seedInitialSetup(
  input: SeedInitialSetupInput,
  client: PrismaClient = prisma,
) {
  const adminUsername = input.adminUsername.trim()
  const serverName = input.serverName.trim()
  const adminEmail = input.adminEmail?.trim() || getLocalAdminEmail(adminUsername)
  const passwordHash = await hashPassword(input.adminPassword)

  return client.$transaction(async (transaction) => {
    await transaction.serverProfile.updateMany({
      data: { isActive: false },
    })

    const user = await transaction.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
      },
    })

    const profile = await transaction.serverProfile.create({
      data: {
        name: serverName,
        isActive: true,
        servername: toServerSlug(serverName),
        mapName: input.mapName || 'Muldraugh, KY',
        maxPlayers: input.maxPlayers ?? 16,
        pvp: input.pvp ?? true,
      },
    })

    return { user, profile }
  })
}