import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { supabase } from '@/supabase'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { public: true },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/pages/CategoryListPage.vue'),
  },
  {
    path: '/categories/:id',
    name: 'category-detail',
    component: () => import('@/pages/CategoryDetailPage.vue'),
    props: true,
  },
  { path: '/user', name: 'user', component: () => import('@/pages/UserPage.vue') },
  {
    path: '/transactions',
    name: 'transactions',
    component: () => import('@/pages/TransactionsPage.vue'),
  },
  {
    path: '/transactions/:id/edit',
    name: 'transaction-edit',
    component: () => import('@/pages/TransactionEditPage.vue'),
    props: true,
  },
  {
    path: '/tags',
    name: 'tags',
    component: () => import('@/pages/TagsPage.vue'),
  },
  {
    path: '/monthly-recurring-summary',
    name: 'monthly-recurring-summary',
    component: () => import('@/pages/MonthlyRecurringSummaryPage.vue'),
  },
  {
    path: '/transaction-bulk-categorize',
    name: 'transaction-bulk-categorize',
    component: () => import('@/pages/TransactionBulkCategorizePage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  // Autoriser l'accès libre aux routes publiques
  if (to.meta.public || to.matched.some((r) => r.meta.public)) {
    return true
  }
  // Vérifier la présence d'un utilisateur connecté via Supabase sans hook
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) {
    return true
  } else {
    return { name: 'login' }
  }
})

export default router
