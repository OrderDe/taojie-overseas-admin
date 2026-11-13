<template>
  <el-card v-loading="loading" class="profile-card">
    <div class="toolbar">
      <el-button type="primary" :loading="saving" :disabled="loading || !loaded" @click="onSave">保存公司简介</el-button>
      <el-button :disabled="saving" @click="load">重新加载</el-button>
    </div>
    <p class="help">
      前台「公司简介」页是本站原生页面：最上方是这里的「页面横幅」（全幅背景图 + 大标题 + 副标题），
      下面依次是产品分类与精选产品（自动取 WILLIS 分类的真实商品）、章节（「关于我们」左文右图、
      「出口市场与服务」的要点显示为特性卡、「质量与认证」「技术团队」等章节双列排布、「我们的工厂」配图库）、
      客户评价、常见问题，最下方是「企业概况」与联系方式卡组成的深色带。轮播图为旧版式保留字段，前台新版式不再显示。
      正文用空行分段。文字可填 12 种语言，前台按客人当前语言显示，
      缺的语言自动用英文、再用第一个已填语言兜底。这里全部留空时，前台只显示文字版简介（介绍标题 + 介绍正文）。
    </p>

    <el-form label-width="110px">
      <el-divider content-position="left">页面横幅</el-divider>
      <p class="field-label">横幅标题</p>
      <NamesFields :model="content.banner.title" />
      <p class="field-label">横幅副标题</p>
      <NamesFields :model="content.banner.subtitle" />
      <p class="field-label">横幅背景图</p>
      <div class="img-row">
        <div class="img-main"><ImageField v-model="content.banner.image" /></div>
      </div>

      <el-divider content-position="left">顶部轮播图（旧版式保留，新版式不显示）</el-divider>
      <div v-for="(img, i) in content.heroImages" :key="'hero-' + i" class="img-row">
        <div class="img-main"><ImageField v-model="content.heroImages[i]" /></div>
        <el-button type="danger" plain @click="content.heroImages.splice(i, 1)">删除</el-button>
      </div>
      <el-button @click="content.heroImages.push('')">添加图片</el-button>

      <el-divider content-position="left">章节</el-divider>
      <el-card v-for="(sec, si) in content.sections" :key="sec._eid" class="section-card" shadow="never">
        <div class="section-head">
          <b>章节 {{ si + 1 }}</b>
          <span>
            <el-button size="small" :disabled="si === 0" @click="moveSection(si, -1)">上移</el-button>
            <el-button size="small" :disabled="si === content.sections.length - 1" @click="moveSection(si, 1)">下移</el-button>
            <el-button size="small" type="danger" plain @click="content.sections.splice(si, 1)">删除章节</el-button>
          </span>
        </div>

        <p class="field-label">标题</p>
        <NamesFields :model="sec.title" />

        <p class="field-label">正文（换行分段）</p>
        <!-- Multi-line counterpart of NamesFields (which is single-line
             only): same zh/en-first + collapsed-more-languages layout,
             with textareas. No auto-translate button — the translate
             endpoint caps input at 500 chars, too small for body copy. -->
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

        <p class="field-label">章节图片（可空）</p>
        <div class="img-row">
          <div class="img-main"><ImageField v-model="sec.image" /></div>
        </div>

        <p class="field-label">要点</p>
        <div v-for="(bullet, bi) in sec.bullets" :key="'bullet-' + bi" class="bullet-block">
          <div class="bullet-head">
            <span>要点 {{ bi + 1 }}</span>
            <el-button size="small" type="danger" plain @click="sec.bullets.splice(bi, 1)">删除要点</el-button>
          </div>
          <NamesFields :model="bullet" />
        </div>
        <el-button @click="sec.bullets.push({})">添加要点</el-button>
      </el-card>
      <el-button type="primary" plain @click="addSection">添加章节</el-button>

      <el-divider content-position="left">图库</el-divider>
      <div v-for="(img, i) in content.gallery" :key="'gallery-' + i" class="img-row">
        <div class="img-main"><ImageField v-model="content.gallery[i]" /></div>
        <el-button type="danger" plain @click="content.gallery.splice(i, 1)">删除</el-button>
      </div>
      <el-button @click="content.gallery.push('')">添加图片</el-button>

      <el-divider content-position="left">客户评价</el-divider>
      <el-card v-for="(tm, ti) in content.testimonials" :key="tm._eid" class="section-card" shadow="never">
        <div class="section-head">
          <b>评价 {{ ti + 1 }}</b>
          <el-button size="small" type="danger" plain @click="content.testimonials.splice(ti, 1)">删除评价</el-button>
        </div>

        <p class="field-label">姓名 / 署名</p>
        <el-form-item label="姓名">
          <el-input v-model="tm.name" placeholder="如：John · South Africa（所有语言共用，不翻译）" />
        </el-form-item>

        <p class="field-label">评价内容</p>
        <!-- Same multi-line multilingual editor as the section body. -->
        <el-form-item v-for="lang in PRIMARY" :key="'tm-' + lang.code" :label="lang.label">
          <el-input v-model="tm.text[lang.code]" type="textarea" :rows="4" :placeholder="lang.label" />
        </el-form-item>
        <el-collapse v-model="tmMore[tm._eid]" class="more-langs">
          <el-collapse-item title="更多语言" name="more">
            <el-form-item v-for="lang in MORE" :key="'tm-more-' + lang.code" :label="lang.label">
              <el-input v-model="tm.text[lang.code]" type="textarea" :rows="4" :placeholder="lang.label" />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-card>
      <el-button type="primary" plain @click="addTestimonial">添加评价</el-button>

      <el-divider content-position="left">常见问题</el-divider>
      <el-card v-for="(faq, fi) in content.faqs" :key="faq._eid" class="section-card" shadow="never">
        <div class="section-head">
          <b>问题 {{ fi + 1 }}</b>
          <span>
            <el-button size="small" :disabled="fi === 0" @click="moveFaq(fi, -1)">上移</el-button>
            <el-button size="small" :disabled="fi === content.faqs.length - 1" @click="moveFaq(fi, 1)">下移</el-button>
            <el-button size="small" type="danger" plain @click="content.faqs.splice(fi, 1)">删除问题</el-button>
          </span>
        </div>

        <p class="field-label">问题</p>
        <NamesFields :model="faq.q" />

        <p class="field-label">答案（换行分段）</p>
        <!-- Same multi-line multilingual editor as the section body. -->
        <el-form-item v-for="lang in PRIMARY" :key="'faq-a-' + lang.code" :label="lang.label">
          <el-input v-model="faq.a[lang.code]" type="textarea" :rows="5" :placeholder="lang.label" />
        </el-form-item>
        <el-collapse v-model="faqMore[faq._eid]" class="more-langs">
          <el-collapse-item title="更多语言" name="more">
            <el-form-item v-for="lang in MORE" :key="'faq-a-more-' + lang.code" :label="lang.label">
              <el-input v-model="faq.a[lang.code]" type="textarea" :rows="5" :placeholder="lang.label" />
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-card>
      <el-button type="primary" plain @click="addFaq">添加问题</el-button>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api, run } from '../api/client'
