<template>
  <!-- Name inputs driven by the language registry (utils/langs.js):
       zh + en are always visible, every other language lives in a
       collapsed「更多语言」section so the form stays compact. -->
  <el-form-item v-for="lang in PRIMARY" :key="lang.code" :label="lang.label">
    <el-input v-model="model[lang.code]" :placeholder="lang.label" />
  </el-form-item>
  <el-collapse v-model="moreOpen" class="more-langs">
    <el-collapse-item title="更多语言" name="more">
      <el-form-item v-for="lang in MORE" :key="lang.code" :label="lang.label">
        <el-input v-model="model[lang.code]" :placeholder="lang.label" />
      </el-form-item>
    </el-collapse-item>
  </el-collapse>
  <el-form-item>
    <el-button type="primary" plain :loading="translating" :disabled="!canTranslate" @click="onTranslate">
      自动翻译
    </el-button>
    <span class="translate-tip">只需填中文，点自动翻译生成其他语言，可再手动修改</span>
  </el-form-item>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { LANGS, TARGET_CODES, langByCode } from '../utils/langs'
import { api } from '../api/client'

const props = defineProps({
  model: { type: Object, required: true }
})

const PRIMARY_CODES = ['zh', 'en']
const PRIMARY = PRIMARY_CODES.map((c) => langByCode(c))
const MORE = LANGS.filter((l) => !PRIMARY_CODES.includes(l.code))
// Editing an entry that already has text in a collapsed language should
// not hide it: start expanded in that case.
const moreOpen = ref(MORE.some((l) => (props.model[l.code] || '').trim()) ? ['more'] : [])

const translating = ref(false)
const canTranslate = computed(() => !!(props.model.zh || '').trim())

// One-shot translation at entry time: the backend returns every other
// registry language for the Chinese name; only still-empty fields are
// filled, never overwritten.
async function onTranslate() {
  const text = (props.model.zh || '').trim()
  if (!text || translating.value) return
  translating.value = true
  try {
    const r = await api('/api/admin/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targets: TARGET_CODES })
    })
    const translations = (r && r.translations) || {}
    let filled = 0
    for (const key of TARGET_CODES) {
      if (translations[key] && !(props.model[key] || '').trim()) {
        props.model[key] = translations[key]
        filled++
      }
    }
    if (filled && !moreOpen.value.includes('more')) moreOpen.value = ['more']
    const failed = r && r.errors ? Object.keys(r.errors) : []
    if (failed.length) {
      ElMessage.warning(`部分语言翻译失败（${failed.map((k) => (langByCode(k) || {}).name || k).join('、')}），请手动填写`)
    } else if (filled) {
      ElMessage.success('已自动翻译，可再手动修改')
    } else {
      ElMessage.info('其他语言都已有内容，未覆盖；如需重译请先清空对应输入框')
    }
  } catch {
    ElMessage.error('翻译服务暂时不可用，可先手动填写')
  } finally {
    translating.value = false
  }
}
</script>

<style scoped>
.more-langs {
  margin-bottom: 18px;
  border-top: none;
}
.translate-tip {
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
