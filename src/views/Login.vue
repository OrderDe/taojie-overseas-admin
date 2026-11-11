<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <div class="login-brand">
        <div class="brand-mark">淘</div>
        <div class="login-title">淘街海外商城 · 管理后台</div>
      </div>
      <el-form :model="form" @submit.prevent="onSubmit" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="如 admin" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="后端启动时设置的 ADMIN_TOKEN"
            autocomplete="current-password"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-button type="primary" class="login-btn" :loading="loading" @click="onSubmit">
          登录
        </el-button>
        <p class="hint">
          初始账号 admin，密码就是后端 ADMIN_TOKEN。登录后在「用户与角色」里改密码、加账号、分角色。
        </p>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { firstAllowed } from '../router'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (!form.username || !form.password || loading.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.username.trim(), form.password)
    router.push({ name: firstAllowed() })
  } catch (e) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #14142b 0%, #23234d 55%, #4f46e5 130%);
}
.login-card { width: 380px; border-radius: 14px; padding: 8px 6px; }
.login-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.brand-mark {
  width: 38px; height: 38px; border-radius: 10px; background: #4f46e5; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 700;
}
.login-title { font-size: 16px; font-weight: 600; color: #1f2430; }
.login-btn { width: 100%; margin-top: 4px; }
.hint { color: #8a8fa3; font-size: 12px; line-height: 1.6; margin: 14px 0 0; }
</style>
