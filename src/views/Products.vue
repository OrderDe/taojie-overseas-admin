<template>
  <div>
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索商品名"
        clearable
        style="width: 240px"
        @input="page = 1"
      />
      <el-select v-model="filterCategory" placeholder="全部分类" clearable style="width: 180px">
        <el-option
          v-for="c in categories"
          :key="c.id"
          :label="displayName(c.names)"
          :value="c.id"
        />
      </el-select>
      <el-select v-model="filterBrand" placeholder="全部品牌" clearable style="width: 180px">
        <el-option
          v-for="b in brands"
          :key="b.id"
          :label="displayName(b.names)"
          :value="b.id"
        />
      </el-select>
      <el-button type="primary" @click="openCreate">新建商品</el-button>
      <el-button @click="loadAll">刷新</el-button>
    </div>

    <el-table :data="paged" v-loading="loading" stripe>
      <el-table-column label="图片" width="76">
        <template #default="{ row }">
          <el-image v-if="row.image" :src="row.image" class="thumb" fit="cover" />
          <span v-else class="no-img">无图</span>
        </template>
      </el-table-column>
      <el-table-column label="商品名" min-width="220">
        <template #default="{ row }">{{ displayName(row.names) }}</template>
      </el-table-column>
      <el-table-column label="分类" width="150">
        <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
      </el-table-column>
      <el-table-column label="品牌" width="130">
        <template #default="{ row }">{{ brandName(row.brandId) }}</template>
      </el-table-column>
      <el-table-column label="价格 (USD)" width="110">
        <template #default="{ row }">${{ row.price }}</template>
      </el-table-column>
      <el-table-column label="MOQ" width="80" prop="moq" />
      <el-table-column label="销量" width="80" prop="sales" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pager"
      layout="total, prev, pager, next"
      :total="filtered.length"
      :page-size="pageSize"
      v-model:current-page="page"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑商品' : '新建商品'"
      width="720px"
      destroy-on-close
    >
      <el-form :model="form" label-width="110px">
        <NamesFields :model="form.names" />
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="displayName(c.names)"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌">
          <el-select v-model="form.brandId" placeholder="无品牌" clearable style="width: 100%">
            <el-option
              v-for="b in brands"
              :key="b.id"
              :label="displayName(b.names)"
              :value="b.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="价格 (USD)">
              <el-input-number v-model="form.price" :min="0" :precision="2" :step="0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="原价 (USD)">
              <el-input-number v-model="form.otPrice" :min="0" :precision="2" :step="0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="MOQ">
              <el-input-number v-model="form.moq" :min="0" :step="1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="pc / carton" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="销量">
              <el-input-number v-model="form.sales" :min="0" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :step="1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角标">
          <el-input v-model="form.tag" placeholder="如 Hot / New" />
        </el-form-item>
        <el-form-item label="来源 ID">
          <el-input v-model="form.sourceId" placeholder="tjmall 商品 id，可留空（自动生成）" />
        </el-form-item>
        <el-form-item label="图片">
          <ImageField v-model="form.image" />
        </el-form-item>
        <el-form-item label="视频">
          <VideoField v-model="form.video" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.blurb" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="规格参数">
          <el-input
            v-model="specsText"
            type="textarea"
            :rows="3"
            placeholder="每行一条，如：&#10;Mix ratio: 2 : 1&#10;Pack size: 1 L / 4 L"
          />
        </el-form-item>
        <el-form-item label="上架">
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
import { displayName, emptyNames, specsToText, textToSpecs } from '../utils/names'
import NamesFields from '../components/NamesFields.vue'
import ImageField from '../components/ImageField.vue'
import VideoField from '../components/VideoField.vue'

const products = ref([])
const categories = ref([])
const brands = ref([])
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const filterCategory = ref('')
const filterBrand = ref('')
const page = ref(1)
const pageSize = 20

const dialogVisible = ref(false)
const specsText = ref('')
const form = reactive(blankForm())

function blankForm() {
  return {
    id: null, sourceId: '', categoryId: '', brandId: '', names: emptyNames(),
    price: 0, otPrice: 0, sales: 0, unit: 'pc', moq: 0, image: '', video: '', tag: '',
    blurb: '', sort: 0, active: true
  }
}

const categoryName = (id) => {
  const c = categories.value.find((x) => x.id === id)
  return c ? displayName(c.names) : (id || '-')
}
const brandName = (id) => {
  const b = brands.value.find((x) => x.id === id)
  return b ? displayName(b.names) : (id || '-')
}

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return products.value.filter((p) => {
    if (filterCategory.value && p.categoryId !== filterCategory.value) return false
    if (filterBrand.value && p.brandId !== filterBrand.value) return false
    if (kw && !Object.values(p.names || {}).join(' ').toLowerCase().includes(kw)) return false
    return true
  })
})
const paged = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize)
)

async function loadAll() {
  loading.value = true
  try {
    const [ps, cs, bs] = await Promise.all([
      api('/api/admin/products'),
      api('/api/admin/categories'),
      api('/api/admin/brands')
    ])
    products.value = ps || []
    categories.value = cs || []
    brands.value = bs || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  Object.assign(form, blankForm())
  specsText.value = ''
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, blankForm(), JSON.parse(JSON.stringify(row)), { names: { ...emptyNames(), ...row.names } })
  specsText.value = specsToText(row.specs)
  dialogVisible.value = true
}

async function onSave() {
  if (!String(form.names.en || form.names.zh || '').trim()) {
    ElMessage.warning('商品英文名/中文名至少填一个')
    return
  }
  saving.value = true
  try {
    const payload = { ...form, specs: textToSpecs(specsText.value) }
    delete payload.id
    const r = await run(form.id
      ? api(`/api/admin/products/${form.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) }))
    if (r) {
      ElMessage.success('已保存')
      dialogVisible.value = false
      loadAll()
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除商品「${displayName(row.names)}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/products/${row.id}`, { method: 'DELETE' }))
  if (r) {
    ElMessage.success('已删除')
    loadAll()
  }
}

onMounted(loadAll)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.thumb { width: 52px; height: 40px; border-radius: 4px; }
.no-img { color: var(--adm-text-3); font-size: 12px; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
