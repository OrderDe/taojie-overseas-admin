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
      <el-form-item label="基准币种">
        <el-select v-model="cfg.baseCurrency" style="width: 200px">
          <el-option v-for="c in BASE_CURRENCIES" :key="c.code" :label="`${c.code} ${c.name}`" :value="c.code" />
        </el-select>
        <span class="note">商品价格都是按这个币种录入的；前台会按当天汇率自动换算给客人看</span>
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
        <span class="note">现在不用就关掉，以后想招经销商再打开；联系方式卡开着时以联系方式卡为准</span>
      </el-form-item>
      <el-form-item label="显示首页联系方式卡">
        <el-switch v-model="cfg.showContact" />
        <span class="note">首页英雄区右侧那张卡，只显示出口热线、WhatsApp 和邮箱，不带『经销商』字样；号码在下面的卡片区和本页上方填写</span>
      </el-form-item>

      <el-form-item label="顶部导航"><router-link to="/navigation">前往导航管理</router-link></el-form-item>

      <el-divider content-position="left">首页顶部（其他）</el-divider>
      <el-form-item label="大标题上方小字">
        <el-input v-model="cfg.heroEyebrow" placeholder="如 F · EDITORIAL WHOLESALE，留空则显示主题名" />
      </el-form-item>

      <el-divider content-position="left">首页右侧卡片（联系方式 / 经销商）</el-divider>
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
        <span class="note">显示在首页联系方式卡上；WhatsApp 和邮箱在本页上方填写</span>
      </el-form-item>

      <el-divider content-position="left">社交账号跳转（前台悬浮联系面板）</el-divider>
      <el-form-item label="TikTok">
        <el-input v-model="cfg.tiktok" placeholder="主页完整链接，如 https://www.tiktok.com/@yourname" />
      </el-form-item>
      <el-form-item label="Instagram">
        <el-input v-model="cfg.instagram" placeholder="主页完整链接，如 https://www.instagram.com/yourname" />
      </el-form-item>
      <el-form-item label="Facebook">
        <el-input v-model="cfg.facebook" placeholder="主页完整链接" />
      </el-form-item>
      <el-form-item label="YouTube">
        <el-input v-model="cfg.youtube" placeholder="频道完整链接" />
      </el-form-item>
      <el-form-item label="微信号">
        <el-input v-model="cfg.wechat" placeholder="微信号，客人点击后复制" style="width: 260px" />
        <span class="note">留空的平台前台不显示图标；邮箱、电话、WhatsApp 图标用本页已填的邮箱、出口热线和 WhatsApp</span>
      </el-form-item>

      <el-divider content-position="left">首页品牌介绍</el-divider>
      <el-form-item label="介绍标题">
        <el-input v-model="cfg.storyTitle" placeholder="留空则用前台默认文案" />
      </el-form-item>
      <el-form-item label="介绍正文">
        <el-input v-model="cfg.storyText" type="textarea" :rows="4" placeholder="留空则用前台默认文案" />
      </el-form-item>
      <el-form-item label="公司简介嵌入网址">
        <el-input v-model="cfg.profileUrl" placeholder="https://williscarpaint.com/" />
        <div class="note logo-note">前台「公司简介」页将整页嵌入这个网址（默认是威利斯公司官网 williscarpaint.com）；清空则改为显示上面的文字版简介（介绍标题 + 介绍正文）</div>
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

// Base currencies the stored prices can be entered in (site-config
// baseCurrency). The storefront converts from this into the visitor's
// chosen display currency at the day's rate.
const BASE_CURRENCIES = [
  { code: 'CNY', name: '人民币' }, { code: 'USD', name: '美元' },
  { code: 'EUR', name: '欧元' }, { code: 'GBP', name: '英镑' },
  { code: 'JPY', name: '日元' }, { code: 'AUD', name: '澳元' },
  { code: 'CAD', name: '加元' }, { code: 'CHF', name: '瑞士法郎' },
  { code: 'SGD', name: '新加坡元' }, { code: 'HKD', name: '港币' }
]

const cfg = reactive({
  logo: '', defaultLanguage: 'en', heroTitle: '', heroSubtitle: '',
  announcement: '', whatsapp: '', email: '', currency: '$', baseCurrency: 'CNY', showRfq: true, showCart: false, showDealer: false, showContact: true,
  heroEyebrow: '', dealerTitle: '', dealerText: '',
  dealerButton: '', hotline: '', storyTitle: '', storyText: '', profileUrl: 'https://williscarpaint.com/',
  tiktok: '', instagram: '', facebook: '', youtube: '', wechat: ''
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
.note { color: var(--adm-text-3); font-size: 12px; margin-left: 12px; }
.logo-editor { width: 100%; }
.logo-note { margin-left: 0; margin-top: 6px; }
.nav-editor { width: 100%; }
.nav-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
.nav-note { margin-left: 0; margin-top: 6px; }
</style>
