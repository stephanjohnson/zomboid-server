export function useAuth() {
  const { loggedIn, user, clear, fetch: fetchSession } = useUserSession()

  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isModerator = computed(() => user.value?.role === 'MODERATOR' || isAdmin.value)

  async function login(username: string, password: string) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    await fetchSession()
  }

  async function logout() {
    await clear()
    await navigateTo('/login')
  }

  return {
    user,
    isLoggedIn: loggedIn,
    isAdmin,
    isModerator,
    fetchUser: fetchSession,
    login,
    logout,
  }
}
