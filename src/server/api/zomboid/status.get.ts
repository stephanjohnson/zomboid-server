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
    const logs = await getContainerLogs(200)
    const lines = logs.split('\n').map(line => line.trim()).filter(Boolean)

    const findLast = (pattern: RegExp) => {
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        if (pattern.test(lines[i])) {
          return lines[i]
        }
      }
      return null
    }

    let resolved = false

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i]

      if (/FATAL:/i.test(line)) {
        phase = { state: 'error', label: 'Error', detail: line.replace(/^\[.*?\]\s*/, '') }
        resolved = true
        break
      }

      if (/start-server\.sh|ProjectZomboid64/i.test(line)) {
        phase = { state: 'starting', label: 'Starting', detail: 'Launching server process' }
        resolved = true
        break
      }

      if (/Success! App '380870' fully installed\./i.test(line)) {
        phase = { state: 'starting', label: 'Starting', detail: 'Server files installed, launching' }
        resolved = true
        break
      }

      if (/Update state/i.test(line)) {
        let detail = 'Updating server files'
        let progress: number | undefined
        const progressMatch = line.match(/progress:\s*([0-9.]+)/i)
        if (progressMatch) {
          progress = Number(progressMatch[1])
        }

        if (/preallocating/i.test(line)) detail = 'Preallocating server files'
        else if (/downloading/i.test(line)) detail = 'Downloading server files'
        else if (/verifying/i.test(line)) detail = 'Verifying server files'
        else if (/committing/i.test(line)) detail = 'Finalizing update'

        phase = { state: 'updating', label: 'Updating', detail, progress }
        resolved = true
        break
      }

      if (/Installing\/updating PZ server/i.test(line)) {
        phase = { state: 'updating', label: 'Updating', detail: 'Installing server files' }
        resolved = true
        break
      }

      if (/Waiting for response from Steam servers/i.test(line)) {
        phase = { state: 'updating', label: 'Updating', detail: 'Contacting Steam servers' }
        resolved = true
        break
      }

      if (/Workshop: .*Download/i.test(line)) {
        phase = { state: 'initializing', label: 'Initializing', detail: 'Downloading Workshop content' }
        resolved = true
        break
      }
    }

    if (!resolved) {
      phase = { state: 'initializing', label: 'Initializing' }
    }
  }

  return {
    container: containerStatus,
    rcon: rconConnected,
    phase,
    activeProfile: await prisma.serverProfile.findFirst({ where: { isActive: true } }),
  }
})
