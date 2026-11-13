<template>
  <div>
    <el-tabs v-model="activeTab" @tab-change="onTab">
      <el-tab-pane v-for="cfg in CONFIGS" :key="cfg.key" :label="cfg.label" :name="cfg.key" />
    </el-tabs>

    <div class="toolbar">
      <el-input v-model="keyword" :placeholder="current.searchPh" clearable style="width: 220px" @keyup.enter="reload" @clear="reload" />
      <el-button type="primary" @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新建{{ current.label }}</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column v-for="f in current.fields" :key="f.key" :label="f.label" :min-width="f.width || 130">
        <template #default="{ row }">
          <el-image v-if="f.type === 'image' && row[f.key]" :src="row[f.key]" class="thumb" fit="contain" />
          <el-tag v-else-if="f.type === 'switch'" :type="row[f.key] ? 'success' : 'info'">{{ row[f.key] ? '启用' : '停用' }}</el-tag>
          <span v-else>{{ row[f.key] ?? '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" :description="`暂无${current.label}数据`" />
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="`${editingId ? '编辑' : '新建'}${current.label}`" width="540px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item v-for="f in current.fields" :key="f.key" :label="f.label">
          <el-switch v-if="f.type === 'switch'" v-model="form[f.key]" />
          <el-input-number v-else-if="f.type === 'number'" v-model="form[f.key]" :step="1" />
          <ImageField v-else-if="f.type === 'image'" v-model="form[f.key]" />
          <el-input v-else v-model="form[f.key]" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'
import ImageField from '../components/ImageField.vue'

// Tabbed simple-CRUD over the formula dictionary entities; each tab is
// a field config driving both the table and the dialog, against the
// backend's config-driven /api/admin/formula/<entity> endpoints.
const CONFIGS = [
  {
    key: 'car-countries', label: '国家', searchPh: '国家 / 英文名',
    fields: [
      { key: 'name', label: '国家', width: 150 }, { key: 'nameEn', label: '英文名', width: 150 },
      { key: 'language', label: '语言', width: 110 }, { key: 'code', label: '编码', type: 'number', width: 90 },
      { key: 'state', label: '状态', type: 'number', width: 90 }, { key: 'sortRank', label: '排序', type: 'number', width: 90 },
      { key: 'enable', label: '启用', type: 'switch', width: 86 }
    ]
  },
  {
    key: 'car-factories', label: '生产商', searchPh: '生产商名',
    fields: [
      { key: 'name', label: '生产商', width: 180 }, { key: 'brandId', label: '品牌 ID', type: 'number', width: 110 },
      { key: 'country', label: '国家', width: 120 }, { key: 'state', label: '状态', type: 'number', width: 90 },
      { key: 'sortRank', label: '排序', type: 'number', width: 90 }, { key: 'enable', label: '启用', type: 'switch', width: 86 }
    ]
  },
  {
    key: 'color-cards', label: '色卡', searchPh: '名称 / 编码',
    fields: [
      { key: 'name', label: '名称', width: 200 }, { key: 'code', label: '编码', width: 160 },
      { key: 'enable', label: '启用', type: 'switch', width: 86 }
    ]
  },
  {
    key: 'color-brands', label: '产品品牌', searchPh: '品牌名',
    fields: [
      { key: 'name', label: '品牌', width: 200 }, { key: 'logo', label: 'Logo', type: 'image', width: 130 },
      { key: 'enable', label: '启用', type: 'switch', width: 86 }
    ]
  }
]

const activeTab = ref(CONFIGS[0].key)
const current = computed(() => CONFIGS.find((c) => c.key === activeTab.value) || CONFIGS[0])
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({})

function resetForm(source = {}) {
  for (const k of Object.keys(form)) delete form[k]
  for (const f of current.value.fields) {
    if (f.type === 'switch') form[f.key] = source[f.key] === undefined ? true : !!source[f.key]
    else if (f.type === 'number') form[f.key] = source[f.key] ?? null
    else form[f.key] = source[f.key] || ''
  }
}

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: page.value, pageSize })
    if (keyword.value.trim()) qs.set('keyword', keyword.value.trim())
    const r = await api(`/api/admin/formula/${current.value.key}?${qs}`)
    rows.value = r?.list || []
    total.value = r?.total || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
function reload() { page.value = 1; load() }
function onTab() { keyword.value = ''; page.value = 1; load() }

function openCreate() {
  editingId.value = ''
  resetForm()
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  resetForm(row)
  dialogVisible.value = true
}

async function onSave() {
  saving.value = true
  try {
    const payload = { ...form }
    const base = `/api/admin/formula/${current.value.key}`
    const r = editingId.value
      ? await run(api(`${base}/${encodeURIComponent(editingId.value)}`, { method: 'PUT', body: JSON.stringify(payload) }))
      : await run(api(base, { method: 'POST', body: JSON.stringify(payload) }))
    if (r) { ElMessage.success('已保存'); dialogVisible.value = false; load() }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除这条${current.value.label}数据吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/formula/${current.value.key}/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) { ElMessage.success('已删除'); load() }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.thumb { width: 56px; height: 36px; }
</style>
