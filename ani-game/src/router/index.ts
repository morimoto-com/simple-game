import HomeView from '@/views/HomeView.vue'
import type { RouteRecordRaw } from 'vue-router' // ← 型として読み込む
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/memory', name: 'memory', component: () => import('@/views/PricureCard.vue') },
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
