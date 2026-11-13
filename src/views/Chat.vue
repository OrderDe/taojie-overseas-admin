<template>
  <div class="chat-page">
    <!-- Session list -->
    <div class="session-list">
      <div class="list-head">
        <b>会话列表</b>
        <span class="head-actions">
          <el-button size="small" @click="toggleSound">{{ soundOn ? '🔔 提醒音开' : '🔕 提醒音关' }}</el-button>
          <el-button size="small" @click="chatAlerts.toggleNotify()">{{ chatAlerts.notifyOn ? '🖥️ 桌面通知开' : '🖥️ 桌面通知关' }}</el-button>
          <el-button size="small" @click="loadSessions(false)">刷新</el-button>
        </span>
      </div>
      <div class="list-tools">
        <el-input v-model="keyword" size="small" clearable placeholder="搜索访客名或消息内容" />
        <el-select v-model="filter" size="small" class="filter-sel">
          <el-option label="全部" value="all" />
          <el-option label="在线" value="online" />
          <el-option label="待回复" value="unread" />
          <el-option label="疑似机器人" value="bot" />
          <el-option label="已结束" value="closed" />
        </el-select>
      </div>
      <div
        v-for="s in filteredSessions"
        :key="s.id"
        class="session-item"
        :class="{ active: current && current.id === s.id, 'has-unread': s.unread > 0 }"
        @click="openSession(s)"
      >
        <div class="s-top">
          <span class="dot" :class="{ on: s.online }"></span>
          <span v-if="s.unread" class="unread-dot"></span>
          <b class="s-name">{{ s.visitorName || '访客' }}</b>
          <el-tag v-if="s.suspectBot" size="small" type="danger" effect="plain">疑似机器人</el-tag>
          <el-tag v-if="s.status === 'closed'" size="small" type="info" effect="plain">已结束</el-tag>
          <el-badge v-if="s.unread" :value="s.unread" :max="99" class="unread-badge" />
          <span class="s-time">{{ fmtTime(s.lastMsgAt || s.last_msg_at || s.createdAt) }}</span>
        </div>
        <div class="s-meta">
          <span>{{ regionLabel(s) }}</span>
          <span v-if="deviceLabel(s.device)"> · {{ deviceLabel(s.device) }}</span>
        </div>
        <div v-if="s.product && s.product.name" class="s-product">
          <img v-if="s.product.image" :src="s.product.image" alt="" @error="$event.target.remove()" />
          <span class="s-product-name">🛒 {{ s.product.name }}</span>
          <el-tag size="small" type="warning" effect="plain">{{ s.product.negotiable ? '面议' : (s.product.priceLabel || '') }}</el-tag>
        </div>
        <div class="s-preview">{{ s.lastMessage || '（暂无消息）' }}</div>
      </div>
      <el-empty v-if="!loadingSessions && filteredSessions.length === 0" description="暂无聊天会话" />
    </div>

    <!-- Conversation thread -->
    <div class="thread">
      <template v-if="current">
        <div class="thread-head">
          <b>{{ current.visitorName || '访客' }}</b>
          <span class="note">访客在商城前台的在线聊天，每 4 秒自动刷新</span>
        </div>

        <!-- Visitor profile -->
        <div v-if="sessionInfo" class="profile">
          <div class="p-grid">
            <span>地区：{{ regionLabel(sessionInfo) || '-' }}<template v-if="sessionInfo.timezone">（{{ sessionInfo.timezone }}）</template></span>
            <span>IP：{{ sessionInfo.ip || '-' }}</span>
            <span>设备：{{ deviceLabel(sessionInfo.device) || '-' }}<template v-if="sessionInfo.browser || sessionInfo.os"> · {{ sessionInfo.browser || '' }}<template v-if="sessionInfo.os"> / {{ sessionInfo.os }}</template></template></span>
            <span>语言：{{ sessionInfo.lang || '-' }}</span>
            <span>当前页：{{ sessionInfo.currentPage || '-' }}</span>
            <span>浏览页数：{{ sessionInfo.pageViews ?? 0 }}</span>
            <span v-if="sessionInfo.product && sessionInfo.product.name" class="p-wide p-product">
              咨询商品：
              <img v-if="sessionInfo.product.image" :src="sessionInfo.product.image" alt="" @error="$event.target.remove()" />
              <b>{{ sessionInfo.product.name }}</b>
              <el-tag size="small" type="warning" effect="plain">{{ sessionInfo.product.negotiable ? '面议' : (sessionInfo.product.priceLabel || '') }}</el-tag>
            </span>
            <span class="p-wide">来源：{{ sessionInfo.referrer || '直接访问' }}</span>
            <span class="p-wide">
              状态：{{ sessionInfo.online ? '在线' : '离线' }} · 已发 {{ sessionInfo.msgCount ?? 0 }} 条消息
              <el-tag v-if="sessionInfo.suspectBot" size="small" type="danger" effect="plain">疑似机器人（UA 特征命中，仅供参考）</el-tag>
              <el-tag v-if="sessionInfo.status === 'closed'" size="small" type="info" effect="plain">会话已结束</el-tag>
            </span>
          </div>
          <div class="p-actions">
            <el-input v-model="noteDraft" size="small" class="note-input" placeholder="内部备注（访客看不到）" maxlength="2000" />
            <el-button size="small" @click="saveNote">保存备注</el-button>
            <el-button
              size="small"
              :type="sessionInfo.status === 'closed' ? 'success' : 'warning'"
              plain
              @click="toggleStatus"
            >{{ sessionInfo.status === 'closed' ? '重新开启会话' : '结束会话' }}</el-button>
          </div>
        </div>

        <div ref="msgBox" class="messages">
          <div v-for="m in messages" :key="m.id" class="msg-row" :class="m.sender">
            <div class="bubble" :class="{ 'bubble-emoji': isEmojiOnlyMessage(m.body) }">
              <div class="b-meta">
                {{ m.sender === 'agent' ? '客服' : (current.visitorName || '访客') }} · {{ fmtTime(m.createdAt || m.created_at) }}
              </div>
              <div class="b-body" :class="{ 'emoji-only': isEmojiOnlyMessage(m.body) }">{{ m.body }}</div>
            </div>
            <div v-if="m.id === lastAgentId" class="receipt">{{ visitorRead ? '已读' : '未读' }}</div>
          </div>
          <el-empty v-if="messages.length === 0" description="暂无消息" />
        </div>
        <div v-if="sessionInfo && sessionInfo.visitorTyping" class="typing-hint">访客正在输入…</div>

        <!-- Quick replies -->
        <div class="quick-replies">
          <el-tag
            v-for="(q, i) in builtinReplies"
            :key="'b' + i"
            class="qr-tag"
            effect="plain"
            :title="q"
            @click="fillDraft(q)"
          >{{ q }}</el-tag>
          <el-tag
            v-for="(q, i) in customReplies"
            :key="'c' + i"
            class="qr-tag"
            effect="plain"
            closable
            :title="q"
            @click="fillDraft(q)"
            @close="removeCustomReply(i)"
          >{{ q }}</el-tag>
          <el-button size="small" text type="primary" @click="addCustomReply">+ 自定义短语</el-button>
          <el-button size="small" text @click="emojiOpen = !emojiOpen">😊 表情</el-button>
        </div>
        <div v-if="emojiOpen" class="emoji-panel">
          <button v-for="e in EMOJIS" :key="e" type="button" class="emoji-cell" @click="insertEmoji(e)">{{ e }}</button>
        </div>

        <div class="reply-box">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="3"
            placeholder="输入回复，Enter 发送（Shift+Enter 换行）"
            @input="onDraftInput"
            @keydown.enter.exact.prevent="sendReply"
          />
          <el-button type="primary" :loading="sending" @click="sendReply">发送回复</el-button>
        </div>
      </template>
      <el-empty v-else description="从左侧选择一个会话开始回复" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../api/client'
