// 后台外观主题状态：与 index.html 内联脚本、styles/admin-themes.css 共用同一 key 与 data 属性。
export const ADMIN_THEME_KEY = 'tj-admin-theme'
export const ADMIN_THEMES = [
  { key: 'a', label: '墨绿书房' },
  { key: 'b', label: '素纸留白' },
  { key: 'c', label: '夜航控制台' }
]
export const DEFAULT_ADMIN_THEME = 'b'

export function getAdminTheme() {
  try {
    const saved = localStorage.getItem(ADMIN_THEME_KEY)
    return ADMIN_THEMES.some((t) => t.key === saved) ? saved : DEFAULT_ADMIN_THEME
  } catch {
    return DEFAULT_ADMIN_THEME
  }
}

export function setAdminTheme(key) {
  const next = ADMIN_THEMES.some((t) => t.key === key) ? key : DEFAULT_ADMIN_THEME
  document.documentElement.dataset.adminTheme = next
  try {
    localStorage.setItem(ADMIN_THEME_KEY, next)
  } catch {
    // 隐私模式等场景写不进 localStorage 时，本次会话内切换仍然生效
  }
  return next
}

// main.js 挂载前调用，确保首帧就是已存主题。
export function applyStoredAdminTheme() {
  return setAdminTheme(getAdminTheme())
}
