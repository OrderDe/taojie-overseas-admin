<template>
  <!-- Video URL input + upload-to-backend + preview + clear. Uploads go
       through POST /api/admin/upload (base64 JSON), same endpoint as
       ImageField; the backend accepts mp4/webm/mov up to 50 MB and stores
       the file under its uploads dir, returning an absolute URL. -->
  <div class="video-field">
    <el-input v-model="url" placeholder="视频地址，或用右侧按钮上传（mp4/webm/mov，≤50MB）" />
    <el-upload
      :show-file-list="false"
      :before-upload="beforeUpload"
      accept="video/mp4,video/webm,video/quicktime"
    >
      <el-button :loading="uploading">上传</el-button>
    </el-upload>
    <el-button v-if="url" @click="url = ''">清除</el-button>
  </div>
  <video v-if="url" :src="url" class="preview" controls preload="metadata" />
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
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('视频不能超过 50MB')
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
.video-field { display: flex; gap: 8px; width: 100%; }
.preview { width: 240px; max-width: 100%; margin-top: 8px; border: 1px solid var(--adm-border); border-radius: 6px; background: #000; }
</style>
