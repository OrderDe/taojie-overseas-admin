<template>
  <el-card v-loading="loading" class="cfg-card">
    <el-form :model="cfg" label-width="130px">
      <el-divider content-position="left">站点 Logo</el-divider>
      <el-form-item label="Logo 图片">
        <div class="logo-editor">
          <ImageField v-model="cfg.logo" />
          <p class="note logo-note">建议透明底 PNG；留空就显示文字店名</p>
        </div>
      </el-form-item>
      <el-form-item label="默认语言">
        <el-select v-model="cfg.defaultLanguage" style="width: 260px">
          <el-option label="English" value="en" />
          <el-option label="中文" value="zh" />
          <el-option label="Español" value="es" />
          <el-option label="Français" value="fr" />
          <el-option label="Português" value="pt" />
        </el-select>
      </el-form-item>
      <el-form-item label="首页大标题">
        <el-input v-model="cfg.heroTitle" placeholder="首页最上方那行最大的字，留空用主题默认文案" />
      </el-form-item>
      <el-form-item label="首页副标题">
        <el-input v-model="cfg.heroSubtitle" placeholder="大标题下面那行说明文字，留空用主题默认文案" />
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
      <el-form-item label="显示购物车和订单">
        <el-switch v-model="cfg.showCart" />
        <span class="note">关掉后前台只保留询价，适合询盘站</span>
      </el-form-item>
      <el-form-item label="显示『成为经销商』卡片">
        <el-switch v-model="cfg.showDealer" />
        <span class="note">现在不用就关掉，以后想招经销商再打开</span>
      </el-form-item>

      <el-divider content-position="left">首页导航菜单</el-divider>
      <el-form-item label="导航菜单">
        <div class="nav-editor">
          <div v-for="(item, idx) in cfg.navItems" :key="idx" class="nav-row">
            <el-input v-model="item.label" placeholder="菜单文字，如 礼品专区" style="width: 240px" />
            <el-input v-model="item.link" placeholder="链接，如 #gifts（可空）" style="width: 240px" />
            <el-button type="danger" plain @click="removeNav(idx)">删除</el-button>
          </div>
          <el-button @click="addNav">+ 添加一行</el-button>
          <p class="note nav-note">留空（无任何行）时前台使用内置默认导航；链接目前仅保存，前台导航暂不跳转。</p>
        </div>
      </el-form-item>

      <el-divider content-position="left">首页顶部（其他）</el-divider>
      <el-form-item label="大标题上方小字">
        <el-input v-model="cfg.heroEyebrow" placeholder="如 F · EDITORIAL WHOLESALE，留空则显示主题名" />
      </el-form-item>

      <el-divider content-position="left">经销商卡</el-divider>
      <el-form-item label="卡片标题">
        <el-input v-model="cfg.dealerTitle" placeholder="留空则用前台默认文案" />
      </el-form-item>
      <el-form-item label="卡片说明">
        <el-input v-model="cfg.dealerText" type="textarea" :rows="3" placeholder="留空则用前台默认文案" />
      </el-form-item>
      <el-form-item label="按钮文字">
        <el-input v-model="cfg.dealerButton" placeholder="留空则用前台默认文案" style="width: 260px" />
      </el-form-item>
      <el-form-item label="出口热线">
        <el-input v-model="cfg.hotline" placeholder="如 +86 20 8888 8888" style="width: 260px" />
      </el-form-item>

      <el-divider content-position="left">首页品牌介绍</el-divider>
      <el-form-item label="介绍标题">
        <el-input v-model="cfg.storyTitle" placeholder="留空则用前台默认文案" />
      </el-form-item>
      <el-form-item label="介绍正文">
        <el-input v-model="cfg.storyText" type="textarea" :rows="4" placeholder="留空则用前台默认文案" />
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
import ImageField from '../components/ImageField.vue'

const cfg = reactive({
  logo: '', defaultLanguage: 'en', heroTitle: '', heroSubtitle: '',
  announcement: '', whatsapp: '', email: '', currency: '$', showRfq: true, showCart: false, showDealer: false,
  navItems: [], heroEyebrow: '', dealerTitle: '', dealerText: '',
  dealerButton: '', hotline: '', storyTitle: '', storyText: ''
})

function addNav() { cfg.navItems.push({ label: '', link: '' }) }
function removeNav(idx) { cfg.navItems.splice(idx, 1) }
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
      if (!Array.isArray(cfg.navItems)) cfg.navItems = []
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
.note { color: var(--adm-text-3); font-size: 12px; margin-left: 12px; }
.logo-editor { width: 100%; }
.logo-note { margin-left: 0; margin-top: 6px; }
.nav-editor { width: 100%; }
.nav-row { display: flex; gap: 8px; margin-bottom: 8px; }
.nav-note { margin-left: 0; margin-top: 6px; }
</style>
