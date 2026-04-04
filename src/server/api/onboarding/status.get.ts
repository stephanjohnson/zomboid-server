/**
 * Check if the app has been set up (has at least one admin user and profile).
 * Public endpoint — no auth required.
 */
export default defineEventHandler(async () => {
  return getSetupStatus()
})
