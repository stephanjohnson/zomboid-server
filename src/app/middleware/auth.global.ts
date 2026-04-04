export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch: fetchSession } = useUserSession()

  // Allow public pages
  const publicPages = ['/login', '/onboarding']
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
