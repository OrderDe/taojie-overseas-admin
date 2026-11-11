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
  { path: 'site-config', title: '站点配置', icon: 'Setting', perm: 'config' },
  { path: 'users', title: '用户与角色', icon: 'UserFilled', perm: 'users' }
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
      { path: 'site-config', name: 'site-config', component: () => import('../views/SiteConfig.vue'), meta: { perm: 'config' } },
      { path: 'users', name: 'users', component: () => import('../views/Users.vue'), meta: { perm: 'users' } }
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
    return auth.loggedIn ? { path: '/' } : true
  }
  if (!auth.loggedIn) return { name: 'login' }
  if (to.meta.perm && !auth.can(to.meta.perm)) {
    return { name: firstAllowed() }
  }
  return true
})

export default router
export { firstAllowed }
