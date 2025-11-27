import { createRouter, createWebHistory,type RouteRecordRaw } from 'vue-router'

// 定义路由列表
export const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'), 
    meta: { title: "空域态势" },
  },
  {
    path: '/chartVisualization',
    name: 'ChartVisualization',
    component: () => import('@/views/ChartVisualization.vue'), 
    meta: { title: "效能指标和容流指数预测/监测"},
  },
  {
    path: '/optimizationStrategy',
    name: 'optimizationStrategy',
    component: () => import('@/views/optimizationStrategy.vue'), 
    meta: { title: "优化策略查看" },
  },
  // 404 路由
  // {
  //   path: '/:pathMatch(.*)*',
  //   component: () => import('@/views/404.vue'), 
  // },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 使用 History 模式
  routes,
})

export default router