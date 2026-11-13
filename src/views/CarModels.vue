<template>
  <div>
    <div class="toolbar">
      <el-select v-model="filterBrand" placeholder="全部品牌" clearable filterable style="width: 200px" @change="reload">
        <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
      </el-select>
      <el-input v-model="keyword" placeholder="车型 / 品牌" clearable style="width: 220px" @keyup.enter="reload" @clear="reload" />
      <el-button type="primary" @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新建车型</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="车型" min-width="200" prop="model" />
      <el-table-column label="品牌" min-width="160">
        <template #default="{ row }">{{ brandName(row.brandId) || row.brand || '' }}</template>
      </el-table-column>
      <el-table-column label="排序" width="90" prop="sortRank" />
      <el-table-column label="状态" width="86">
        <template #default="{ row }">
          <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无车型数据" />
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑车型' : '新建车型'" width="540px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="品牌">
          <el-select v-model="form.brandId" filterable clearable placeholder="选择品牌" style="width: 100%">
            <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌名"><el-input v-model="form.brand" placeholder="源数据自带的品牌文本，可空" /></el-form-item>
        <el-form-item label="车型" required><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortRank" :step="1" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.enable" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'

const ENTITY = '/api/admin/formula/car-models'
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const filterBrand = ref('')
const brandOptions = ref([])
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ brand: '', brandId: '', model: '', sortRank: null, enable: true })

const brandName = (id) => brandOptions.value.find((b) => b.id === String(id))?.name || ''

async function loadOptions() {
  try {
    // All brands (incl. disabled) for the pickers: page through the
    // admin list at its max page size.
    const all = []
    let p = 1
    for (;;) {
      const r = await api(`/api/admin/formula/car-brands?page=${p}&pageSize=200`)
      all.push(...(r?.list || []))
      if (all.length >= (r?.total || 0) || !(r?.list || []).length) break
      p++
    }
    brandOptions.value = all.map((b) => ({ id: String(b.id), name: b.name }))
  } catch { /* pickers stay empty; rows still show the stored brand text */ }
}

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: page.value, pageSize })
    if (keyword.value.trim()) qs.set('keyword', keyword.value.trim())
    if (filterBrand.value) qs.set('brandId', filterBrand.value)
    const r = await api(`${ENTITY}?${qs}`)
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
  Object.assign(form, { brand: '', brandId: filterBrand.value || '', model: '', sortRank: null, enable: true })
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    brand: row.brand || '', brandId: row.brandId != null ? String(row.brandId) : '',
    model: row.model || '', sortRank: row.sortRank ?? null, enable: row.enable !== false
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!form.model.trim()) { ElMessage.warning('车型必填'); return }
  saving.value = true
  try {
    const payload = {
      brand: form.brand, model: form.model, sortRank: form.sortRank, enable: form.enable,
      brandId: form.brandId ? form.brandId : null
    }
    const r = editingId.value
      ? await run(api(`${ENTITY}/${encodeURIComponent(editingId.value)}`, { method: 'PUT', body: JSON.stringify(payload) }))
      : await run(api(ENTITY, { method: 'POST', body: JSON.stringify(payload) }))
    if (r) { ElMessage.success('已保存'); dialogVisible.value = false; load() }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除车型「${row.model}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`${ENTITY}/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) { ElMessage.success('已删除'); load() }
}

onMounted(async () => { await loadOptions(); load() })
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
</style>
