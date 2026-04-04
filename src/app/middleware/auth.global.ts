export default defineNuxtRouteMiddleware(async (to) => {
  const { status, fetchStatus } = useOnboardingStatus()
  const setupStatus = status.value || await fetchStatus()

  if (!setupStatus.isComplete) {
    if (to.path !== '/onboarding') {
      return navigateTo('/onboarding')
    }

    return
  }

  if (to.path === '/onboarding') {
    return navigateTo('/login')
  }

  const { loggedIn, fetch: fetchSession } = useUserSession()

  // Allow public pages
  const publicPages = ['/login']
  if (publicPages.includes(to.path)) return

  // Fetch session if not loaded yet
  if (!loggedIn.value) {
    await fetchSession()
  }

  // Redirect to login if not authenticated
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
