// HTTP client for the overseas backend admin API (/api/admin/**).
// - Sends the session token as the x-admin-token header.
// - The Node backend returns plain JSON; the Java backend wraps payloads
//   in CommonResult { code, message, data } — unwrapped here so views see
//   one shape either way (same approach as plat's request wrapper).
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAuthStore } from '../stores/auth'

const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export async function api(path, opts = {}) {
  const auth = useAuthStore()
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(auth.token ? { 'x-admin-token': auth.token } : {}),
        ...(opts.headers || {})
      }
    })
  } catch {
    throw new Error('连不上后端服务，请确认后端已启动（默认 3100 端口）')
  }
  let body = null
  try { body = await res.json() } catch { /* empty body */ }
  if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
    if (body.code !== 200) {
      if (body.code === 401) handleUnauthorized()
      throw new Error(body.message || `请求失败 (${body.code})`)
    }
    return body.data
  }
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized()
    throw new Error((body && body.error) || `请求失败 (${res.status})`)
  }
  return body
}

function handleUnauthorized() {
  const auth = useAuthStore()
  auth.clear()
  if (router.currentRoute.value.name !== 'login') {
    router.push({ name: 'login' })
  }
}

// Run an async action and surface failures as a toast. Returns the result
// or undefined on error, so callers can simply `if (r) { ... }`.
export async function run(promise) {
  try {
    return await promise
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
    return undefined
  }
}
