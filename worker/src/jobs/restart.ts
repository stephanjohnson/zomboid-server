import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import { Rcon } from 'rcon-client'
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

export async function handleRestartJob(
  payload: Record<string, unknown>,
  _prisma: PrismaClient,
): Promise<void> {
  const { countdown = 0 } = payload as { countdown: number, requestedBy: string }

  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pz-game-server'
  const proxyUrl = process.env.DOCKER_PROXY_URL || 'http://docker-socket-proxy:2375'

  // Send countdown warnings via RCON
  if (countdown > 0) {
    try {
      const rcon = await Rcon.connect({
        host: process.env.PZ_RCON_HOST || 'game-server',
        port: Number(process.env.PZ_RCON_PORT) || 27015,
        password: process.env.PZ_RCON_PASSWORD || '',
      })

      const intervals = [300, 120, 60, 30, 10, 5]
      let remaining = countdown

      for (const interval of intervals) {
        if (remaining > interval) {
          await new Promise(resolve => setTimeout(resolve, (remaining - interval) * 1000))
          remaining = interval
          await rcon.send(`servermsg "Server restarting in ${interval} seconds"`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, remaining * 1000))
      await rcon.send('servermsg "Server restarting NOW"')
      await rcon.send('save')
      rcon.end()

      // Wait for save
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    catch {
      logger.warn('Could not send RCON warnings')
    }
  }

  // Restart container
  const url = new URL(proxyUrl)
  const docker = new Dockerode({
    host: url.hostname,
    port: Number(url.port),
    protocol: url.protocol === 'https:' ? 'https' : 'http',
  })

  const container = docker.getContainer(containerName)
  await container.restart({ t: 30 })

  logger.info('Server restarted')
}
