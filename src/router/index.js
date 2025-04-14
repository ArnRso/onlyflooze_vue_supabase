import {createRouter, createWebHistory} from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import UserView from "@/views/UserView.vue";
import {supabase} from "@/supabase.js";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: {onlyNotLogged: true}
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: {onlyNotLogged: true}
        },
        {
            path: '/user',
            name: 'user',
            component: UserView,
            meta: {requireAuth: true}
        }
    ],
});

router.beforeEach(async (to, from, next) => {
    if (to.meta?.requireAuth) {
        const {data} = await supabase.auth.getSession();
        if (!data.session) {
            next('/');
            return;
        }
    }

    if (to.meta?.onlyNotLogged) {
        const {data} = await supabase.auth.getSession();
        if (data.session) {
            next(from.fullPath);
            return
        }
    }

    next();
});

export default router;