import { EMOJIS, isEmojiOnlyMessage } from '../emojis.js'
import { useChatAlertsStore } from '../stores/chatAlerts'

const route = useRoute()
const chatAlerts = useChatAlertsStore()

const sessions = ref([])
const current = ref(null)
const sessionInfo = ref(null) // full profile of the open session (from thread response)
const messages = ref([])
const draft = ref('')
const noteDraft = ref('')
const sending = ref(false)
const loadingSessions = ref(false)
const msgBox = ref(null)
const keyword = ref('')
const filter = ref('all')
const emojiOpen = ref(false)
const soundOn = ref(localStorage.getItem('tj-chat-sound') === '1')
let timer = null
let keywordTimer = null
let lastTypingAt = 0
let prevTotalUnread = null
let audioCtx = null

const builtinReplies = [
  'Hi! Thanks for reaching out — how can I help you today?',
  'Could you tell me which product and quantity you need, and your destination port?',
  'Please leave your email or WhatsApp so we can send the quotation and catalogue.',
  'We are preparing the catalogue and best price for you — please give us a few minutes.',
  'Thanks for your patience! Anything else I can help with?'
]
const customReplies = ref([])
try {
  const saved = JSON.parse(localStorage.getItem('tj-chat-quick-replies') || '[]')
  if (Array.isArray(saved)) customReplies.value = saved.filter((x) => typeof x === 'string')
} catch { /* ignore broken local data */ }

