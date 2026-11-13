<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openCreateUser">新建用户</el-button>
      <el-button type="primary" plain @click="openCreateRole">新建角色</el-button>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-table :data="users" v-loading="loading" stripe class="block">
      <el-table-column label="用户名" width="170" prop="username" />
      <el-table-column label="显示名" width="150" prop="displayName" />
      <el-table-column label="角色" width="150" prop="roleName" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ fmt(row) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="openEditUser(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDeleteUser(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="section-title">角色（菜单权限）</div>
    <el-table :data="roles" v-loading="loading" stripe>
      <el-table-column label="角色名" width="180" prop="name" />
      <el-table-column label="菜单权限" min-width="300">
        <template #default="{ row }">
          <el-tag
            v-for="label in permLabels(row)"
            :key="label"
            class="perm-tag"
            type="info"
          >{{ label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户数" width="90" prop="userCount" />
      <el-table-column label="内置" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.builtin" type="warning">内置</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="openEditRole(row)">编辑</el-button>
          <el-button size="small" type="danger" :disabled="row.builtin" @click="onDeleteRole(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- user dialog -->
    <el-dialog
      v-model="userDialog"
      :title="userForm.id ? '编辑用户' : '新建用户'"
      width="520px"
      destroy-on-close
    >
      <el-form :model="userForm" label-width="90px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" :disabled="!!userForm.id" placeholder="2–32 位，字母/数字/_ . -" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="userForm.displayName" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="userForm.password"
            type="password"
            show-password
            :placeholder="userForm.id ? '留空 = 不改密码' : '至少 6 位'"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.roleId" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="userForm.active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSaveUser">保存</el-button>
      </template>
    </el-dialog>

    <!-- role dialog -->
    <el-dialog
      v-model="roleDialog"
      :title="roleForm.id ? '编辑角色' : '新建角色'"
      width="680px"
      destroy-on-close
    >
      <el-form :model="roleForm" label-width="90px">
        <el-form-item label="角色名">
          <el-input v-model="roleForm.name" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-checkbox-group v-model="roleForm.permissions" :disabled="roleIsBuiltin" class="perm-groups">
            <el-checkbox value="*" class="perm-check perm-check-star">全部权限（超级管理员）</el-checkbox>
            <template v-for="g in groupedPermissionDefs" :key="g.group">
              <div class="perm-group-title">{{ g.group }}</div>
              <el-checkbox
                v-for="p in g.items"
                :key="p.key"
                :value="p.key"
                class="perm-check"
              >{{ p.label }}</el-checkbox>
            </template>
          </el-checkbox-group>
          <div class="permission-help">每个菜单单独授权，勾哪个开哪个。</div>
          <div class="permission-help">登录后可用：{{ sharedMenuLabels }}（无需单独授权）。</div>
          <div v-if="roleIsBuiltin" class="note">内置角色的权限固定为全部，不可修改</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSaveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api, run } from '../api/client'
import { MENU } from '../router'

const users = ref([])
const roles = ref([])
const permDefs = ref([])
// One checkbox per menu now that every menu has its own permission key;
// the label is the menu's own title, filed under the backend's group.
const menuPermissionDefs = computed(() => permDefs.value.map((permission) => {
  const menu = MENU.find((m) => m.perm === permission.key)
  return { ...permission, label: menu ? menu.title : permission.label, group: permission.group || '其他' }
}))
const PERM_GROUP_ORDER = ['商品', '客户', '配方', '网站配置', '系统', '其他']
const groupedPermissionDefs = computed(() => PERM_GROUP_ORDER
  .map((group) => ({ group, items: menuPermissionDefs.value.filter((p) => p.group === group) }))
  .filter((g) => g.items.length))
const sharedMenuLabels = MENU.filter((menu) => !menu.perm).map((menu) => menu.title).join('、')
const loading = ref(false)
const saving = ref(false)

const userDialog = ref(false)
const userForm = reactive({ id: null, username: '', displayName: '', password: '', roleId: null, active: true })
const roleDialog = ref(false)
const roleForm = reactive({ id: null, name: '', permissions: [] })
const roleIsBuiltin = computed(() => {
  const r = roles.value.find((x) => x.id === roleForm.id)
  return !!r && !!r.builtin
})

function fmt(row) {
  return String(row.created_at || row.createTime || '').replace('T', ' ').slice(0, 16)
}

function permLabels(role) {
  if (!role.permissions) return []
  if (role.permissions.includes('*')) return ['全部权限']
  return role.permissions.map((k) => {
    const def = menuPermissionDefs.value.find((p) => p.key === k)
    return def ? def.label : k
  })
}

async function load() {
  loading.value = true
  try {
    const [us, rs, ps] = await Promise.all([
      api('/api/admin/users'),
      api('/api/admin/roles'),
      api('/api/admin/permissions')
    ])
    users.value = us || []
    roles.value = rs || []
    permDefs.value = ps || []
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreateUser() {
  Object.assign(userForm, { id: null, username: '', displayName: '', password: '', roleId: roles.value[0]?.id ?? null, active: true })
  userDialog.value = true
}

function openEditUser(row) {
  Object.assign(userForm, {
    id: row.id, username: row.username, displayName: row.displayName || '',
    password: '', roleId: row.roleId, active: row.active !== false
  })
  userDialog.value = true
}

async function onSaveUser() {
  saving.value = true
  try {
    const payload = {
      username: userForm.username, displayName: userForm.displayName,
      roleId: userForm.roleId, active: userForm.active
    }
    if (userForm.password) payload.password = userForm.password
    const r = await run(userForm.id
      ? api(`/api/admin/users/${userForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : api('/api/admin/users', { method: 'POST', body: JSON.stringify({ ...payload, password: userForm.password }) }))
    if (r) {
      ElMessage.success('已保存')
      userDialog.value = false
      load()
    }
  } finally {
    saving.value = false
  }
}

async function onDeleteUser(row) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/users/${row.id}`, { method: 'DELETE' }))
  if (r) {
    ElMessage.success('已删除')
    load()
  }
}

function openCreateRole() {
  Object.assign(roleForm, { id: null, name: '', permissions: [] })
  roleDialog.value = true
}

function openEditRole(row) {
  Object.assign(roleForm, { id: row.id, name: row.name, permissions: [...(row.permissions || [])] })
  roleDialog.value = true
}

async function onSaveRole() {
  if (!roleForm.name.trim()) {
    ElMessage.warning('角色名不能为空')
    return
  }
  saving.value = true
  try {
    const payload = { name: roleForm.name, permissions: roleForm.permissions }
    const r = await run(roleForm.id
      ? api(`/api/admin/roles/${roleForm.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : api('/api/admin/roles', { method: 'POST', body: JSON.stringify(payload) }))
    if (r) {
      ElMessage.success('已保存')
      roleDialog.value = false
      load()
    }
  } finally {
    saving.value = false
  }
}

async function onDeleteRole(row) {
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  const r = await run(api(`/api/admin/roles/${row.id}`, { method: 'DELETE' }))
  if (r) {
    ElMessage.success('已删除')
    load()
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.block { margin-bottom: 22px; }
.section-title { font-size: 15px; font-weight: 600; margin: 6px 0 12px; color: var(--adm-text); }
.perm-tag { margin-right: 6px; margin-bottom: 2px; }
.perm-groups { display: block; max-height: 46vh; overflow-y: auto; width: 100%; padding-right: 6px; }
.perm-group-title { font-size: 12px; font-weight: 600; color: var(--adm-text-muted, #6b7280); margin: 12px 0 4px; }
.perm-group-title:first-of-type { margin-top: 4px; }
.perm-check { display: inline-flex; align-items: flex-start; width: 50%; height: auto; margin: 0 0 6px; white-space: normal; }
.perm-check-star { width: 100%; }
.perm-check :deep(.el-checkbox__label) { white-space: normal; line-height: 1.45; }
.permission-help { width: 100%; color: var(--adm-text-muted, #6b7280); font-size: 12px; line-height: 1.6; margin-top: 6px; }
.note { color: #b45309; font-size: 12px; margin-top: 6px; }
</style>
