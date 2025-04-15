import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import CategoryView from "@/views/CategoryView.vue";
import UserView from "@/views/UserView.vue";
import { useAuthStore } from "@/stores/auth";

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
