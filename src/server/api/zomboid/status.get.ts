export default defineEventHandler(async () => {
  const containerStatus = await getContainerStatus()
  const rconConnected = containerStatus.running ? await isServerRunning() : false

  return {
    container: containerStatus,
    rcon: rconConnected,
    activeProfile: await prisma.serverProfile.findFirst({ where: { isActive: true } }),
  }
})
