<template>
  <el-card v-loading="loading" class="cfg-card">
    <el-form :model="cfg" label-width="130px">
      <el-form-item label="默认语言">
        <el-select v-model="cfg.defaultLanguage" style="width: 260px">
          <el-option label="English" value="en" />
          <el-option label="中文" value="zh" />
          <el-option label="Español" value="es" />
          <el-option label="Français" value="fr" />
          <el-option label="Português" value="pt" />
        </el-select>
      </el-form-item>
      <el-form-item label="英雄区标题">
        <el-input v-model="cfg.heroTitle" />
      </el-form-item>
      <el-form-item label="英雄区副标题">
        <el-input v-model="cfg.heroSubtitle" />
      </el-form-item>
      <el-form-item label="公告">
        <el-input v-model="cfg.announcement" />
      </el-form-item>
      <el-form-item label="WhatsApp">
        <el-input v-model="cfg.whatsapp" placeholder="如 +27 82 000 0000" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="cfg.email" placeholder="如 sales@example.com" />
      </el-form-item>
      <el-form-item label="币种符号">
        <el-input v-model="cfg.currency" style="width: 160px" placeholder="如 $ 或 USD" />
      </el-form-item>
      <el-form-item label="显示询价入口">
        <el-switch v-model="cfg.showRfq" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSave">保存配置</el-button>
        <span class="note">保存后前台刷新即生效（前台启动时读后端配置覆盖本地默认）</span>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api, run } from '../api/client'

const cfg = reactive({
  defaultLanguage: 'en', heroTitle: '', heroSubtitle: '',
  announcement: '', whatsapp: '', email: '', currency: '$', showRfq: true
})
const loading = ref(false)
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await api('/api/site-config')
    if (data) {
      for (const key of Object.keys(cfg)) {
        if (data[key] !== undefined) cfg[key] = data[key]
      }
    }
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    const r = await run(api('/api/admin/site-config', {
      method: 'PUT',
      body: JSON.stringify({ ...cfg })
    }))
    if (r) ElMessage.success('配置已保存')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.cfg-card { max-width: 760px; }
.note { color: #8a8fa3; font-size: 12px; margin-left: 12px; }
</style>
