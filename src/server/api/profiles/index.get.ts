export default defineEventHandler(async () => {
  const profiles = await prisma.serverProfile.findMany({
    include: {
      _count: { select: { mods: true, backups: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return profiles
})
