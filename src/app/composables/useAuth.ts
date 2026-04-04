interface User {
  id: string
  username: string
  email: string
  role: string
  steamId?: string
}

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isModerator = computed(() => user.value?.role === 'MODERATOR' || isAdmin.value)

  async function fetchUser() {
    try {
      const data = await $fetch<User>('/api/auth/me')
      user.value = data
    }
    catch {
      user.value = null
    }
  }

  async function login(username: string, password: string) {
    const data = await $fetch<{ token: string, user: User }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    user.value = data.user
    return data
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    isModerator,
    fetchUser,
    login,
    logout,
  }
}
