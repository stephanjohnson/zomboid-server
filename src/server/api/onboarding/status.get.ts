/**
 * Check if the app has been set up (has at least one admin user and profile).
 * Public endpoint — no auth required.
 */
export default defineEventHandler(async () => {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
  const profileCount = await prisma.serverProfile.count()

  return {
    isComplete: adminCount > 0 && profileCount > 0,
    hasAdmin: adminCount > 0,
    hasProfile: profileCount > 0,
  }
})
