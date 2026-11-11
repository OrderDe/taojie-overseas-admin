// Login state: session token + the signed-in user's role permissions.
// The token is the backend session issued by POST /api/admin/login
// (the break-glass ADMIN_TOKEN also works as a root login credential on
// the backend, but the UI always goes through username + password).
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem('tj_admin_token') || '')
  const user = ref(null)
  try {
    user.value = JSON.parse(sessionStorage.getItem('tj_admin_user') || 'null')
  } catch { user.value = null }

  const loggedIn = computed(() => !!token.value && !!user.value)
  const can = (perm) =>
    !!user.value &&
    (user.value.permissions.includes('*') || user.value.permissions.includes(perm))

  async function login(username, password) {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    token.value = data.token
    user.value = data.user
    sessionStorage.setItem('tj_admin_token', data.token)
    sessionStorage.setItem('tj_admin_user', JSON.stringify(data.user))
    return data.user
  }

  async function refreshMe() {
    if (!token.value) return null
    const me = await api('/api/admin/me')
    user.value = me
    sessionStorage.setItem('tj_admin_user', JSON.stringify(me))
    return me
  }

  async function logout() {
    try { await api('/api/admin/logout', { method: 'POST' }) } catch { /* already gone */ }
    clear()
  }

  function clear() {
    token.value = ''
    user.value = null
    sessionStorage.removeItem('tj_admin_token')
    sessionStorage.removeItem('tj_admin_user')
  }

  return { token, user, loggedIn, can, login, refreshMe, logout, clear }
})
