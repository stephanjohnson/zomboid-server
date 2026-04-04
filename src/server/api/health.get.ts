export default defineEventHandler(async () => {
  const containerStatus = await getContainerStatus()
  const serverRunning = containerStatus.running ? await isServerRunning() : false

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    gameServer: {
      container: containerStatus,
      rcon: serverRunning,
    },
  }
})
