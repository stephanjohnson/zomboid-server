import { PrismaClient, UserRole } from '@prisma/client'

import { hashPassword } from '../server/utils/auth'
import { toServerSlug } from '../server/utils/setup'

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@localhost'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  const serverName = process.env.SERVER_NAME || 'Default'

  const passwordHash = await hashPassword(adminPassword)

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    },
  })

  console.log(`Admin user "${adminUsername}" seeded.`)

  // Create default server profile
  await prisma.serverProfile.upsert({
    where: { name: serverName },
    update: {},
    create: {
      name: serverName,
      isActive: true,
      servername: toServerSlug(serverName),
      gamePort: 16261,
      directPort: 16262,
      rconPort: 27015,
      mapName: 'Muldraugh, KY',
      maxPlayers: 16,
      pvp: true,
      difficulty: 'Normal',
    },
  })

  console.log(`Server profile "${serverName}" seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
