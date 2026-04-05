import { Rcon } from 'rcon-client'
import { prisma } from './db'

let rconClient: Rcon | null = null

export async function getRconClient(): Promise<Rcon> {
  const config = useRuntimeConfig()
  const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })
  const password = profile?.rconPassword || config.pzRconPassword

  if (rconClient?.authenticated) {
    return rconClient
  }

  rconClient = await Rcon.connect({
    host: config.pzRconHost,
    port: config.pzRconPort,
    password,
    timeout: 5000,
  })

  rconClient.on('error', () => {
    rconClient = null
  })

  rconClient.on('end', () => {
    rconClient = null
  })

  return rconClient
}

export async function sendRconCommand(command: string): Promise<string> {
  const client = await getRconClient()
  return client.send(command)
}

export async function isServerRunning(): Promise<boolean> {
  try {
    const client = await getRconClient()
    await client.send('players')
    return true
  }
  catch {
    return false
  }
}

export async function disconnectRcon(): Promise<void> {
  if (rconClient) {
    rconClient.end()
    rconClient = null
  }
}