// Node returns ISO strings (created_at / createdAt); Java may return a
// Date — normalise both to 'YYYY-MM-DD HH:mm'.
function fmtTime(v) {
  if (v === null || v === undefined || v === '') return ''
  const d = new Date(typeof v === 'number' ? v : String(v))
  if (Number.isNaN(d.getTime())) return String(v).replace('T', ' ').slice(0, 16)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function deviceLabel(d) {
  return { desktop: '电脑', mobile: '手机', tablet: '平板' }[d] || ''
}

function regionLabel(s) {
  if (!s) return ''
  return [s.country, s.city].filter(Boolean).join(' · ')
}

const filteredSessions = computed(() => {
  const f = filter.value
  if (f === 'online') return sessions.value.filter((s) => s.online)
  if (f === 'unread') return sessions.value.filter((s) => s.unread > 0)
  if (f === 'bot') return sessions.value.filter((s) => s.suspectBot)
  if (f === 'closed') return sessions.value.filter((s) => s.status === 'closed')
  return sessions.value
})

const totalUnread = computed(() => sessions.value.reduce((n, s) => n + (s.unread || 0), 0))

const lastAgentId = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].sender === 'agent') return messages.value[i].id
  }
  return 0
})
const visitorRead = computed(() =>
  lastAgentId.value > 0 && (sessionInfo.value?.visitorReadMsgId || 0) >= lastAgentId.value
)

// ---- new-message sound (title flashing / badge / desktop notifications
// live in the shared chatAlerts store, fed by loadSessions → ingest) ----
watch(totalUnread, (n) => {
  if (prevTotalUnread !== null && n > prevTotalUnread && soundOn.value) beep()
  prevTotalUnread = n
})

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) audioCtx = new AC()
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
}

function beep() {
  ensureAudio()
  if (!audioCtx) return
  const t0 = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
  osc.connect(gain).connect(audioCtx.destination)
  osc.start(t0)
  osc.stop(t0 + 0.25)
}

function toggleSound() {
  soundOn.value = !soundOn.value
  localStorage.setItem('tj-chat-sound', soundOn.value ? '1' : '0')
  if (soundOn.value) beep() // creating/resuming the context needs a user gesture
}

// ---- emoji palette ----
// Clicking an emoji appends it to the reply draft (never sends directly).
function insertEmoji(e) {
  draft.value += e
}

// ---- quick replies ----
function fillDraft(text) {
  draft.value = draft.value.trim() ? `${draft.value.trim()}\n${text}` : text
}

async function addCustomReply() {
  try {
    const { value } = await ElMessageBox.prompt('输入一条自定义快捷短语（点击即填入回复框，不会自动发送）', '添加快捷短语', {
      confirmButtonText: '添加',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '短语不能为空')
    })
    customReplies.value.push(value.trim())
    localStorage.setItem('tj-chat-quick-replies', JSON.stringify(customReplies.value))
  } catch { /* cancelled */ }
}

function removeCustomReply(i) {
  customReplies.value.splice(i, 1)
  localStorage.setItem('tj-chat-quick-replies', JSON.stringify(customReplies.value))
}

// ---- data loading ----
function scrollToBottom() {
  nextTick(() => { if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight })
}

async function loadSessions(silent) {
  if (!silent) loadingSessions.value = true
  try {
    const kw = keyword.value.trim()
    const url = kw ? `/api/admin/chat/sessions?keyword=${encodeURIComponent(kw)}` : '/api/admin/chat/sessions'
    sessions.value = (await api(url)) || []
    // Only the unfiltered list is a complete unread snapshot for the
    // shared alert store (badge / title flash / desktop notifications).
    if (!kw) chatAlerts.ingest(sessions.value)
  } catch (e) {
    if (!silent) ElMessage.error(e.message)
  } finally {
    loadingSessions.value = false
  }
}

