import * as prismaClient from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

import { hashPassword } from './auth'
import { prisma } from './db'
import { defaultActionRules, defaultTelemetryListeners } from './telemetry-config'
import type { SteamBuild } from '../../shared/game-build'

const { TriggerSourceKind, UserRole } = prismaClient

export interface SetupStatus {
  hasAdmin: boolean
  hasProfile: boolean
  isComplete: boolean
}

interface SeedInitialSetupInput {
  serverName: string
  steamBuild?: SteamBuild
  adminUsername: string
  adminPassword: string
  adminEmail?: string
  mapName?: string
  maxPlayers?: number
  pvp?: boolean
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

export async function getSetupStatus(client: PrismaClient = prisma): Promise<SetupStatus> {
  const [adminCount, profileCount] = await client.$transaction([
    client.user.count({ where: { role: UserRole.ADMIN } }),
    client.serverProfile.count(),
  ])

  return {
    hasAdmin: adminCount > 0,
    hasProfile: profileCount > 0,
    isComplete: adminCount > 0 && profileCount > 0,
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

  const result = await client.$transaction(async (transaction) => {
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
        steamBuild: input.steamBuild ?? 'public',
        mapName: input.mapName || 'Muldraugh, KY',
        maxPlayers: input.maxPlayers ?? 16,
        pvp: input.pvp ?? true,
      },
    })

    await transaction.telemetryListener.createMany({
      data: defaultTelemetryListeners.map(listener => ({
        profileId: profile.id,
        adapterKey: listener.adapterKey,
        name: listener.name,
        eventKey: listener.eventKey,
        isEnabled: listener.isEnabled ?? true,
        config: listener.config,
      })),
    })

    await transaction.actionRule.createMany({
      data: defaultActionRules.map(rule => ({
        profileId: profile.id,
        name: rule.name,
        triggerKind: TriggerSourceKind[rule.triggerKind],
        triggerKey: rule.triggerKey,
        moneyAmount: rule.moneyAmount ?? 0,
        xpAmount: rule.xpAmount ?? 0,
        xpCategory: rule.xpCategory,
        xpCategoryAmount: rule.xpCategoryAmount ?? 0,
        config: rule.config,
      })),
    })

    return { user, profile }
  })
  return result
}
