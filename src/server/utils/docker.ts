import Dockerode from 'dockerode'

let docker: Dockerode | null = null

export function getDockerClient(): Dockerode {
  if (!docker) {
    const config = useRuntimeConfig()
    const url = new URL(config.dockerProxyUrl)
    docker = new Dockerode({
      host: url.hostname,
      port: Number(url.port),
      protocol: url.protocol === 'https:' ? 'https' : 'http',
    })
  }
  return docker
}

export function getGameContainer(): Dockerode.Container {
  const config = useRuntimeConfig()
  const client = getDockerClient()
  return client.getContainer(config.gameServerContainerName)
}

export async function getContainerStatus(): Promise<{
  running: boolean
  status: string
  startedAt: string | null
}> {
  try {
    const container = getGameContainer()
    const info = await container.inspect()
    return {
      running: info.State.Running,
      status: info.State.Status,
      startedAt: info.State.StartedAt || null,
    }
  }
  catch {
    return {
      running: false,
      status: 'not_found',
      startedAt: null,
    }
  }
}

export async function startGameContainer(): Promise<void> {
  const container = getGameContainer()
  await container.start()
}

export async function stopGameContainer(): Promise<void> {
  const container = getGameContainer()
  await container.stop({ t: 30 })
}

export async function restartGameContainer(): Promise<void> {
  const container = getGameContainer()
  await container.restart({ t: 30 })
}

export async function getContainerLogs(tail: number = 100): Promise<string> {
  const container = getGameContainer()
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
  })
  return logs.toString()
}
