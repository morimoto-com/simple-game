import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import type { RouteRecordRaw } from 'vue-router' // ← 型として読み込む

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  // { path: '/whac-a-mole', name: 'whac', component: () => import('@/views/games/WhacAMoleView.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'notfound',
    component: () => import('@/views/ComingSoonView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
