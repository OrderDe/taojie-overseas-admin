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
  // The backend expands legacy shared keys ('products' / 'formula' /
  // 'config') into per-menu keys on every response; expand here too so a
  // user object cached in sessionStorage from before the split still
  // resolves its menus until the next /me refresh.
  const LEGACY_PERM_EXPANSIONS = {
    products: ['goods', 'brands'],
    formula: ['formula-colors', 'color-numbers', 'masterbatches', 'car-brands', 'car-models', 'formula-dicts'],
    config: ['theme-config', 'navigation', 'site-config', 'profile', 'pages', 'footer']
  }
  const expandedPerms = computed(() => {
    const out = new Set()
    for (const p of Array.isArray(user.value?.permissions) ? user.value.permissions : []) {
      for (const k of LEGACY_PERM_EXPANSIONS[p] || [p]) out.add(k)
    }
    return out
  })
  const can = (perm) => !!perm && (expandedPerms.value.has('*') || expandedPerms.value.has(perm))

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
