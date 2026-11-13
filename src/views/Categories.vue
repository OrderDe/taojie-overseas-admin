<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建分类</el-button>
      <el-button @click="load">刷新</el-button>
      <el-button type="primary" plain @click="batchVisible = true">批量翻译未译名称</el-button>
    </div>

    <BatchTranslateDialog v-model="batchVisible" kind="categories" entityLabel="分类" @done="load" />

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="分类名" min-width="240">
        <template #default="{ row }">{{ displayName(row.names) }}</template>
      </el-table-column>
      <el-table-column label="ID" width="170" prop="id" />
      <el-table-column label="商品数" width="100" prop="count" />
      <el-table-column label="排序" width="90" prop="sort" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无分类" />

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分类' : '新建分类'"
      width="560px"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="分类 ID">
          <el-input
            v-model="form.id"
            :disabled="!!editingId"
            placeholder="可留空自动生成；只允许字母、数字、- 和 _"
          />
        </el-form-item>
        <NamesFields :model="form.names" />
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :step="1" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'
import { displayName, emptyNames } from '../utils/names'
import NamesFields from '../components/NamesFields.vue'
import BatchTranslateDialog from '../components/BatchTranslateDialog.vue'

const rows = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const batchVisible = ref(false)
const editingId = ref('')
const form = reactive({ id: '', names: emptyNames(), sort: 0 })

async function load() {
  loading.value = true
  try {
    rows.value = (await api('/api/admin/categories')) || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = ''
  Object.assign(form, { id: '', names: emptyNames(), sort: 0 })
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    id: row.id,
    names: { ...emptyNames(), ...row.names },
    sort: row.sort || 0
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!String(form.names.en || form.names.zh || '').trim()) {
    ElMessage.warning('分类英文名/中文名至少填一个')
    return
  }
  saving.value = true
  try {
    const payload = { names: form.names, sort: form.sort }
    let r
    if (editingId.value) {
      r = await run(api(`/api/admin/categories/${encodeURIComponent(editingId.value)}`, {
        method: 'PUT', body: JSON.stringify(payload)
      }))
    } else {
      if (form.id.trim()) payload.id = form.id.trim()
      r = await run(api('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) }))
    }
    if (r) {
      ElMessage.success('已保存')
      dialogVisible.value = false
      load()
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除分类「${displayName(row.names)}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/categories/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) {
    ElMessage.success('已删除')
    load()
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
</style>
