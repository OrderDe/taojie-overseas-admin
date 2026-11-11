<template>
  <div>
    <div class="toolbar">
      <el-button @click="load">刷新</el-button>
      <span class="note">商城前台提交的询价（RFQ）会实时出现在这里</span>
    </div>
    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column label="时间" width="160">
        <template #default="{ row }">{{ fmtTime(row) }}</template>
      </el-table-column>
      <el-table-column label="姓名" width="150">
        <template #default="{ row }"><b>{{ row.name }}</b></template>
      </el-table-column>
      <el-table-column label="联系方式" width="220" prop="contact" />
      <el-table-column label="商品" min-width="160" prop="product" />
      <el-table-column label="数量" width="100" prop="qty" />
      <el-table-column label="留言" min-width="220" prop="message" show-overflow-tooltip />
      <el-table-column label="语言" width="80" prop="lang" />
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无询价" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../api/client'

const rows = ref([])
const loading = ref(false)

function fmtTime(r) {
  return String(r.created_at || r.createTime || '').replace('T', ' ').slice(0, 16)
}

async function load() {
  loading.value = true
  try {
    rows.value = (await api('/api/admin/rfq')) || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
.note { color: #8a8fa3; font-size: 13px; }
</style>
