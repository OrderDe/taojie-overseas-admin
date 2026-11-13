<template>
  <el-card v-loading="loading" class="footer-card">
    <div class="toolbar">
      <el-button type="primary" :loading="saving" :disabled="loading || !loaded" @click="onSave">保存页脚</el-button>
      <el-button :disabled="saving" @click="load">重新加载</el-button>
    </div>
    <p class="help">
      前台最下方页脚的内容：品牌介绍、链接列、说明与版权文案。文字可填 12 种语言，前台按客人当前语言显示，
      缺的语言自动用英文、再用第一个已填语言兜底。版权文案里的 {year} 会被前台替换成当前年份。
      链接的跳转方式与顶部导航一致：跳分类 / 跳页面区块 / 打开自定义页面 / 打开外链；选「仅文字」则不可点击。
      跳分类时不选具体分类 = 前台按链接名称自动匹配同名分类，匹配不到时只显示文字。
      这里全部清空时，前台回退到内置的默认页脚，不会空白。最多 4 列、每列最多 10 条链接。
    </p>

    <el-form label-width="110px">
      <el-divider content-position="left">品牌介绍（页脚左列，品牌名下方）</el-divider>
      <el-form-item v-for="lang in PRIMARY" :key="'blurb-' + lang.code" :label="lang.label">
        <el-input v-model="blurb[lang.code]" type="textarea" :rows="3" :placeholder="lang.label" />
      </el-form-item>
      <el-collapse v-model="blurbMore" class="more-langs">
        <el-collapse-item title="更多语言" name="more">
          <el-form-item v-for="lang in MORE" :key="'blurb-more-' + lang.code" :label="lang.label">
            <el-input v-model="blurb[lang.code]" type="textarea" :rows="3" :placeholder="lang.label" />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <el-divider content-position="left">说明（页脚右列）</el-divider>
      <el-form-item v-for="lang in PRIMARY" :key="'note-' + lang.code" :label="lang.label">
        <el-input v-model="note[lang.code]" type="textarea" :rows="3" :placeholder="lang.label" />
      </el-form-item>
      <el-collapse v-model="noteMore" class="more-langs">
        <el-collapse-item title="更多语言" name="more">
          <el-form-item v-for="lang in MORE" :key="'note-more-' + lang.code" :label="lang.label">
            <el-input v-model="note[lang.code]" type="textarea" :rows="3" :placeholder="lang.label" />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <el-divider content-position="left">版权文案（页脚最底部一行，{year} = 当前年份）</el-divider>
      <NamesFields :model="copyright" />

      <el-divider content-position="left">链接列</el-divider>
      <el-card v-for="(col, ci) in columns" :key="col._eid" class="column-card" shadow="never">
        <div class="column-head">
          <b>第 {{ ci + 1 }} 列</b>
          <span>
            <el-button size="small" :disabled="ci === 0" @click="moveItem(columns, ci, -1)">上移</el-button>
            <el-button size="small" :disabled="ci === columns.length - 1" @click="moveItem(columns, ci, 1)">下移</el-button>
            <el-button size="small" type="danger" plain @click="columns.splice(ci, 1)">删除列</el-button>
          </span>
        </div>

        <p class="field-label">列标题</p>
        <NamesFields :model="col.title" />

        <p class="field-label">链接</p>
        <div v-for="(link, li) in col.links" :key="link._eid" class="link-block">
          <div class="link-head">
            <span>链接 {{ li + 1 }}</span>
            <span>
              <el-button size="small" :disabled="li === 0" @click="moveItem(col.links, li, -1)">上移</el-button>
              <el-button size="small" :disabled="li === col.links.length - 1" @click="moveItem(col.links, li, 1)">下移</el-button>
              <el-button size="small" type="danger" plain @click="col.links.splice(li, 1)">删除链接</el-button>
            </span>
          </div>
          <NamesFields :model="link.labels" />
          <el-form-item label="跳转方式">
            <el-select v-model="link.type" style="width: 220px">
              <el-option label="仅文字（不可点）" value="" />
              <el-option label="商品分类" value="category" />
              <el-option label="站内页面或区块" value="anchor" />
              <el-option label="自定义页面" value="page" />
              <el-option label="外部链接" value="external" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="link.type === 'category'" label="目标分类">
            <el-select v-model="link.categoryId" clearable filterable placeholder="不选 = 按名称自动匹配" style="width: 320px">
              <el-option v-for="c in categories" :key="c.id" :label="categoryPath(categories, c.id)" :value="String(c.id)" />
            </el-select>
          </el-form-item>
          <el-form-item v-else-if="link.type === 'anchor'" label="目标区块">
            <el-select v-model="link.link" placeholder="选择页面或区块" style="width: 320px">
              <el-option v-for="target in targets" :key="target.value" :label="target.label" :value="target.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-else-if="link.type === 'page'" label="目标页面">
            <el-select v-model="link.link" placeholder="选择自定义页面" style="width: 320px">
              <el-option v-for="p in pages" :key="p.slug" :label="pageLabel(p)" :value="'#page/' + p.slug" />
            </el-select>
          </el-form-item>
          <el-form-item v-else-if="link.type === 'external'" label="链接地址">
            <el-input v-model="link.link" placeholder="https://…" style="width: 320px" />
          </el-form-item>
        </div>
        <el-button :disabled="col.links.length >= 10" @click="addLink(col)">添加链接</el-button>
      </el-card>
      <el-button type="primary" plain :disabled="columns.length >= 4" @click="addColumn">添加列</el-button>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api, run } from '../api/client'
