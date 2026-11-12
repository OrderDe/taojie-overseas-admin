<template>
  <el-card v-loading="loading" class="theme-card">
    <template #header>
      <div class="title">商城主题</div>
      <p class="intro">统一设置前台商城外观，保存后刷新商城页面即可生效。</p>
    </template>
    <el-form label-width="100px" @submit.prevent="onSave">
      <el-form-item label="当前主题">
        <el-tag>{{ activeLabel }}</el-tag>
      </el-form-item>
      <el-form-item label="选择主题">
        <el-select v-model="selectedTheme" aria-label="选择主题" style="width: 360px; max-width: 100%" :disabled="loading || saving">
          <el-option v-for="theme in THEMES" :key="theme.value" :label="theme.label" :value="theme.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" :disabled="loading" @click="onSave">保存主题</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'

const THEMES = [
  { value: 'a', label: 'A · Classic Mall（经典大商超）' },
  { value: 'b', label: 'B · Cross-Border Pro（跨境专业）' },
  { value: 'c', label: 'C · Minimal Modern（极简现代）' },
  { value: 'd', label: 'D · Dark Industrial（深色工业）' },
  { value: 'e', label: 'E · Orange Pulse（橙色脉冲）' },
  { value: 'f', label: 'F · Editorial Wholesale（编辑批发）' },
  { value: 'g', label: 'G · Port Trade（港口贸易）' },
  { value: 'h', label: 'H · Colour Field（色彩场）' }
]

const selectedTheme = ref('h')
const activeTheme = ref('h')
const loading = ref(false)
const saving = ref(false)
const activeLabel = computed(() => THEMES.find(theme => theme.value === activeTheme.value)?.label || '尚未设置')
const normalizeTheme = value => {
  const key = String(value || 'h').toLowerCase()
  return THEMES.some(theme => theme.value === key) ? key : 'h'
}

async function load() {
  loading.value = true
  try {
    const data = await api('/api/site-config')
    selectedTheme.value = activeTheme.value = normalizeTheme(data?.defaultTheme)
  } catch (error) {
    ElMessage.error(error.message || '主题配置加载失败')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (loading.value || saving.value) return
  saving.value = true
  try {
    const data = await api('/api/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify({ defaultTheme: selectedTheme.value })
    })
    selectedTheme.value = activeTheme.value = normalizeTheme(data?.defaultTheme || selectedTheme.value)
    ElMessage.success('主题已保存，刷新商城页面即可生效')
  } catch (error) {
    ElMessage.error(error.message || '主题保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.theme-card { max-width: 760px; }
.title { color: var(--adm-text); font-size: 16px; font-weight: 600; }
.intro { margin: 8px 0 0; color: var(--adm-text-3); font-size: 13px; line-height: 1.6; }
</style>
