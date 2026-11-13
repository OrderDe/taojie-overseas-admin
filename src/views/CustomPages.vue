<template>
  <el-card v-loading="loading" class="pages-card">
    <!-- ===== List ===== -->
    <div v-if="!editing">
      <div class="toolbar">
        <el-button type="primary" @click="startCreate">新建页面</el-button>
        <el-button :disabled="loading" @click="load">重新加载</el-button>
      </div>
      <p class="help">
        自定义页面是你在后台自己维护的图文专页（比如「客户案例」「行业资讯」）。建好后到「导航管理」里
        把某个导航项的跳转类型选为「自定义页面」、目标选这个页面，前台点击导航就会打开它。
        路径（slug）是页面的地址标识，导航靠它认页，所以已有页面的路径不能改；页面隐藏后前台打不开（显示 404）。
      </p>
      <el-table :data="pages" border>
        <el-table-column label="页面标题" min-width="220">
          <template #default="{ row }">{{ displayTitle(row) }}</template>
        </el-table-column>
        <el-table-column label="路径 slug" width="180">
          <template #default="{ row }"><code>{{ row.slug }}</code></template>
        </el-table-column>
        <el-table-column label="排序" width="80">
          <template #default="{ row }">{{ row.sort }}</template>
        </el-table-column>
        <el-table-column label="显示" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '显示中' : '已隐藏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="190">
          <template #default="{ row }">{{ row.updatedAt || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170">
          <template #default="{ row }">
            <el-button size="small" @click="startEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>暂无自定义页面。点「新建页面」创建第一个（后端首次启动会自动生成一个「客户案例」样例页）。</template>
      </el-table>
    </div>

    <!-- ===== Editor ===== -->
    <div v-else>
      <div class="toolbar">
        <el-button type="primary" :loading="saving" @click="onSave">{{ isNew ? '创建页面' : '保存页面' }}</el-button>
        <el-button :disabled="saving" @click="editing = null">返回列表</el-button>
      </div>
      <el-form label-width="110px">
        <p class="field-label">页面标题</p>
        <NamesFields :model="draft.titles" />

        <el-form-item label="路径 slug">
          <el-input v-model="draft.slug" :disabled="!isNew" placeholder="如 cases、news、paint-zone" style="max-width: 420px" />
          <p class="help" style="margin: 4px 0 0">
            只能用小写字母、数字和连字符，2–61 位，以字母或数字开头（如 cases）。
            {{ isNew ? '创建后不能修改，因为导航按这个路径找页面。' : '已有页面的路径不可修改，避免导航引用失效。' }}
          </p>
        </el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="draft.enabled" />
          <span class="help" style="margin-left: 10px">关闭后前台打开这个页面会显示「页面不存在」。</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="draft.sort" :min="0" :max="9999" />
        </el-form-item>

        <el-divider content-position="left">内容区块</el-divider>
        <el-card v-for="(sec, si) in draft.sections" :key="sec._eid" class="section-card" shadow="never">
          <div class="section-head">
            <b>区块 {{ si + 1 }}</b>
            <span>
              <el-button size="small" :disabled="si === 0" @click="moveSection(si, -1)">上移</el-button>
              <el-button size="small" :disabled="si === draft.sections.length - 1" @click="moveSection(si, 1)">下移</el-button>
              <el-button size="small" type="danger" plain @click="draft.sections.splice(si, 1)">删除区块</el-button>
            </span>
          </div>

          <p class="field-label">标题</p>
          <NamesFields :model="sec.title" />

          <p class="field-label">正文（换行分段）</p>
          <!-- Multi-line counterpart of NamesFields, same pattern as the
               company-profile editor (zh/en first, rest collapsed). -->
          <el-form-item v-for="lang in PRIMARY" :key="'body-' + lang.code" :label="lang.label">
            <el-input v-model="sec.body[lang.code]" type="textarea" :rows="5" :placeholder="lang.label" />
          </el-form-item>
          <el-collapse v-model="bodyMore[sec._eid]" class="more-langs">
            <el-collapse-item title="更多语言" name="more">
              <el-form-item v-for="lang in MORE" :key="'body-more-' + lang.code" :label="lang.label">
                <el-input v-model="sec.body[lang.code]" type="textarea" :rows="5" :placeholder="lang.label" />
              </el-form-item>
            </el-collapse-item>
          </el-collapse>

          <p class="field-label">配图（可空）</p>
          <div class="img-row">
            <div class="img-main"><ImageField v-model="sec.image" /></div>
          </div>
        </el-card>
        <el-button type="primary" plain @click="addSection">添加区块</el-button>

        <el-divider content-position="left">图库</el-divider>
        <div v-for="(img, i) in draft.gallery" :key="'gallery-' + i" class="img-row">
          <div class="img-main"><ImageField v-model="draft.gallery[i]" /></div>
          <el-button type="danger" plain @click="draft.gallery.splice(i, 1)">删除</el-button>
        </div>
        <el-button @click="draft.gallery.push('')">添加图片</el-button>
      </el-form>
    </div>
  </el-card>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'
