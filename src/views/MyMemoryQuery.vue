<template>
  <div>
    <!-- MyMemory 自检/查询工具：只查不存。走 POST /api/admin/translate
         并强制 provider:'mymemory'，与后台默认的自托管引擎互不影响。
         MyMemory 没有官方的剩余额度查询接口，所以本页不显示任何
         额度数字，只在源响应带 quotaFinished 时给出用完警告。 -->
    <el-card v-loading="loading" shadow="never" class="query-card">
      <div class="query-row">
        <el-input
          v-model="text"
          class="text-input"
          placeholder="输入要查询的中文词，如：汽车清漆"
          clearable
          @keyup.enter="onQuery"
        />
        <el-button type="primary" :loading="loading" @click="onQuery">查询</el-button>
        <el-button :loading="loading" @click="onSelfCheck">一键自检（示例词）</el-button>
      </div>
      <div class="lang-row">
        <span class="lang-label">目标语种：</span>
        <el-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          @change="toggleAll"
        >全选</el-checkbox>
        <el-checkbox-group v-model="selected" class="lang-group">
          <el-checkbox v-for="l in TARGET_LANGS" :key="l.code" :value="l.code">
            {{ l.label }}（{{ l.name }}）
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <p class="note">额度以查询结果为准：MyMemory 没有官方的剩余额度查询接口，本页不会显示虚构的剩余字数。</p>
    </el-card>

    <el-alert
      v-if="quotaFinished"
      class="quota-alert"
      type="error"
      :closable="false"
      show-icon
      title="今日免费额度已用完（MyMemory 返回 quotaFinished），请过段时间或明天再查"
    />
    <el-alert
      v-if="fatalError"
      class="quota-alert"
      type="error"
      :closable="false"
      show-icon
      :title="`查询失败：${fatalError}`"
    />

    <div v-if="queriedAt" class="status-line">
      实际引擎：MyMemory（免费接口）· 查询时间：{{ queriedAt }} ·
      成功 {{ okCount }} 个语种 / 失败 {{ failCount }} 个语种
      <template v-if="usedText">· 查询词：「{{ usedText }}」</template>
    </div>

    <el-table v-if="rows.length" :data="rows" stripe class="result-table">
      <el-table-column label="语种" width="200">
        <template #default="{ row }">{{ row.label }}（{{ row.name }}）· {{ row.code }}</template>
      </el-table-column>
      <el-table-column label="译文 / 错误" min-width="320">
        <template #default="{ row }">
          <span v-if="row.error" class="err-text">{{ row.error }}</span>
          <span v-else>{{ row.text }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else-if="!loading && queriedAt" description="没有可展示的结果" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'
import { LANGS, TARGET_CODES } from '../utils/langs'

const TARGET_LANGS = LANGS.filter((l) => TARGET_CODES.includes(l.code))
const EXAMPLE = '汽车清漆'

const text = ref(EXAMPLE)
const selected = ref([...TARGET_CODES])
const loading = ref(false)
const rows = ref([])
const queriedAt = ref('')
const usedText = ref('')
const fatalError = ref('')
const quotaFinished = ref(false)

const allSelected = computed(() => selected.value.length === TARGET_CODES.length)
const someSelected = computed(() => selected.value.length > 0 && !allSelected.value)
const okCount = computed(() => rows.value.filter((r) => !r.error).length)
const failCount = computed(() => rows.value.filter((r) => r.error).length)

function toggleAll(v) {
  selected.value = v ? [...TARGET_CODES] : []
}

async function runQuery(q, targets) {
  loading.value = true
  fatalError.value = ''
  quotaFinished.value = false
  rows.value = []
  try {
    const r = await api('/api/admin/translate', {
      method: 'POST',
      body: JSON.stringify({ text: q, targets, provider: 'mymemory' })
    })
    const translations = (r && r.translations) || {}
    const errors = (r && r.errors) || {}
    rows.value = TARGET_LANGS.filter((l) => targets.includes(l.code)).map((l) => ({
      code: l.code,
      label: l.label,
      name: l.name,
      text: translations[l.code] || '',
      error: errors[l.code] || (translations[l.code] ? '' : '未返回译文')
    }))
    if (r && r.meta && r.meta.quotaFinished) quotaFinished.value = true
    if (Object.values(errors).some((m) => /quota/i.test(String(m)))) quotaFinished.value = true
  } catch (e) {
    // Total failure (502): the backend's per-language errors ride on
    // e.body — show them verbatim so额度/网络/接口问题能分辨。
    const errs = (e.body && e.body.errors) || {}
    if (Object.keys(errs).length) {
      rows.value = TARGET_LANGS.filter((l) => targets.includes(l.code)).map((l) => ({
        code: l.code,
        label: l.label,
        name: l.name,
        text: '',
        error: errs[l.code] || '翻译失败'
      }))
      if (Object.values(errs).some((m) => /quota/i.test(String(m)))) quotaFinished.value = true
    }
    fatalError.value = (e.body && e.body.error) || e.message || '查询失败'
  } finally {
    usedText.value = q
    queriedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
    loading.value = false
  }
}

function onQuery() {
  const q = text.value.trim()
  if (!q) {
    ElMessage.warning('先输入要查询的中文词')
    return
  }
  if (!selected.value.length) {
    ElMessage.warning('至少勾选一个目标语种')
    return
  }
  runQuery(q, [...selected.value])
}

// Self-check = one query with the example word across all languages:
// success proves connectivity + quota, verbatim errors say which of
// quota / network / upstream is wrong when it fails.
function onSelfCheck() {
  runQuery(EXAMPLE, [...TARGET_CODES])
}
</script>

<style scoped>
.query-card { margin-bottom: 16px; }
.query-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.text-input { width: 340px; }
.lang-row { display: flex; gap: 10px; align-items: flex-start; margin-top: 16px; flex-wrap: wrap; }
.lang-label { color: var(--adm-text-2); font-size: 14px; line-height: 32px; }
.lang-group { display: flex; flex-wrap: wrap; gap: 2px 6px; max-width: 860px; }
.note { color: var(--adm-text-3); font-size: 13px; margin: 12px 0 0; }
.quota-alert { margin-bottom: 14px; }
.status-line { color: var(--adm-text-2); font-size: 14px; margin-bottom: 10px; }
.result-table { margin-top: 4px; }
.err-text { color: var(--el-color-danger); }
</style>
