export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  // Allow public pages
  const publicPages = ['/login', '/onboarding']
  if (publicPages.includes(to.path)) return

  // Fetch user if not loaded yet
  if (!auth.user.value) {
    await auth.fetchUser()
  }

  // Redirect to login if not authenticated
  if (!auth.isLoggedIn.value) {
    return navigateTo('/login')
  }
})
