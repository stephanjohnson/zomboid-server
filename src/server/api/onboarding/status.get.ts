/**
 * Check if the application bootstrap data exists.
 * Public endpoint — no auth required.
 */
export default defineEventHandler(async () => {
  return getSetupStatus()
})
