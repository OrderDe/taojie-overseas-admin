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
        background-color="transparent"
        text-color="var(--adm-sidebar-text)"
        active-text-color="var(--adm-sidebar-active-text)"
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
          <ThemeSwitcher />
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
import ThemeSwitcher from './ThemeSwitcher.vue'

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
.aside {
  background: var(--adm-sidebar-bg);
  border-right: 1px solid var(--adm-border);
  transition: background-color .25s ease;
}
.brand { display: flex; align-items: center; gap: 10px; padding: 20px 18px 16px; }
.brand-mark {
  width: 38px; height: 38px; border-radius: var(--adm-radius); background: var(--adm-brand-mark-bg); color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0;
}
.brand-name { color: var(--adm-text); font-size: 16px; font-weight: 700; }
.brand-sub { color: var(--adm-sidebar-text); font-size: 12px; margin-top: 2px; }
.aside :deep(.el-menu) { border-right: none; padding: 4px 10px; }
.aside :deep(.el-menu-item) { border-radius: var(--adm-radius); margin-bottom: 2px; }
.aside :deep(.el-menu-item:hover) { background: var(--adm-sidebar-hover-bg); }
.aside :deep(.el-menu-item.is-active) { background: var(--adm-sidebar-active-bg); font-weight: 600; }
.header {
  background: var(--adm-surface); display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--adm-border); height: 64px;
}
.page-title { font-size: var(--adm-title-size); font-weight: var(--adm-title-weight); color: var(--adm-text); letter-spacing: .2px; }
.header-right { display: flex; align-items: center; gap: 14px; }
.who { color: var(--adm-text-2); font-size: 13px; }
</style>
