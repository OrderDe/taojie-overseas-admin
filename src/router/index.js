// Routes mirror plat's module layout (product / content / system):
// every child carries the menu title, icon and the backend permission
// that gates it. The layout renders its sidebar from this table.
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export const MENU = [
  { path: 'products', title: '商品管理', icon: 'Goods', perm: 'products' },
  { path: 'categories', title: '分类管理', icon: 'Menu', perm: 'categories' },
  { path: 'brands', title: '品牌管理', icon: 'CollectionTag', perm: 'products' },
  { path: 'rfq', title: '询价列表', icon: 'Message', perm: 'rfq' },
  { path: 'chat', title: '在线聊天', icon: 'ChatDotRound', perm: 'chat' },
  { path: 'visitors', title: '访客统计', icon: 'DataAnalysis', perm: 'visitors' },
  { path: 'formula-colors', title: '配方管理', icon: 'Brush', perm: 'formula' },
  { path: 'color-numbers', title: '色号与配方', icon: 'Tickets', perm: 'formula' },
  { path: 'masterbatches', title: '色母库', icon: 'Grid', perm: 'formula' },
  { path: 'car-brands', title: '汽车品牌', icon: 'CollectionTag', perm: 'formula' },
  { path: 'car-models', title: '车型库', icon: 'Van', perm: 'formula' },
  { path: 'formula-dicts', title: '配方基础数据', icon: 'Files', perm: 'formula' },
  { path: 'theme-config', title: '主题配置', icon: 'Brush', perm: 'config' },
  { path: 'navigation', title: '导航管理', icon: 'Menu', perm: 'config' },
  { path: 'site-config', title: '站点配置', icon: 'Setting', perm: 'config' },
  { path: 'profile-editor', title: '公司简介', icon: 'OfficeBuilding', perm: 'config' },
  { path: 'users', title: '用户与角色', icon: 'UserFilled', perm: 'users' },
  // Utility page with no `perm`: visible to every signed-in account
  // (AdminLayout skips the permission filter for perm-less items), so
  // sales staff whose role only has rfq/chat can still open it.
  { path: 'fx', title: '汇率换算', icon: 'Coin' },
  { path: 'mymemory', title: 'MyMemory 查询', icon: 'Search' }
]

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../components/AdminLayout.vue'),
    children: [
      { path: '', redirect: () => ({ name: firstAllowed() }) },
      { path: 'products', name: 'products', component: () => import('../views/Products.vue'), meta: { perm: 'products' } },
      { path: 'categories', name: 'categories', component: () => import('../views/Categories.vue'), meta: { perm: 'categories' } },
      { path: 'brands', name: 'brands', component: () => import('../views/Brands.vue'), meta: { perm: 'products' } },
      { path: 'rfq', name: 'rfq', component: () => import('../views/Rfqs.vue'), meta: { perm: 'rfq' } },
      { path: 'chat', name: 'chat', component: () => import('../views/Chat.vue'), meta: { perm: 'chat' } },
      { path: 'visitors', name: 'visitors', component: () => import('../views/Visitors.vue'), meta: { perm: 'visitors' } },
      { path: 'formula-colors', name: 'formula-colors', component: () => import('../views/FormulaColors.vue'), meta: { perm: 'formula' } },
      { path: 'color-numbers', name: 'color-numbers', component: () => import('../views/ColorNumbers.vue'), meta: { perm: 'formula' } },
      { path: 'masterbatches', name: 'masterbatches', component: () => import('../views/Masterbatches.vue'), meta: { perm: 'formula' } },
      { path: 'car-brands', name: 'car-brands', component: () => import('../views/CarBrands.vue'), meta: { perm: 'formula' } },
      { path: 'car-models', name: 'car-models', component: () => import('../views/CarModels.vue'), meta: { perm: 'formula' } },
      { path: 'formula-dicts', name: 'formula-dicts', component: () => import('../views/FormulaDicts.vue'), meta: { perm: 'formula' } },
      { path: 'theme-config', name: 'theme-config', component: () => import('../views/ThemeConfig.vue'), meta: { perm: 'config' } },
      { path: 'navigation', name: 'navigation', component: () => import('../views/Navigation.vue'), meta: { perm: 'config' } },
      { path: 'site-config', name: 'site-config', component: () => import('../views/SiteConfig.vue'), meta: { perm: 'config' } },
      { path: 'profile-editor', name: 'profile-editor', component: () => import('../views/ProfileEditor.vue'), meta: { perm: 'config' } },
      { path: 'users', name: 'users', component: () => import('../views/Users.vue'), meta: { perm: 'users' } },
      { path: 'fx', name: 'fx', component: () => import('../views/FxTool.vue') },
      { path: 'mymemory', name: 'mymemory', component: () => import('../views/MyMemoryQuery.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

function firstAllowed() {
  const auth = useAuthStore()
  const item = MENU.find((m) => auth.can(m.perm))
  return item ? item.path : 'login'
}

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    const target = firstAllowed()
    return auth.loggedIn && target !== 'login' ? { name: target } : true
  }
  if (!auth.loggedIn) return { name: 'login' }
  if (to.meta.perm && !auth.can(to.meta.perm)) {
    return { name: firstAllowed() }
  }
  return true
})

export default router
export { firstAllowed }
