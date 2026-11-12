<template>
  <div class="theme-switcher" role="group" aria-label="后台外观">
    <button
      v-for="item in ADMIN_THEMES"
      :key="item.key"
      type="button"
      class="ts-btn"
      :class="{ active: current === item.key }"
      @click="choose(item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ADMIN_THEMES, getAdminTheme, setAdminTheme } from '../utils/adminTheme'

const current = ref(getAdminTheme())

function choose(key) {
  current.value = setAdminTheme(key)
}
</script>

<style scoped>
.theme-switcher {
  display: inline-flex; gap: 2px; padding: 3px;
  background: var(--adm-surface-2); border: 1px solid var(--adm-border);
  border-radius: 999px;
}
.ts-btn {
  border: 0; background: transparent; color: var(--adm-text-2);
  font-family: inherit; font-size: 12.5px; line-height: 1; padding: 6px 12px;
  border-radius: 999px; cursor: pointer; white-space: nowrap;
}
.ts-btn:hover { color: var(--adm-text); }
.ts-btn.active {
  background: var(--adm-primary); color: #fff; font-weight: 600;
}
:root[data-admin-theme='c'] .ts-btn.active { color: #0b100e; }
</style>
