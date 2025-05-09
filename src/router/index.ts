import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '@/pages/HomePage.vue'
import LoginView from '@/pages/LoginPage.vue'
import RegisterView from '@/pages/RegisterPage.vue'
import CategoryList from '@/pages/CategoryListPage.vue'
import CategoryDetailView from '@/pages/CategoryDetailPage.vue'
import UserView from '@/pages/UserPage.vue'
import TransactionsView from '@/pages/TransactionsPage.vue'
import TransactionCreateView from '@/pages/TransactionCreatePage.vue'
import TransactionEditView from '@/pages/TransactionEditPage.vue'
import TagsView from '@/pages/TagsPage.vue'
import AssignCategoryView from '@/pages/AssignCategoryPage.vue'
import MonthlyRecurringSummaryView from '@/pages/MonthlyRecurringSummaryPage.vue'
import { supabase } from '@/supabase'

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'home', component: HomeView, meta: { public: true } },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { public: true },
  },
  { path: '/categories', name: 'categories', component: CategoryList },
  {
    path: '/categories/:id',
    name: 'category-detail',
    component: CategoryDetailView,
    props: true,
  },
  { path: '/user', name: 'user', component: UserView },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsView,
  },
  {
    path: '/transactions/new',
    name: 'transaction-create',
    component: TransactionCreateView,
  },
  {
    path: '/transactions/:id/edit',
    name: 'transaction-edit',
    component: TransactionEditView,
    props: true,
  },
  {
    path: '/tags',
    name: 'tags',
    component: TagsView,
  },
  {
    path: '/assign-category',
    name: 'assign-category',
    component: AssignCategoryView,
  },
  {
    path: '/monthly-recurring-summary',
    name: 'monthly-recurring-summary',
    component: MonthlyRecurringSummaryView,
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
