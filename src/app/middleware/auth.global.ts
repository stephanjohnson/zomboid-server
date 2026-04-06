export default defineNuxtRouteMiddleware(async (to) => {
  // The loading page handles its own bootstrapping — never intercept it
  if (to.path === '/loading') return

  const { status } = useOnboardingStatus()

  // Status not yet fetched — send to a page that renders instantly,
  // fetches onboarding state after paint, then redirects.
  if (!status.value) {
    return navigateTo('/loading')
  }

  if (!status.value.isComplete) {
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
