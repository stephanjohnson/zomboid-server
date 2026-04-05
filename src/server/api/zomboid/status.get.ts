import { readServerConsoleLog, resolveServerPhase } from '../../utils/server-logs'

export default defineEventHandler(async () => {
  const containerStatus = await getContainerStatus()
  const rconConnected = containerStatus.running ? await isServerRunning() : false
  let phase: { state: string, label: string, detail?: string, progress?: number }

  if (!containerStatus.exists) {
    phase = { state: 'not_created', label: 'Not Created' }
  }
  else if (!containerStatus.running) {
    phase = { state: 'stopped', label: 'Stopped' }
  }
  else if (rconConnected) {
    phase = { state: 'ready', label: 'Online' }
  }
  else {
    const [containerLogs, serverConsole] = await Promise.all([
      getContainerLogs(2000),
      Promise.resolve(readServerConsoleLog()),
    ])

    phase = resolveServerPhase(containerLogs, serverConsole)
  }

  return {
    container: containerStatus,
    rcon: rconConnected,
    phase,
    activeProfile: await prisma.serverProfile.findFirst({ where: { isActive: true } }),
  }
})
