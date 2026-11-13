<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="品牌名" clearable style="width: 220px" @keyup.enter="reload" @clear="reload" />
      <el-button type="primary" @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新建品牌</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="品牌" min-width="180" prop="name" />
      <el-table-column label="首字母" width="90" prop="nameFirst" />
      <el-table-column label="国家" width="110" prop="country" />
      <el-table-column label="网址" min-width="220" prop="url" />
      <el-table-column label="排序" width="90" prop="letterRank" />
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
    <el-empty v-if="!loading && rows.length === 0" description="暂无汽车品牌数据" />
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑品牌' : '新建品牌'" width="540px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="品牌名" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="首字母"><el-input v-model="form.nameFirst" maxlength="2" /></el-form-item>
        <el-form-item label="国家"><el-input v-model="form.country" /></el-form-item>
        <el-form-item label="网址"><el-input v-model="form.url" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.letterRank" :step="1" /></el-form-item>
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

const ENTITY = '/api/admin/formula/car-brands'
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ name: '', nameFirst: '', country: '', url: '', letterRank: null, enable: true })

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: page.value, pageSize })
    if (keyword.value.trim()) qs.set('keyword', keyword.value.trim())
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
  Object.assign(form, { name: '', nameFirst: '', country: '', url: '', letterRank: null, enable: true })
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name || '', nameFirst: row.nameFirst || '', country: row.country || '',
    url: row.url || '', letterRank: row.letterRank ?? null, enable: row.enable !== false
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!form.name.trim()) { ElMessage.warning('品牌名必填'); return }
  saving.value = true
  try {
    const payload = { name: form.name, nameFirst: form.nameFirst, country: form.country, url: form.url, letterRank: form.letterRank, enable: form.enable }
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
    await ElMessageBox.confirm(`确定删除汽车品牌「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`${ENTITY}/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) { ElMessage.success('已删除'); load() }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
</style>
