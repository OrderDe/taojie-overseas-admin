<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="色号 / 颜色名" clearable style="width: 240px" @keyup.enter="reload" @clear="reload" />
      <el-button type="primary" @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新建色号</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="ID" width="90" prop="id" show-overflow-tooltip />
      <el-table-column label="色号" min-width="150" prop="name" />
      <el-table-column label="颜色名" min-width="200" prop="colorName" />
      <el-table-column label="LAB" min-width="190">
        <template #default="{ row }">
          <span v-if="row.labL !== null && row.labL !== undefined">L {{ row.labL }} · a {{ row.labA }} · b {{ row.labB }}</span>
          <span v-else class="no-img">未测</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="86">
        <template #default="{ row }">
          <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170" prop="updateTime" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" plain @click="openLines(row)">配方行</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无色号数据" />
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑色号' : '新建色号'" width="540px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="色号" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="颜色名"><el-input v-model="form.colorName" /></el-form-item>
        <el-form-item label="LAB L"><el-input-number v-model="form.labL" :step="1" controls-position="right" style="width: 100%" /></el-form-item>
        <el-form-item label="LAB a"><el-input-number v-model="form.labA" :step="1" controls-position="right" style="width: 100%" /></el-form-item>
        <el-form-item label="LAB b"><el-input-number v-model="form.labB" :step="1" controls-position="right" style="width: 100%" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enable" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" :title="`配方行 · ${drawerNumber?.name || ''}`" size="640px" destroy-on-close>
      <el-table :data="lines" v-loading="linesLoading" stripe>
        <el-table-column label="色母（型号 — 名称）" min-width="250">
          <template #default="{ row }">
            <el-select
              v-model="row.model"
              filterable
              size="small"
              placeholder="选择色母（可按型号/名称搜索）"
              style="width: 100%"
              @change="(v) => onMasterbatchChange(row, v)"
            >
              <el-option
                v-for="m in masterbatchOptionsFor(row)"
                :key="m.model"
                :label="`${m.model} — ${m.name}`"
                :value="m.model"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="剂量" width="130">
          <template #default="{ row }"><el-input-number v-model="row.dose" size="small" :step="0.1" :min="0" controls-position="right" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="顺序" width="100">
          <template #default="{ row }"><el-input-number v-model="row.colorRank" size="small" :step="1" :min="1" controls-position="right" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="" width="70">
          <template #default="{ $index }">
            <el-button size="small" type="danger" @click="lines.splice($index, 1)">删</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="drawer-actions">
        <el-button @click="lines.push({ model: '', name: '', dose: 0, colorRank: lines.length + 1 })">添加一行</el-button>
        <span class="dose-total">剂量合计 {{ doseTotal.toFixed(1) }}</span>
      </div>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="linesSaving" @click="onSaveLines">保存配方行（整体替换）</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ name: '', colorName: '', labL: null, labA: null, labB: null, enable: true })

const drawerVisible = ref(false)
const drawerNumber = ref(null)
const lines = ref([])
const linesLoading = ref(false)
const linesSaving = ref(false)
const doseTotal = computed(() => lines.value.reduce((s, l) => s + (Number(l.dose) || 0), 0))

// Masterbatch picker for formula lines (bug #13): options come from
// the masterbatch library, ENABLED rows only (the API exposes enable
// as a boolean); picking one fills both the stored model and name.
const masterbatches = ref([])

async function loadMasterbatches() {
  try {
    const all = []
    let p = 1
    for (;;) {
      const r = await api(`/api/admin/formula/masterbatches?page=${p}&pageSize=200`)
      all.push(...(r?.list || []))
      if (all.length >= (r?.total || 0) || !(r?.list || []).length) break
      p++
    }
    masterbatches.value = all
      .filter((m) => m.enable === true && m.model)
      .map((m) => ({ model: String(m.model), name: m.name || '' }))
  } catch { /* picker stays empty; lines keep their stored values */ }
}

function masterbatchOptionsFor(row) {
  const opts = [...masterbatches.value]
  // Echo for legacy lines whose masterbatch is disabled/deleted since:
  // surface the stored pair as a fallback option so the select can
  // still display (and keep) it.
  if (row.model && !opts.some((m) => m.model === String(row.model))) {
    opts.unshift({ model: String(row.model), name: row.name || '' })
  }
  return opts
}

function onMasterbatchChange(row, model) {
  const found = masterbatches.value.find((m) => m.model === String(model))
  if (found) row.name = found.name
}

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: page.value, pageSize })
    if (keyword.value.trim()) qs.set('keyword', keyword.value.trim())
    const r = await api(`/api/admin/formula-numbers?${qs}`)
    rows.value = r?.list || []
    total.value = r?.total || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
function reload() { page.value = 1; load() }

function openCreate() {
  editingId.value = ''
  Object.assign(form, { name: '', colorName: '', labL: null, labA: null, labB: null, enable: true })
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name || '', colorName: row.colorName || '',
    labL: row.labL ?? null, labA: row.labA ?? null, labB: row.labB ?? null,
    enable: row.enable !== false
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!form.name.trim()) { ElMessage.warning('色号必填'); return }
  saving.value = true
  try {
    const payload = { name: form.name, colorName: form.colorName, labL: form.labL, labA: form.labA, labB: form.labB, enable: form.enable }
    const r = editingId.value
      ? await run(api(`/api/admin/formula-numbers/${encodeURIComponent(editingId.value)}`, { method: 'PUT', body: JSON.stringify(payload) }))
      : await run(api('/api/admin/formula-numbers', { method: 'POST', body: JSON.stringify(payload) }))
    if (r) { ElMessage.success('已保存'); dialogVisible.value = false; load() }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除色号「${row.name}」吗？有配方行的色号会被后端拦下、删不了。`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/formula-numbers/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) { ElMessage.success('已删除'); load() }
}

async function openLines(row) {
  drawerNumber.value = row
  drawerVisible.value = true
  loadMasterbatches()
  linesLoading.value = true
  try {
    const r = await api(`/api/admin/formula-numbers/${encodeURIComponent(row.id)}/lines`)
    lines.value = (r?.lines || []).map((l) => ({ model: l.model || '', name: l.name || '', dose: Number(l.dose) || 0, colorRank: Number(l.colorRank) || 1 }))
  } catch (e) {
    ElMessage.error(e.message)
    lines.value = []
  } finally {
    linesLoading.value = false
  }
}

async function onSaveLines() {
  linesSaving.value = true
  try {
    const payload = { lines: lines.value.map((l) => ({ model: l.model, name: l.name, dose: Number(l.dose) || 0, colorRank: Number(l.colorRank) || 1 })) }
    const r = await run(api(`/api/admin/formula-numbers/${encodeURIComponent(drawerNumber.value.id)}/lines`, { method: 'PUT', body: JSON.stringify(payload) }))
    if (r) {
      ElMessage.success('配方行已保存')
      lines.value = (r.lines || []).map((l) => ({ model: l.model || '', name: l.name || '', dose: Number(l.dose) || 0, colorRank: Number(l.colorRank) || 1 }))
    }
  } finally {
    linesSaving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.no-img { color: var(--adm-text-3); font-size: 12px; }
.drawer-actions { display: flex; gap: 14px; align-items: center; margin-top: 14px; }
.dose-total { color: var(--adm-text-3); font-size: 13px; }
</style>