async function loadMessages(silent) {
  if (!current.value) return
  const box = msgBox.value
  const nearBottom = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 80
  try {
    const r = await api(`/api/admin/chat/sessions/${current.value.id}/messages`)
    const list = (r && r.messages) || []
    const grew = list.length !== messages.value.length
    messages.value = list
    if (r && r.session) {
      sessionInfo.value = r.session
      // keep the list row in sync (status / unread) without touching noteDraft
      const row = sessions.value.find((x) => x.id === current.value.id)
      if (row) { row.status = r.session.status; row.unread = 0 }
    } else {
      const s = sessions.value.find((x) => x.id === current.value.id)
      if (s) s.unread = 0
    }
    if (grew && nearBottom) scrollToBottom()
  } catch (e) {
    if (!silent) ElMessage.error(e.message)
  }
}

async function openSession(s) {
  current.value = s
  chatAlerts.setActiveSession(s.id)
  sessionInfo.value = null
  messages.value = []
  draft.value = ''
  emojiOpen.value = false
  noteDraft.value = s.note || '' // initialise once; polls never overwrite the editor
  await loadMessages(false)
  scrollToBottom()
}

function onDraftInput() {
  if (!current.value) return
  const now = Date.now()
  if (now - lastTypingAt < 2000) return
  lastTypingAt = now
  api(`/api/admin/chat/sessions/${current.value.id}/typing`, { method: 'POST' }).catch(() => {})
}

async function sendReply() {
  const body = draft.value.trim()
  if (!body || !current.value || sending.value) return
  sending.value = true
  try {
    const m = await api(`/api/admin/chat/sessions/${current.value.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body })
    })
    if (m && m.id) messages.value.push(m)
    draft.value = ''
    scrollToBottom()
    loadSessions(true)
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    sending.value = false
  }
}

async function saveNote() {
  if (!current.value) return
  try {
    const r = await api(`/api/admin/chat/sessions/${current.value.id}/note`, {
      method: 'PUT',
      body: JSON.stringify({ note: noteDraft.value })
    })
    if (sessionInfo.value) sessionInfo.value.note = (r && r.note) ?? noteDraft.value
    const row = sessions.value.find((x) => x.id === current.value.id)
    if (row) row.note = noteDraft.value
    ElMessage.success('备注已保存')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

async function toggleStatus() {
  if (!current.value || !sessionInfo.value) return
  const next = sessionInfo.value.status === 'closed' ? 'open' : 'closed'
  try {
    const r = await api(`/api/admin/chat/sessions/${current.value.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: next })
    })
    sessionInfo.value.status = (r && r.status) || next
    const row = sessions.value.find((x) => x.id === current.value.id)
    if (row) row.status = sessionInfo.value.status
    ElMessage.success(next === 'closed' ? '会话已结束' : '会话已重新开启')
    loadSessions(true)
  } catch (e) {
    ElMessage.error(e.message)
  }
}

watch(keyword, () => {
  if (keywordTimer) clearTimeout(keywordTimer)
  keywordTimer = setTimeout(() => loadSessions(true), 400)
})

onMounted(async () => {
  await loadSessions(false)
  // Desktop notifications deep-link here with ?session=<id>.
  const targetId = route.query.session
  if (targetId) {
    const s = sessions.value.find((x) => String(x.id) === String(targetId))
    if (s) openSession(s)
  }
  timer = setInterval(() => {
    loadSessions(true)
    if (current.value) loadMessages(true)
  }, 4000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (keywordTimer) clearTimeout(keywordTimer)
  chatAlerts.setActiveSession(null)
})
</script>

<style scoped>
.chat-page { display: flex; gap: 14px; align-items: stretch; }
.session-list {
  width: 320px; flex-shrink: 0; background: var(--adm-surface); border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius); padding: 14px; max-height: calc(100vh - 150px); overflow-y: auto;
  box-shadow: var(--adm-shadow);
}
.list-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.head-actions { display: flex; gap: 6px; }
.list-tools { display: flex; gap: 8px; margin-bottom: 10px; }
.filter-sel { width: 104px; flex-shrink: 0; }
.session-item { padding: 10px; border-radius: 8px; cursor: pointer; }
.session-item:hover { background: var(--adm-surface-2); }
.session-item.active { background: var(--adm-primary-light-9); }
/* Unread rows only: gentle breathing highlight + pulsing red dot +
   an enlarged count badge. Calm again as soon as the row is read. */
