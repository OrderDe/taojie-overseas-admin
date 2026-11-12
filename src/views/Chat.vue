<template>
  <div class="chat-page">
    <!-- Session list -->
    <div class="session-list">
      <div class="list-head">
        <b>会话列表</b>
        <el-button size="small" @click="loadSessions(false)">刷新</el-button>
      </div>
      <div
        v-for="s in sessions"
        :key="s.id"
        class="session-item"
        :class="{ active: current && current.id === s.id }"
        @click="openSession(s)"
      >
        <div class="s-top">
          <b class="s-name">{{ s.visitorName || '访客' }}</b>
          <el-badge v-if="s.unread" :value="s.unread" />
          <span class="s-time">{{ fmtTime(s.lastMsgAt || s.last_msg_at || s.createdAt) }}</span>
        </div>
        <div class="s-preview">{{ s.lastMessage || '（暂无消息）' }}</div>
      </div>
      <el-empty v-if="!loadingSessions && sessions.length === 0" description="暂无聊天会话" />
    </div>

    <!-- Conversation thread -->
    <div class="thread">
      <template v-if="current">
        <div class="thread-head">
          <b>{{ current.visitorName || '访客' }}</b>
          <span class="note">语言：{{ current.lang || '-' }} · 访客在商城前台的在线聊天，每 4 秒自动刷新</span>
        </div>
        <div ref="msgBox" class="messages">
          <div v-for="m in messages" :key="m.id" class="msg-row" :class="m.sender">
            <div class="bubble">
              <div class="b-meta">
                {{ m.sender === 'agent' ? '客服' : (current.visitorName || '访客') }} · {{ fmtTime(m.createdAt || m.created_at) }}
              </div>
              <div class="b-body">{{ m.body }}</div>
            </div>
          </div>
          <el-empty v-if="messages.length === 0" description="暂无消息" />
        </div>
        <div class="reply-box">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="3"
            placeholder="输入回复，Enter 发送（Shift+Enter 换行）"
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'

const sessions = ref([])
const current = ref(null)
const messages = ref([])
const draft = ref('')
const sending = ref(false)
const loadingSessions = ref(false)
const msgBox = ref(null)
let timer = null

// Node returns ISO strings (created_at / createdAt); Java may return a
// Date — normalise both to 'YYYY-MM-DD HH:mm'.
function fmtTime(v) {
  if (v === null || v === undefined || v === '') return ''
  const d = new Date(typeof v === 'number' ? v : String(v))
  if (Number.isNaN(d.getTime())) return String(v).replace('T', ' ').slice(0, 16)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function scrollToBottom() {
  nextTick(() => { if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight })
}

async function loadSessions(silent) {
  if (!silent) loadingSessions.value = true
  try {
    sessions.value = (await api('/api/admin/chat/sessions')) || []
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
    // Reading the thread clears the unread count on the server; mirror it.
    const s = sessions.value.find((x) => x.id === current.value.id)
    if (s) s.unread = 0
    if (grew && nearBottom) scrollToBottom()
  } catch (e) {
    if (!silent) ElMessage.error(e.message)
  }
}

async function openSession(s) {
  current.value = s
  messages.value = []
  await loadMessages(false)
  scrollToBottom()
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

onMounted(() => {
  loadSessions(false)
  timer = setInterval(() => {
    loadSessions(true)
    if (current.value) loadMessages(true)
  }, 4000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.chat-page { display: flex; gap: 14px; align-items: stretch; }
.session-list {
  width: 300px; flex-shrink: 0; background: #fff; border: 1px solid #e6e8f0;
  border-radius: 8px; padding: 12px; max-height: calc(100vh - 150px); overflow-y: auto;
}
.list-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.session-item { padding: 10px; border-radius: 8px; cursor: pointer; }
.session-item:hover { background: #f5f6fa; }
.session-item.active { background: #eef1ff; }
.s-top { display: flex; align-items: center; gap: 8px; }
.s-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-time { color: #8a8fa3; font-size: 12px; }
.s-preview {
  color: #8a8fa3; font-size: 13px; margin-top: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.thread {
  flex: 1; min-width: 0; background: #fff; border: 1px solid #e6e8f0; border-radius: 8px;
  padding: 14px; display: flex; flex-direction: column; max-height: calc(100vh - 150px);
}
.thread-head { display: flex; gap: 12px; align-items: baseline; margin-bottom: 10px; }
.note { color: #8a8fa3; font-size: 13px; }
.messages { flex: 1; overflow-y: auto; padding: 6px 2px; display: flex; flex-direction: column; gap: 10px; }
.msg-row { display: flex; }
.msg-row.visitor { justify-content: flex-start; }
.msg-row.agent { justify-content: flex-end; }
.bubble { max-width: 72%; padding: 9px 12px; border-radius: 12px; background: #f2f3f7; }
.msg-row.agent .bubble { background: #e8f0fe; }
.b-meta { font-size: 11px; color: #8a8fa3; margin-bottom: 3px; }
.b-body { white-space: pre-wrap; word-break: break-word; line-height: 1.5; }
.reply-box { display: flex; gap: 10px; align-items: flex-end; margin-top: 12px; }
.reply-box .el-textarea { flex: 1; }
</style>
