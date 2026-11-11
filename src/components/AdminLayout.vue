<template>
  <el-container class="layout">
    <el-aside width="216px" class="aside">
      <div class="brand">
        <div class="brand-mark">淘</div>
        <div>
          <div class="brand-name">淘街海外商城</div>
          <div class="brand-sub">管理后台</div>
        </div>
      </div>
      <el-menu
        :default-active="activePath"
        router
        background-color="#14142b"
        text-color="#b9bdd6"
        active-text-color="#ffffff"
      >
        <el-menu-item
          v-for="item in visibleMenu"
          :key="item.path"
          :index="'/' + item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="page-title">{{ currentTitle }}</span>
        <div class="header-right">
          <span class="who" v-if="auth.user">
            {{ auth.user.displayName || auth.user.username }} · {{ auth.user.roleName || '' }}
          </span>
          <el-button size="small" @click="onLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MENU } from '../router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const visibleMenu = computed(() => MENU.filter((m) => auth.can(m.perm)))
const activePath = computed(() => route.path)
const currentTitle = computed(() => {
  const item = MENU.find((m) => '/' + m.path === route.path)
  return item ? item.title : ''
})

async function onLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #14142b; }
.brand { display: flex; align-items: center; gap: 10px; padding: 18px 16px 14px; }
.brand-mark {
  width: 36px; height: 36px; border-radius: 9px; background: #4f46e5; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700;
}
.brand-name { color: #fff; font-size: 15px; font-weight: 600; }
.brand-sub { color: #8b90ad; font-size: 12px; margin-top: 2px; }
.aside :deep(.el-menu) { border-right: none; }
.header {
  background: #fff; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e6e8f0;
}
.page-title { font-size: 16px; font-weight: 600; color: #1f2430; }
.header-right { display: flex; align-items: center; gap: 12px; }
.who { color: #6b7186; font-size: 13px; }
</style>