import ImageField from '../components/ImageField.vue'
import NamesFields from '../components/NamesFields.vue'
import { LANGS, langByCode } from '../utils/langs'

const PRIMARY_CODES = ['zh', 'en']
const PRIMARY = PRIMARY_CODES.map((c) => langByCode(c))
const MORE = LANGS.filter((l) => !PRIMARY_CODES.includes(l.code))
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/

const pages = ref([])
const loading = ref(false)
const saving = ref(false)
const editing = ref(null) // null = list; otherwise the draft being edited
const isNew = computed(() => !!editing.value && editing.value.id == null)
const draft = reactive({ id: null, slug: '', titles: {}, enabled: true, sort: 0, sections: [], gallery: [] })
const bodyMore = reactive({})
let eidSeq = 0

function namesObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {}
}
function moreState(map) {
  return MORE.some((l) => (map[l.code] || '').trim()) ? ['more'] : []
}
function displayTitle(row) {
  const t = namesObj(row && row.titles)
  return t.zh || t.en || Object.values(t).find((v) => String(v || '').trim()) || '(未命名)'
}

function normalizeSection(s) {
  const sec = {
    _eid: ++eidSeq,
    title: namesObj(s && s.title),
    body: namesObj(s && s.body),
    image: typeof (s && s.image) === 'string' ? s.image : ''
  }
  bodyMore[sec._eid] = moreState(sec.body)
  return sec
}

async function load() {
  loading.value = true
  try {
    pages.value = (await api('/api/admin/pages')) || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function fillDraft(page) {
  draft.id = page && page.id != null ? page.id : null
  draft.slug = String((page && page.slug) || '')
  draft.titles = namesObj(page && page.titles)
  draft.enabled = !page || page.enabled !== false
  draft.sort = Number((page && page.sort) || 0)
  draft.sections = (Array.isArray(page && page.sections) ? page.sections : []).map(normalizeSection)
  draft.gallery = (Array.isArray(page && page.gallery) ? page.gallery : []).filter((u) => typeof u === 'string')
}

function startCreate() {
  fillDraft(null)
  editing.value = draft
}
function startEdit(row) {
  fillDraft(row)
  editing.value = draft
}
function addSection() {
  draft.sections.push(normalizeSection({}))
}
function moveSection(index, direction) {
  const next = index + direction
  if (next < 0 || next >= draft.sections.length) return
  const tmp = draft.sections[index]
  draft.sections[index] = draft.sections[next]
  draft.sections[next] = tmp
}

function cleanNames(map) {
  const out = {}
  for (const [k, v] of Object.entries(map || {})) {
    if (typeof v === 'string' && v.trim()) out[k] = v
  }
  return out
}

async function onSave() {
  const slug = (draft.slug || '').trim()
  if (!SLUG_RE.test(slug)) {
    ElMessage.warning('路径 slug 格式不对：只能用小写字母、数字和连字符，2–61 位，以字母或数字开头')
    return
  }
  const titles = cleanNames(draft.titles)
  if (!Object.keys(titles).length) {
    ElMessage.warning('请至少填一个语言的页面标题')
    return
  }
  const payload = {
    slug,
    titles,
    sections: draft.sections.map((s) => ({
      title: cleanNames(s.title),
      body: cleanNames(s.body),
      image: (s.image || '').trim()
    })),
    gallery: draft.gallery.map((u) => (u || '').trim()).filter(Boolean),
    enabled: draft.enabled !== false,
    sort: Math.trunc(Number(draft.sort) || 0)
  }
  saving.value = true
  try {
    const r = await run(isNew.value
      ? api('/api/admin/pages', { method: 'POST', body: JSON.stringify(payload) })
      : api(`/api/admin/pages/${draft.id}`, { method: 'PUT', body: JSON.stringify(payload) }))
    if (r) {
      ElMessage.success(isNew.value ? '页面已创建' : '页面已保存')
      editing.value = null
      await load()
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除页面「${displayTitle(row)}」（${row.slug}）吗？指向它的导航项会打不开这个页面。`,
      '删除页面', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  } catch { return }
  const r = await run(api(`/api/admin/pages/${row.id}`, { method: 'DELETE' }))
  if (r) {
    ElMessage.success('页面已删除')
    await load()
  }
}

onMounted(load)
</script>

<style scoped>
.pages-card { max-width: 960px; }
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.help { color: var(--adm-text-3); font-size: 12px; line-height: 1.8; margin: 6px 0 16px; }
.img-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px; max-width: 680px; }
.img-main { flex: 1; }
.section-card { margin-bottom: 16px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.field-label { font-weight: 600; margin: 16px 0 8px; }
.more-langs { margin-bottom: 6px; border-top: none; }
</style>