import NamesFields from '../components/NamesFields.vue'
import { LANGS, langByCode } from '../utils/langs'
import { categoryPath } from '../utils/categories'

const PRIMARY_CODES = ['zh', 'en']
const PRIMARY = PRIMARY_CODES.map((c) => langByCode(c))
const MORE = LANGS.filter((l) => !PRIMARY_CODES.includes(l.code))

// Same fixed in-page targets as the navigation editor.
const targets = [
  { label: '配方搜索', value: '#formula' },
  { label: '公司简介', value: '#profile' },
  { label: '商品列表', value: '#catalogue' },
  { label: '品牌介绍', value: '#story' },
  { label: '联系方式', value: '#dealer' },
  { label: '询价表单', value: '#rfq' },
  { label: '回到顶部', value: '#top' }
]
const LINK_TYPES = ['', 'category', 'anchor', 'page', 'external']

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)
// Whole-config save pattern (same as ProfileEditor): GET the full
// config, PUT it back with only the four footer fields replaced, so
// fields managed on other pages are never clobbered from here.
let fullConfig = null
const blurb = reactive({})
const note = reactive({})
const copyright = reactive({})
const columns = reactive([])
const blurbMore = ref([])
const noteMore = ref([])
const categories = ref([])
const pages = ref([])
let eidSeq = 0

function namesObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {}
}

// Start a multi-line editor expanded when a collapsed language already
// has text, so existing copy is never hidden (same rule as ProfileEditor).
function moreState(map) {
  return MORE.some((l) => (map[l.code] || '').trim()) ? ['more'] : []
}

function pageLabel(p) {
  const t = p && p.title && typeof p.title === 'object' ? p.title : {}
  return t.zh || t.en || p.slug
}

function normalizeLink(l) {
  return {
    _eid: ++eidSeq,
    labels: namesObj(l && l.labels),
    type: LINK_TYPES.includes(String((l && l.type) || '')) ? String(l.type || '') : '',
    link: typeof (l && l.link) === 'string' ? l.link : '',
    categoryId: l && l.categoryId !== undefined && l.categoryId !== null ? String(l.categoryId) : ''
  }
}

function normalizeColumn(c) {
  return {
    _eid: ++eidSeq,
    title: namesObj(c && c.title),
    links: (Array.isArray(c && c.links) ? c.links : []).map(normalizeLink)
  }
}

function replaceMap(target, raw) {
  for (const k of Object.keys(target)) delete target[k]
  Object.assign(target, namesObj(raw))
}

async function load() {
  loading.value = true
  loaded.value = false
  try {
    const data = await api('/api/site-config')
    fullConfig = data || {}
    replaceMap(blurb, fullConfig.footerBlurb)
    replaceMap(note, fullConfig.footerNote)
    replaceMap(copyright, fullConfig.footerCopyright)
    blurbMore.value = moreState(blurb)
    noteMore.value = moreState(note)
    columns.splice(0, columns.length, ...(Array.isArray(fullConfig.footerColumns) ? fullConfig.footerColumns : []).map(normalizeColumn))
    loaded.value = true
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
  try { categories.value = (await api('/api/admin/categories')) || [] } catch { categories.value = [] }
  try { pages.value = (await api('/api/admin/pages')) || [] } catch { pages.value = [] }
}

function moveItem(list, index, direction) {
  const next = index + direction
  if (next < 0 || next >= list.length) return
  const tmp = list[index]
  list[index] = list[next]
  list[next] = tmp
}

function addColumn() {
  columns.push(normalizeColumn({}))
}

function addLink(col) {
  col.links.push(normalizeLink({}))
}

// Drop blank languages before saving; the backend shape-guards the
// payload again on the way in.
function cleanNames(map) {
  const out = {}
  for (const [k, v] of Object.entries(map || {})) {
    if (typeof v === 'string' && v.trim()) out[k] = v
  }
  return out
}

async function onSave() {
  if (!fullConfig) return
  const footer = {
    footerBlurb: cleanNames(blurb),
    footerNote: cleanNames(note),
    footerCopyright: cleanNames(copyright),
    footerColumns: columns.slice(0, 4).map((c) => ({
      title: cleanNames(c.title),
      links: c.links.slice(0, 10).map((l) => ({
        labels: cleanNames(l.labels),
        type: l.type || '',
        link: (l.link || '').trim(),
        categoryId: l.type === 'category' ? String(l.categoryId || '') : ''
      }))
    }))
  }
  saving.value = true
  try {
    const r = await run(api('/api/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify({ ...fullConfig, ...footer })
    }))
    if (r) {
      fullConfig = { ...fullConfig, ...footer }
      ElMessage.success('页脚已保存，刷新前台即可生效')
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.footer-card { max-width: 860px; }
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.help { color: var(--adm-text-3); font-size: 12px; line-height: 1.8; margin: 6px 0 16px; }
.column-card { margin-bottom: 16px; }
.column-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.field-label { font-weight: 600; margin: 16px 0 8px; }
.more-langs { margin-bottom: 6px; border-top: none; }
.link-block { border-top: 1px dashed var(--adm-border); padding-top: 10px; margin-top: 10px; }
.link-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; color: var(--adm-text-2); font-size: 13px; }
</style>