import ImageField from '../components/ImageField.vue'
import NamesFields from '../components/NamesFields.vue'
import { LANGS, langByCode } from '../utils/langs'

const PRIMARY_CODES = ['zh', 'en']
const PRIMARY = PRIMARY_CODES.map((c) => langByCode(c))
const MORE = LANGS.filter((l) => !PRIMARY_CODES.includes(l.code))

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)
// The whole site config, fetched on load and PUT back wholesale with
// only profileContent replaced (same load/save pattern as SiteConfig),
// so fields managed elsewhere are never clobbered from this page.
let fullConfig = null
const content = reactive({ banner: { title: {}, subtitle: {}, image: '' }, heroImages: [], sections: [], gallery: [], faqs: [], testimonials: [] })
// Per-entry「更多语言」collapse state for the multi-line editors, keyed
// by each entry's editor-only id (stripped again when saving).
const bodyMore = reactive({})
const faqMore = reactive({})
const tmMore = reactive({})
let eidSeq = 0

function namesObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {}
}

// Start a multi-line editor expanded when a collapsed language already
// has text, so existing copy is never hidden (same rule as NamesFields).
function moreState(map) {
  return MORE.some((l) => (map[l.code] || '').trim()) ? ['more'] : []
}

function normalizeSection(s) {
  const sec = {
    _eid: ++eidSeq,
    title: namesObj(s && s.title),
    body: namesObj(s && s.body),
    // Older content predates the section image: default to no image.
    image: typeof (s && s.image) === 'string' ? s.image : '',
    bullets: (Array.isArray(s && s.bullets) ? s.bullets : []).map((b) => namesObj(b))
  }
  bodyMore[sec._eid] = moreState(sec.body)
  return sec
}

function normalizeFaq(f) {
  const faq = {
    _eid: ++eidSeq,
    q: namesObj(f && f.q),
    a: namesObj(f && f.a)
  }
  faqMore[faq._eid] = moreState(faq.a)
  return faq
}

