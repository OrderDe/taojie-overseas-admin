<template>
  <div>
    <div class="toolbar">
      <el-button @click="load(false)">刷新</el-button>
      <el-input v-model="keyword" placeholder="搜 IP / 国家 / 城市" clearable style="width: 220px" />
      <span class="note">只看在线</span>
      <el-switch v-model="onlineOnly" />
      <span class="note">每 10 秒自动刷新；「在线」= 最近 60 秒有活动；点访客行看行程详情</span>
    </div>

    <div class="cards">
      <div class="stat-card">
        <div class="stat-num online-num">{{ summary.online }}</div>
        <div class="stat-label">当前在线</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ summary.todayUv }}</div>
        <div class="stat-label">今日访客</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ summary.todayPv }}</div>
        <div class="stat-label">今日浏览</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">{{ summary.totalUv }}</div>
        <div class="stat-label">累计访客 <span class="stat-sub">· 累计浏览 {{ summary.totalPv }}</span></div>
      </div>
    </div>

    <div class="panels">
      <el-card class="panel">
        <template #header>地区分布（按国家）</template>
        <div v-if="!countries.length" class="empty-note">暂无访客</div>
        <div v-for="c in countries" :key="c.country" class="bar-row">
          <span class="bar-name">{{ c.country }}</span>
          <span class="bar-track"><span class="bar-fill" :style="{ width: barWidth(c.visitors) }"></span></span>
          <span class="bar-num">{{ c.visitors }}</span>
        </div>
      </el-card>
      <el-card class="panel">
        <template #header>近 7 天趋势</template>
        <el-table :data="trend" size="small">
          <el-table-column label="日期" prop="date" />
          <el-table-column label="访客 UV" prop="uv" width="90" />
          <el-table-column label="浏览 PV" prop="pv" width="90" />
        </el-table>
      </el-card>
    </div>

    <el-table :data="filtered" v-loading="loading" stripe @row-click="openDetail" class="visitor-table">
      <el-table-column label="" width="36">
        <template #default="{ row }"><span class="dot" :class="{ on: row.online }"></span></template>
      </el-table-column>
      <el-table-column label="IP" width="140" prop="ip" />
      <el-table-column label="地区" min-width="170">
        <template #default="{ row }">{{ regionLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="设备 / 浏览器" min-width="150">
        <template #default="{ row }">{{ deviceLabel(row.device) }}<span v-if="row.browser"> · {{ row.browser }}</span><span v-if="row.os"> · {{ row.os }}</span></template>
      </el-table-column>
      <el-table-column label="当前页" min-width="150" prop="currentPage" show-overflow-tooltip />
      <el-table-column label="浏览页数" width="90" prop="pageViews" />
      <el-table-column label="来访次数" width="90" prop="visits" />
      <el-table-column label="停留（本次）" width="110">
        <template #default="{ row }">{{ fmtDuration(row.currentDwellSec) }}</template>
      </el-table-column>
      <el-table-column label="最近访问" width="150">
        <template #default="{ row }">{{ fmtTime(row.lastSeen) }}</template>
      </el-table-column>
      <el-table-column label="" width="90">
        <template #default="{ row }"><el-tag v-if="row.suspectBot" type="warning" size="small">疑似机器人</el-tag></template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && filtered.length === 0" description="暂无访客" />

    <el-drawer v-model="drawer" :title="'访客详情'" size="460px">
      <div v-if="detail" class="detail">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="状态">{{ detail.online ? '在线' : '已离开' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ detail.ip }}</el-descriptions-item>
          <el-descriptions-item label="地区">{{ regionLabel(detail) }}<span v-if="detail.timezone"> · {{ detail.timezone }}</span></el-descriptions-item>
          <el-descriptions-item label="设备">{{ deviceLabel(detail.device) }} · {{ detail.browser }} · {{ detail.os }}</el-descriptions-item>
          <el-descriptions-item label="来源页">{{ detail.referrer || '—' }}</el-descriptions-item>
          <el-descriptions-item label="首次落地">{{ detail.firstPage || '—' }}</el-descriptions-item>
          <el-descriptions-item label="当前页">{{ detail.currentPage || '—' }}</el-descriptions-item>
          <el-descriptions-item label="浏览页数">{{ detail.pageViews }} · 来访 {{ detail.visits }} 次</el-descriptions-item>
          <el-descriptions-item label="本次停留">{{ fmtDuration(detail.currentDwellSec) }}</el-descriptions-item>
          <el-descriptions-item label="累计停留">{{ fmtDuration(detail.dwellSec) }}</el-descriptions-item>
          <el-descriptions-item label="首次访问">{{ fmtTime(detail.firstSeen) }}</el-descriptions-item>
          <el-descriptions-item label="最近访问">{{ fmtTime(detail.lastSeen) }}</el-descriptions-item>
          <el-descriptions-item label="疑似机器人">{{ detail.suspectBot ? '是（UA 信号，仅供参考）' : '否' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="tl-title">行程时间线（最近 50 条）</h4>
        <div v-loading="eventsLoading">
          <div v-for="e in events" :key="e.id" class="tl-row">
            <span class="tl-time">{{ fmtTime(e.createdAt) }}</span>
            <el-tag :type="e.kind === 'click' ? 'success' : 'info'" size="small">{{ e.kind === 'click' ? '点击' : '浏览' }}</el-tag>
            <span class="tl-body">{{ e.kind === 'click' ? e.action : e.page }}</span>
          </div>
          <el-empty v-if="!eventsLoading && events.length === 0" description="暂无行程记录" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'

const summary = ref({ online: 0, todayUv: 0, todayPv: 0, totalUv: 0, totalPv: 0 })
const countries = ref([])
const trend = ref([])
const visitors = ref([])
const loading = ref(false)
const keyword = ref('')
const onlineOnly = ref(false)
const drawer = ref(false)
const detail = ref(null)
const events = ref([])
const eventsLoading = ref(false)
let timer = null

// Search and the online-only switch filter the latest-100 list the API
// returns (client-side, so auto-refresh keeps the filter applied).
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return visitors.value.filter((v) => {
    if (onlineOnly.value && !v.online) return false
    if (!kw) return true
    return [v.ip, v.country, v.region, v.city].some((f) => String(f || '').toLowerCase().includes(kw))
  })
})

