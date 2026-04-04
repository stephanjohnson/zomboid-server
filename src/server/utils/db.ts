import * as prismaClient from '@prisma/client'
import type { PrismaClient as PrismaClientType } from '@prisma/client'

const { PrismaClient } = prismaClient

let prisma: PrismaClientType

function getDatabaseUrl() {
  return process.env.DATABASE_URL
    || process.env.NUXT_DATABASE_URL
    || 'postgresql://zomboid:zomboid@localhost:5432/zomboid'
}

function createPrismaClient() {
  const databaseUrl = getDatabaseUrl()
  process.env.DATABASE_URL = databaseUrl

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient()
}
else {
  // Reuse client in development to avoid exhausting connections
  if (!globalThis.__prisma) {
    globalThis.__prisma = createPrismaClient()
  }
  prisma = globalThis.__prisma
}

export { prisma }