function normalizeTestimonial(x) {
  const tm = {
    _eid: ++eidSeq,
    name: typeof (x && x.name) === 'string' ? x.name : '',
    text: namesObj(x && x.text)
  }
  tmMore[tm._eid] = moreState(tm.text)
  return tm
}

function normalizeBanner(b) {
  return {
    title: namesObj(b && b.title),
    subtitle: namesObj(b && b.subtitle),
    image: typeof (b && b.image) === 'string' ? b.image : ''
  }
}

function normalizeContent(raw) {
  const c = raw && typeof raw === 'object' ? raw : {}
  // Older content has no banner key at all: default to the empty
  // banner so the editor opens cleanly and never drops old data.
  content.banner = normalizeBanner(c.banner)
  content.heroImages = (Array.isArray(c.heroImages) ? c.heroImages : []).filter((u) => typeof u === 'string')
  content.gallery = (Array.isArray(c.gallery) ? c.gallery : []).filter((u) => typeof u === 'string')
  content.sections = (Array.isArray(c.sections) ? c.sections : []).map(normalizeSection)
  // Older content has no faqs / testimonials keys at all: default to
  // empty lists so the editor opens cleanly and never drops old data.
  content.faqs = (Array.isArray(c.faqs) ? c.faqs : []).map(normalizeFaq)
  content.testimonials = (Array.isArray(c.testimonials) ? c.testimonials : []).map(normalizeTestimonial)
}

async function load() {
  loading.value = true
  loaded.value = false
  try {
    const data = await api('/api/site-config')
    fullConfig = data || {}
    normalizeContent(fullConfig.profileContent)
    loaded.value = true
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function addSection() {
  content.sections.push(normalizeSection({}))
}

function moveSection(index, direction) {
  const next = index + direction
  if (next < 0 || next >= content.sections.length) return
  const tmp = content.sections[index]
  content.sections[index] = content.sections[next]
  content.sections[next] = tmp
}

function addFaq() {
  content.faqs.push(normalizeFaq({}))
}

function moveFaq(index, direction) {
  const next = index + direction
  if (next < 0 || next >= content.faqs.length) return
  const tmp = content.faqs[index]
  content.faqs[index] = content.faqs[next]
  content.faqs[next] = tmp
}

function addTestimonial() {
  content.testimonials.push(normalizeTestimonial({}))
}

// Drop blank languages (and blank bullets) before saving; the backend
// shape-guards the payload again on the way in.
function cleanNames(map) {
  const out = {}
  for (const [k, v] of Object.entries(map || {})) {
    if (typeof v === 'string' && v.trim()) out[k] = v
  }
  return out
}

async function onSave() {
  if (!fullConfig) return
  const profileContent = {
    banner: {
      title: cleanNames(content.banner.title),
      subtitle: cleanNames(content.banner.subtitle),
      image: (content.banner.image || '').trim()
    },
    heroImages: content.heroImages.map((u) => (u || '').trim()).filter(Boolean),
    sections: content.sections.map((s) => ({
      title: cleanNames(s.title),
      body: cleanNames(s.body),
      image: (s.image || '').trim(),
      bullets: s.bullets.map((b) => cleanNames(b)).filter((b) => Object.keys(b).length)
    })),
    gallery: content.gallery.map((u) => (u || '').trim()).filter(Boolean),
    // Blank entries (nothing in any language) are dropped on save;
    // everything the operator typed is carried through as-is.
    faqs: content.faqs
      .map((f) => ({ q: cleanNames(f.q), a: cleanNames(f.a) }))
      .filter((f) => Object.keys(f.q).length || Object.keys(f.a).length),
    testimonials: content.testimonials
      .map((x) => ({ name: (x.name || '').trim(), text: cleanNames(x.text) }))
      .filter((x) => x.name || Object.keys(x.text).length)
  }
  saving.value = true
  try {
    const r = await run(api('/api/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify({ ...fullConfig, profileContent })
    }))
    if (r) {
      fullConfig = { ...fullConfig, profileContent }
      ElMessage.success('公司简介已保存，刷新前台即可生效')
    }
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.profile-card { max-width: 860px; }
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.help { color: var(--adm-text-3); font-size: 12px; line-height: 1.8; margin: 6px 0 16px; }
.img-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px; max-width: 680px; }
.img-main { flex: 1; }
.section-card { margin-bottom: 16px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.field-label { font-weight: 600; margin: 16px 0 8px; }
.more-langs { margin-bottom: 6px; border-top: none; }
.bullet-block { border-top: 1px dashed var(--adm-border); padding-top: 10px; margin-top: 10px; }
.bullet-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; color: var(--adm-text-2); font-size: 13px; }
</style>
