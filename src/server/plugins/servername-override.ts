import { prisma } from '../utils/db'
import { writeActiveServernameOverride } from '../utils/servername-override'

export default defineNitroPlugin(async () => {
  const activeProfile = await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (activeProfile) {
    await writeActiveServernameOverride(activeProfile.servername)
  }
})
