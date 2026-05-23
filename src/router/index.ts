import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/entrance',
  },
  {
    path: '/entrance',
    name: 'Entrance',
    component: () => import('@/scenes/entrance/index.vue'),
    meta: { title: '入口' },
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: () => import('@/scenes/lobby/index.vue'),
    meta: { title: '大厅' },
  },
  {
    path: '/world/:id',
    name: 'World',
    component: () => import('@/scenes/worlds/WorldPage.vue'),
    meta: { title: '门世界' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 - 添加页面标题
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '创意门世界'
  next()
})

export default router