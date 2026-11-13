<template>
  <div>
    <div class="toolbar">
      <el-select v-model="filterBrand" placeholder="全部品牌" clearable filterable style="width: 200px" @change="onFilterBrand">
        <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
      </el-select>
      <el-select v-model="filterModel" placeholder="全部车型" clearable filterable style="width: 200px" @change="reload">
        <el-option v-for="m in filterModelOptions" :key="m.id" :label="m.model" :value="m.id" />
      </el-select>
      <el-input v-model="keyword" placeholder="颜色 / 色号 / 出厂色号 / 色卡号" clearable style="width: 260px" @keyup.enter="reload" @clear="reload" />
      <el-button type="primary" @click="reload">搜索</el-button>
      <el-button type="primary" plain @click="openCreate">新建颜色</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="车型图" width="96">
        <template #default="{ row }">
          <el-image v-if="row.carImage" :src="row.carImage" class="thumb" fit="cover" />
          <span v-else class="no-img">无图</span>
        </template>
      </el-table-column>
      <el-table-column label="品牌" min-width="120">
        <template #default="{ row }">{{ brandName(row.brandId) }}</template>
      </el-table-column>
      <el-table-column label="车型" min-width="130">
        <template #default="{ row }">{{ modelName(row.modelId) }}</template>
      </el-table-column>
      <el-table-column label="颜色" min-width="170" prop="carColor" />
      <el-table-column label="色号" width="130" prop="colorNum" />
      <el-table-column label="出厂色号" width="120" prop="factoryColor" />
      <el-table-column label="状态" width="86">
        <template #default="{ row }">
          <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="170" prop="updateTime" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无颜色数据，可用后端 tools/import-sfsy.js 导入 sfsy 数据" />
    <el-pagination style="margin-top: 14px" layout="total, prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="load" />

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑颜色' : '新建颜色'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="品牌" required>
          <el-select v-model="form.brandId" filterable placeholder="选择品牌" style="width: 100%" @change="form.modelId = ''">
            <el-option v-for="b in brandOptions" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型" required>
          <el-select v-model="form.modelId" filterable placeholder="选择车型" style="width: 100%">
            <el-option v-for="m in formModelOptions" :key="m.id" :label="m.model" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色"><el-input v-model="form.carColor" /></el-form-item>
        <el-form-item label="色号"><el-input v-model="form.colorNum" /></el-form-item>
        <el-form-item label="出厂色号"><el-input v-model="form.factoryColor" /></el-form-item>
        <el-form-item label="色卡编号"><el-input v-model="form.cardNum" /></el-form-item>
        <el-form-item label="车型图"><ImageField v-model="form.carImage" /></el-form-item>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'
import ImageField from '../components/ImageField.vue'

const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const filterBrand = ref('')
const filterModel = ref('')
const brandOptions = ref([])
const modelOptions = ref([])
const dialogVisible = ref(false)
const editingId = ref('')
const form = reactive({ brandId: '', modelId: '', carColor: '', factoryColor: '', colorNum: '', cardNum: '', carImage: '', enable: true })

const filterModelOptions = computed(() => filterBrand.value
  ? modelOptions.value.filter((m) => m.brandId === filterBrand.value)
  : modelOptions.value)
const formModelOptions = computed(() => form.brandId
  ? modelOptions.value.filter((m) => m.brandId === form.brandId)
  : modelOptions.value)
const brandName = (id) => brandOptions.value.find((b) => b.id === String(id))?.name || id || ''
const modelName = (id) => modelOptions.value.find((m) => m.id === String(id))?.model || id || ''

async function loadOptions() {
  try {
    const [brands, models] = await Promise.all([api('/api/formula/brands'), api('/api/formula/models')])
    brandOptions.value = (brands || []).map((b) => ({ id: String(b.id), name: b.name }))
    modelOptions.value = (models || []).map((m) => ({ id: String(m.id), brandId: String(m.brandId), model: m.model }))
  } catch { /* options stay empty; ids still display */ }
}

async function load() {
  loading.value = true
  try {
    const qs = new URLSearchParams({ page: page.value, pageSize })
    if (keyword.value.trim()) qs.set('keyword', keyword.value.trim())
    if (filterBrand.value) qs.set('brandId', filterBrand.value)
    if (filterModel.value) qs.set('modelId', filterModel.value)
    const r = await api(`/api/admin/formula/car-colors?${qs}`)
    rows.value = r?.list || []
    total.value = r?.total || 0
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
function reload() { page.value = 1; load() }
function onFilterBrand() { filterModel.value = ''; reload() }

function openCreate() {
  editingId.value = ''
  Object.assign(form, { brandId: '', modelId: '', carColor: '', factoryColor: '', colorNum: '', cardNum: '', carImage: '', enable: true })
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    brandId: String(row.brandId ?? ''), modelId: String(row.modelId ?? ''),
    carColor: row.carColor || '', factoryColor: row.factoryColor || '',
    colorNum: row.colorNum || '', cardNum: row.cardNum || '',
    carImage: row.carImage || '', enable: row.enable !== false
  })
  dialogVisible.value = true
}

async function onSave() {
  if (!form.brandId || !form.modelId) { ElMessage.warning('品牌和车型必选'); return }
  saving.value = true
  try {
    const payload = {
      // ids travel as strings on purpose: model ids can be snowflakes
      // beyond a JS number's exact range; the backend binds them exactly.
      brandId: form.brandId, modelId: form.modelId,
      carColor: form.carColor, factoryColor: form.factoryColor,
      colorNum: form.colorNum, cardNum: form.cardNum,
      carImage: form.carImage, enable: form.enable
    }
    const r = editingId.value
      ? await run(api(`/api/admin/formula/car-colors/${encodeURIComponent(editingId.value)}`, { method: 'PUT', body: JSON.stringify(payload) }))
      : await run(api('/api/admin/formula/car-colors', { method: 'POST', body: JSON.stringify(payload) }))
    if (r) { ElMessage.success('已保存'); dialogVisible.value = false; load() }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除颜色「${row.carColor || row.colorNum || row.id}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/formula/car-colors/${encodeURIComponent(row.id)}`, { method: 'DELETE' }))
  if (r) { ElMessage.success('已删除'); load() }
}

onMounted(async () => { await loadOptions(); load() })
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.thumb { width: 64px; height: 44px; }
.no-img { color: var(--adm-text-3); font-size: 12px; }
</style>