.session-item.has-unread { animation: unread-breath 2s ease-in-out infinite; }
.session-item.has-unread.active { animation: none; }
@keyframes unread-breath {
  0%, 100% { background-color: rgba(245, 108, 108, .05); }
  50% { background-color: rgba(245, 108, 108, .16); }
}
.unread-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #f56c6c; flex-shrink: 0;
  animation: unread-pulse 1.2s ease-out infinite;
}
@keyframes unread-pulse {
  0% { box-shadow: 0 0 0 0 rgba(245, 108, 108, .55); }
  70% { box-shadow: 0 0 0 7px rgba(245, 108, 108, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0); }
}
.unread-badge :deep(.el-badge__content) {
  font-size: 12px; font-weight: 700; height: 20px; line-height: 20px;
  padding: 0 7px; border-radius: 10px;
}
.s-top { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #c0c4cc; flex-shrink: 0; }
.dot.on { background: #2fbf71; }
.s-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-time { color: var(--adm-text-3); font-size: 12px; }
.s-meta { color: var(--adm-text-3); font-size: 12px; margin-top: 3px; }
.s-preview {
  color: var(--adm-text-3); font-size: 12.5px; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.s-product { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12.5px; }
.s-product img { width: 22px; height: 22px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.s-product-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--adm-text-2); }
.p-product { display: flex; align-items: center; gap: 6px; }
.p-product img { width: 26px; height: 26px; object-fit: cover; border-radius: 4px; }
.thread {
  flex: 1; min-width: 0; background: var(--adm-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius);
  padding: 16px; display: flex; flex-direction: column; max-height: calc(100vh - 150px);
  box-shadow: var(--adm-shadow);
}
.thread-head { display: flex; gap: 12px; align-items: baseline; margin-bottom: 10px; }
.note { color: var(--adm-text-3); font-size: 13px; }
.profile {
  border: 1px solid var(--adm-border); background: var(--adm-surface-2); border-radius: 8px;
  padding: 10px 12px; margin-bottom: 10px;
}
.p-grid { display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: 13px; color: var(--adm-text-2); }
.p-wide { flex-basis: 100%; }
.p-actions { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
.note-input { flex: 1; }
.messages { flex: 1; overflow-y: auto; padding: 6px 2px; display: flex; flex-direction: column; gap: 10px; }
.msg-row { display: flex; flex-direction: column; }
.msg-row.visitor { align-items: flex-start; }
.msg-row.agent { align-items: flex-end; }
.bubble { max-width: 72%; padding: 10px 13px; border-radius: 12px; background: var(--adm-surface-2); }
.msg-row.agent .bubble { background: var(--adm-primary-light-9); }
.b-meta { font-size: 11px; color: var(--adm-text-3); margin-bottom: 3px; }
.b-body { white-space: pre-wrap; word-break: break-word; font-size: 14px; line-height: 1.65; }
.msg-row .bubble.bubble-emoji { background: transparent; }
.b-body.emoji-only { font-size: 32px; line-height: 1.3; }
.emoji-panel {
  display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px;
  margin-top: 8px; padding: 10px; border: 1px solid var(--adm-border); border-radius: 8px;
  max-height: 168px; overflow-y: auto; background: var(--adm-surface-2);
}
.emoji-cell {
  border: none; background: transparent; cursor: pointer; border-radius: 8px;
  font-size: 20px; padding: 5px 0; line-height: 1.2;
}
.emoji-cell:hover { background: var(--adm-primary-light-9); }
.receipt { font-size: 11px; color: var(--adm-text-3); padding-bottom: 2px; }
.typing-hint { color: var(--adm-text-3); font-size: 12px; font-style: italic; padding: 4px 2px 0; }
.quick-replies { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 12px; }
.qr-tag { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.reply-box { display: flex; gap: 10px; align-items: flex-end; margin-top: 10px; }
.reply-box .el-textarea { flex: 1; }
</style>
