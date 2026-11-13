<template>
  <div>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索品牌名或 ID" clearable style="width: 280px" @input="page = 1" />
      <el-button type="primary" @click="openCreate">新建品牌</el-button>
      <el-button @click="load">刷新</el-button>
      <el-button type="primary" plain @click="batchVisible = true">批量翻译未译名称</el-button>
    </div>

    <BatchTranslateDialog v-model="batchVisible" kind="brands" entityLabel="品牌" @done="load" />

    <el-table :data="paged" v-loading="loading" stripe>
      <el-table-column label="Logo" width="90">
        <template #default="{ row }">
          <el-image v-if="row.logo" :src="row.logo" class="thumb" fit="contain" />
          <span v-else class="no-img">无图</span>
        </template>
      </el-table-column>
      <el-table-column label="品牌名" min-width="220">
        <template #default="{ row }">{{ displayName(row.names) }}</template>
      </el-table-column>
      <el-table-column label="ID" width="160" prop="id" />
      <el-table-column label="商品数" width="100" prop="count" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" width="90" prop="sort" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="filtered.length" :page-size="20" v-model:current-page="page" />
    <el-empty v-if="!loading && rows.length === 0" description="暂无品牌，在商品里选品牌前先来这里建" />

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑品牌' : '新建品牌'"
      width="560px"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="品牌 ID">
          <el-input
            v-model="form.id"
            :disabled="!!editingId"
            placeholder="可留空自动生成；只允许字母、数字、- 和 _"
          />
        </el-form-item>
        <NamesFields :model="form.names" />
        <el-form-item label="Logo">
          <ImageField v-model="form.logo" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :step="1" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.active" />
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
import { displayName, emptyNames } from '../utils/names'
import NamesFields from '../components/NamesFields.vue'
import BatchTranslateDialog from '../components/BatchTranslateDialog.vue'
import ImageField from '../components/ImageField.vue'

const rows = ref([])
const keyword = ref('')
const page = ref(1)
const filtered = computed(() => {
  const term = keyword.value.trim().toLowerCase()
  return rows.value.filter(row => !term || (Object.values(row.names || {}).join(' ') + ' ' + row.id).toLowerCase().includes(term))
})
const paged = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const batchVisible = ref(false)
const editingId = ref('')
const form = reactive({ id: '', names: emptyNames(), logo: '', sort: 0, active: true })

async function load() {
  loading.value = true
  try {
    rows.value = (await api('/api/admin/brands')) || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = ''
  Object.assign(form, { id: '', names: emptyNames(), logo: '', sort: 0, active: true })
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    id: row.id,
    names: { ...emptyNames(), ...row.names },
    logo: row.logo || '',
    sort: row.sort || 0,
    active: row.active !== false
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!String(form.names.en || form.names.zh || '').trim()) {
    ElMessage.warning('品牌英文名/中文名至少填一个')
    return
  }
  saving.value = true
  try {
    const payload = { names: form.names, logo: form.logo, sort: form.sort, active: form.active }
    let r
    if (editingId.value) {
      r = await run(api(`/api/admin/brands/${encodeURIComponent(editingId.value)}`, {
        method: 'PUT', body: JSON.stringify(payload)
      }))
    } else {
      if (form.id.trim()) payload.id = form.id.trim()
      r = await run(api('/api/admin/brands', { method: 'POST', body: JSON.stringify(payload) }))
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
    await ElMessageBox.confirm(`确定删除品牌「${displayName(row.names)}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/brands/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) {
    ElMessage.success('已删除')
    load()
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.thumb { width: 56px; height: 36px; }
.no-img { color: var(--adm-text-3); font-size: 12px; }
</style>
