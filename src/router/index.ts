import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import CategoryListPage from '@/pages/CategoryListPage.vue'
import CategoryDetailPage from '@/pages/CategoryDetailPage.vue'
import UserPage from '@/pages/UserPage.vue'
import TransactionsPage from '@/pages/TransactionsPage.vue'
import TransactionEditPage from '@/pages/TransactionEditPage.vue'
import TagsPage from '@/pages/TagsPage.vue'
import MonthlyRecurringSummaryPage from '@/pages/MonthlyRecurringSummaryPage.vue'
import { supabase } from '@/supabase'

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'home', component: HomePage, meta: { public: true } },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { public: true },
  },
  { path: '/categories', name: 'categories', component: CategoryListPage },
  {
    path: '/categories/:id',
    name: 'category-detail',
    component: CategoryDetailPage,
    props: true,
  },
  { path: '/user', name: 'user', component: UserPage },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsPage,
  },
  {
    path: '/transactions/:id/edit',
    name: 'transaction-edit',
    component: TransactionEditPage,
    props: true,
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagsPage,
  },
  {
    path: '/monthly-recurring-summary',
    name: 'monthly-recurring-summary',
    component: MonthlyRecurringSummaryPage,
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
