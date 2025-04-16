import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import CategoryView from "@/views/CategoryView.vue";
import UserView from "@/views/UserView.vue";
import TransactionView from "@/views/TransactionView.vue";
import TransactionCreateView from "@/views/TransactionCreateView.vue";
import TransactionEditView from "@/views/TransactionEditView.vue";
import { supabase } from "@/supabase";

const routes: Array<RouteRecordRaw> = [
  { path: "/", name: "home", component: HomeView, meta: { public: true } },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { public: true },
  },
  { path: "/categories", name: "categories", component: CategoryView },
  { path: "/user", name: "user", component: UserView },
  {
    path: "/transactions",
    name: "transactions",
    component: TransactionView,
  },
  {
    path: "/transactions/new",
    name: "transaction-create",
    component: TransactionCreateView,
  },
  {
    path: "/transactions/:id/edit",
    name: "transaction-edit",
    component: TransactionEditView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from) => {
  // Autoriser l'accès libre aux routes publiques
  if (to.meta.public || to.matched.some((r) => r.meta.public)) {
    return true;
  }
  // Vérifier la présence d'un utilisateur connecté via Supabase sans hook
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    return true;
  } else {
    return { name: "login" };
  }
});

export default router;
