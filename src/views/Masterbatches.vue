<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="型号 / 名称 / 英文名" clearable style="width: 240px" @keyup.enter="reload" @clear="reload" />
      <el-button type="primary" @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新建色母</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="型号" min-width="130" prop="model" />
      <el-table-column label="名称" min-width="170" prop="name" />
      <el-table-column label="英文名" min-width="190" prop="engName" />
      <el-table-column label="类型" width="100" prop="type" />
      <el-table-column label="备注" min-width="140" prop="mark" />
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
    <el-empty v-if="!loading && rows.length === 0" description="暂无色母数据" />
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑色母' : '新建色母'" width="540px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="型号" required><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="英文名" required><el-input v-model="form.engName" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="form.type" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.mark" /></el-form-item>
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

const ENTITY = '/api/admin/formula/masterbatches'
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ model: '', name: '', engName: '', type: '', mark: '', enable: true })

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
  Object.assign(form, { model: '', name: '', engName: '', type: '', mark: '', enable: true })
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    model: row.model || '', name: row.name || '', engName: row.engName || '',
    type: row.type || '', mark: row.mark || '', enable: row.enable !== false
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!form.model.trim() || !form.name.trim() || !form.engName.trim()) {
    ElMessage.warning('型号、名称、英文名必填')
    return
  }
  saving.value = true
  try {
    const payload = { model: form.model, name: form.name, engName: form.engName, type: form.type, mark: form.mark, enable: form.enable }
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
    await ElMessageBox.confirm(`确定删除色母「${row.model} ${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`${ENTITY}/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) { ElMessage.success('已删除'); load() }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
</style>
