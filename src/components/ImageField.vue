<template>
  <!-- Image URL input + upload-to-backend + preview. Uploads go through
       POST /api/admin/upload (base64 JSON), files land in the backend's
       uploads dir and come back as absolute URLs. -->
  <div class="img-field">
    <el-input v-model="url" placeholder="图片地址，或用右侧按钮上传" />
    <el-upload
      :show-file-list="false"
      :before-upload="beforeUpload"
      accept="image/png,image/jpeg,image/webp,image/gif"
    >
      <el-button :loading="uploading">上传</el-button>
    </el-upload>
  </div>
  <el-image v-if="url" :src="url" class="preview" fit="contain" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { api, run } from '../api/client'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const uploading = ref(false)

const url = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function beforeUpload(file) {
  if (file.size > 6 * 1024 * 1024) {
    ElMessage.error('图片不能超过 6MB')
    return false
  }
  uploading.value = true
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const dataBase64 = String(reader.result).split(',')[1]
      const r = await run(api('/api/admin/upload', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, dataBase64 })
      }))
      if (r && r.url) {
        emit('update:modelValue', r.url)
        ElMessage.success('上传成功')
      }
    } finally {
      uploading.value = false
    }
  }
  reader.readAsDataURL(file)
  return false
}
</script>

<style scoped>
.img-field { display: flex; gap: 8px; width: 100%; }
.preview { width: 120px; height: 90px; margin-top: 8px; border: 1px solid var(--adm-border); border-radius: 6px; }
</style>