const maxCountry = computed(() => Math.max(1, ...countries.value.map((c) => c.visitors || 0)))
function barWidth(n) { return `${Math.round(((n || 0) / maxCountry.value) * 100)}%` }

function regionLabel(v) {
  const parts = [v && v.country, v && v.region, v && v.city].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}
function deviceLabel(d) {
  return { desktop: '电脑', mobile: '手机', tablet: '平板' }[d] || (d || '')
}
// Local-timezone rendering for both Node ISO strings and Java dates.
function fmtTime(v) {
  if (v === null || v === undefined || v === '') return ''
  const d = new Date(typeof v === 'number' ? v : String(v))
  if (Number.isNaN(d.getTime())) return String(v).replace('T', ' ').slice(0, 16)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function fmtDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  if (s < 60) return `${s}秒`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}分${s % 60}秒`
  return `${Math.floor(m / 60)}时${m % 60}分`
}

async function load(quiet = true) {
  if (!quiet) loading.value = true
  try {
    const data = await api('/api/admin/visitors')
    if (data) {
      summary.value = data.summary || summary.value
      countries.value = data.countries || []
      trend.value = data.trend || []
      visitors.value = data.visitors || []
      // Keep an open detail drawer in step with the refreshed row.
      if (detail.value) {
        const fresh = visitors.value.find((v) => v.token === detail.value.token)
        if (fresh) detail.value = fresh
      }
    }
  } catch (e) {
    if (!quiet) ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  detail.value = row
  drawer.value = true
  events.value = []
  eventsLoading.value = true
  try {
    events.value = (await api(`/api/admin/visitors/${encodeURIComponent(row.token)}/events?limit=50`)) || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    eventsLoading.value = false
  }
}

onMounted(() => {
  load(false)
  timer = setInterval(() => load(true), 10000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.note { color: var(--adm-text-3); font-size: 13px; }
.cards { display: flex; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
.stat-card {
  flex: 1; min-width: 150px; background: var(--adm-surface); border: 1px solid var(--adm-border);
  border-radius: var(--adm-radius); padding: 16px 18px; box-shadow: var(--adm-shadow);
}
.stat-num { font-size: 30px; font-weight: 800; color: var(--adm-text-1); line-height: 1.1; }
.online-num { color: #2f9e44; }
.stat-label { color: var(--adm-text-3); font-size: 13px; margin-top: 4px; }
.stat-sub { color: var(--adm-text-3); }
.panels { display: flex; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
.panel { flex: 1; min-width: 320px; }
.empty-note { color: var(--adm-text-3); font-size: 13px; }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 13px; }
.bar-name { width: 130px; color: var(--adm-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 10px; background: var(--adm-surface-2); border-radius: 999px; overflow: hidden; }
.bar-fill { display: block; height: 100%; background: var(--adm-primary); border-radius: 999px; }
.bar-num { width: 40px; text-align: right; color: var(--adm-text-1); font-weight: 600; }
.visitor-table { cursor: pointer; }
.dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--adm-border); }
.dot.on { background: #2f9e44; }
.tl-title { margin: 18px 0 10px; color: var(--adm-text-1); }
.tl-row { display: flex; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--adm-border); font-size: 13px; }
.tl-time { color: var(--adm-text-3); white-space: nowrap; }
.tl-body { color: var(--adm-text-2); word-break: break-all; }
</style>
