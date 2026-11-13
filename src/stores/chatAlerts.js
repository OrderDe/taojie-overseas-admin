// Shared unread-chat alert state for the whole admin console.
//
// One source of truth drives four effects:
//   1. the red unread badge on the sidebar「在线聊天」menu item,
//   2. (the chat page's own list styling reads its local data as before),
//   3. the browser-tab title flashing while unread is pending,
//   4. desktop notifications when a visitor message arrives.
//
// Data comes from GET /api/admin/chat/sessions (each row carries
// `unread`; there is no aggregate endpoint). While the agent is on the
// chat page, Chat.vue already polls that endpoint every 4s and feeds the
// result in via `ingest()`, so this store skips its own fetch there; on
// every other page it polls every 15s itself. Polling only runs for
// signed-in accounts holding the `chat` permission.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import router from '../router'
import { useAuthStore } from './auth'
import { buildUnreadMap, detectNewArrivals, shouldFlashTitle, nextFlashTitle } from '../utils/chatAlertLogic'

const POLL_MS = 15000
const FLASH_MS = 1000

export const useChatAlertsStore = defineStore('chatAlerts', () => {
  const unreadMap = ref({})
  const initialized = ref(false)
  const activeSessionId = ref(null)
  const notifyOn = ref(localStorage.getItem('tj-chat-notify') === '1')
  const routeName = ref(router.currentRoute.value.name || '')
  const pageVisible = ref(!document.hidden)

  let baseTitle = document.title
  let pollTimer = null
  let flashTimer = null
  let removeRouteHook = null
  let started = false

  const totalUnread = computed(() => Object.values(unreadMap.value).reduce((n, x) => n + (x.unread || 0), 0))

  // ---- browser tab title flashing ----
  function syncTitle() {
    const flash = shouldFlashTitle({ totalUnread: totalUnread.value, routeName: routeName.value, visible: pageVisible.value })
    if (flash) {
      if (!flashTimer) {
        document.title = `【${totalUnread.value} 条新消息】`
        flashTimer = setInterval(() => {
          document.title = nextFlashTitle(document.title, baseTitle, totalUnread.value)
        }, FLASH_MS)
      }
    } else {
      if (flashTimer) { clearInterval(flashTimer); flashTimer = null }
      if (document.title !== baseTitle) document.title = baseTitle
    }
  }

  // ---- desktop notifications ----
  function fireNotification(hit) {
    if (!notifyOn.value || !('Notification' in window) || Notification.permission !== 'granted') return
    const summary = String(hit.lastMessage || '').slice(0, 60)
    try {
      const n = new Notification('新聊天消息', {
        body: summary ? `${hit.visitorName}：${summary}` : `${hit.visitorName} 发来新消息`,
        tag: `tj-chat-${hit.id}`
      })
      n.onclick = () => {
        window.focus()
        router.push({ name: 'chat', query: { session: String(hit.id) } })
        n.close()
      }
    } catch { /* notifications unavailable in this context */ }
  }

  async function toggleNotify() {
    if (notifyOn.value) {
      notifyOn.value = false
      localStorage.setItem('tj-chat-notify', '0')
      return
    }
    if (!('Notification' in window)) {
      ElMessage.warning('当前浏览器不支持桌面通知')
      return
    }
    let perm = Notification.permission
    if (perm === 'default') {
      try { perm = await Notification.requestPermission() } catch { perm = 'denied' }
    }
    if (perm === 'granted') {
      notifyOn.value = true
      localStorage.setItem('tj-chat-notify', '1')
      ElMessage.success('桌面通知已开启')
    } else {
      notifyOn.value = false
      localStorage.setItem('tj-chat-notify', '0')
      ElMessage.warning('桌面通知已被浏览器拒绝，请在浏览器地址栏的站点设置中允许通知后重试')
    }
  }

  // ---- shared ingest: every alert effect reads from this one snapshot ----
  function ingest(sessions) {
    const arrivals = detectNewArrivals(unreadMap.value, sessions, activeSessionId.value, initialized.value)
    unreadMap.value = buildUnreadMap(sessions)
    initialized.value = true
    for (const hit of arrivals) fireNotification(hit)
    syncTitle()
  }

  async function tick() {
    const auth = useAuthStore()
    if (!auth.loggedIn || !auth.can('chat')) {
      if (initialized.value) { unreadMap.value = {}; initialized.value = false; syncTitle() }
      return
    }
    if (routeName.value === 'chat') return // Chat.vue ingests its own 4s poll
    try {
      const list = await api('/api/admin/chat/sessions')
      ingest(Array.isArray(list) ? list : [])
    } catch { /* transient failures stay silent; the badge just waits */ }
  }

  function onVisibility() {
    pageVisible.value = !document.hidden
    syncTitle()
  }

  function start() {
    if (started) return
    started = true
    baseTitle = baseTitle || document.title
    routeName.value = router.currentRoute.value.name || ''
    pageVisible.value = !document.hidden
    removeRouteHook = router.afterEach((to) => {
      routeName.value = to.name || ''
      syncTitle()
      tick()
    })
    document.addEventListener('visibilitychange', onVisibility)
    tick()
    pollTimer = setInterval(tick, POLL_MS)
  }

  function stop() {
    started = false
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    if (removeRouteHook) { removeRouteHook(); removeRouteHook = null }
    document.removeEventListener('visibilitychange', onVisibility)
    unreadMap.value = {}
    initialized.value = false
    activeSessionId.value = null
    if (flashTimer) { clearInterval(flashTimer); flashTimer = null }
    if (document.title !== baseTitle) document.title = baseTitle
  }

  function setActiveSession(id) {
    activeSessionId.value = id === null || id === undefined ? null : id
  }

  return {
    totalUnread, notifyOn, activeSessionId,
    start, stop, ingest, setActiveSession, toggleNotify
  }
})
