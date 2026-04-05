import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { PrismaClient } from '@prisma/client'
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

export async function handleBackupJob(
  payload: Record<string, unknown>,
  prisma: PrismaClient,
): Promise<void> {
  const { profileId, profileName, servername } = payload as {
    jobId: string
    profileId: string
    profileName: string
    servername: string
  }

  const backupPath = process.env.BACKUP_PATH || '/backups'
  const pzDataPath = process.env.PZ_DATA_PATH || '/pzm-data'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${servername}_${timestamp}.tar.gz`
  const filePath = join(backupPath, fileName)

  // Ensure backup directory exists
  if (!existsSync(backupPath)) {
    mkdirSync(backupPath, { recursive: true })
  }

  logger.info({ profileName, fileName }, 'Creating backup...')

  // Save the game first via RCON (best effort)
  try {
    const { Rcon } = await import('rcon-client')
    const rcon = await Rcon.connect({
      host: process.env.PZ_RCON_HOST || 'game-server',
      port: Number(process.env.PZ_RCON_PORT) || 27015,
      password: process.env.PZ_RCON_PASSWORD || '',
    })
    await rcon.send('save')
    rcon.end()
    // Wait for save to complete
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  catch {
    logger.warn('Could not send RCON save command — proceeding with backup anyway')
  }

  // Create tar.gz of the server data
  const sourceDir = join(pzDataPath, 'Saves')
  const serverDir = join(pzDataPath, 'Server')

  execSync(`tar -czf "${filePath}" -C "${pzDataPath}" Saves Server`, {
    timeout: 300000,
  })

  const stats = statSync(filePath)

  // Record backup in database
  await prisma.backup.create({
    data: {
      profileId,
      fileName,
      filePath,
      sizeBytes: BigInt(stats.size),
    },
  })

  logger.info({ fileName, size: stats.size }, 'Backup created successfully')
}
