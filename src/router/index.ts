import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import CategoryView from "@/views/CategoryView.vue";
import UserView from "@/views/UserView.vue";
import TransactionView from "@/views/TransactionView.vue";
import TransactionCreateView from "@/views/TransactionCreateView.vue";
import TransactionEditView from "@/views/TransactionEditView.vue";
import { useAuthStore } from "@/stores/auth";
import { useTransactionStore } from "@/stores/transaction";
import { useCategoryStore } from "@/stores/category";

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
    beforeEnter: async (to, from, next) => {
      const transactionStore = useTransactionStore();
      const categoryStore = useCategoryStore();
      await Promise.all([
        transactionStore.fetchTransactions(),
        categoryStore.fetchCategories(),
      ]);
      next();
    },
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
    beforeEnter: async (to, from, next) => {
      const transactionStore = useTransactionStore();
      const transaction = await transactionStore.fetchTransactionById(
        to.params.id as string
      );
      if (transaction) {
        transactionStore.currentTransaction = transaction;
        next();
      } else {
        next("/transactions");
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from) => {
  const auth = useAuthStore();

  // Attendre la fin du chargement de la session utilisateur
  if (auth.loading) {
    await new Promise((resolve) => {
      const stop = auth.$subscribe(() => {
        if (!auth.loading) {
          stop();
          resolve(null);
        }
      });
    });
  }

  // Autoriser l'accès libre aux routes publiques
  if (to.meta.public || to.matched.some((r) => r.meta.public)) {
    return true;
  }
  // Vérifier la présence d'un utilisateur connecté
  if (auth.user) {
    return true;
  } else {
    return { name: "login" };
  }
});

export default router;
