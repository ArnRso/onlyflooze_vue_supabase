<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const isMobileMenuOpen = ref(false);
const router = useRouter();

const handleSignOut = async () => {
  await auth.signOut();
  await router.push("/");
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>

<template>
  <header
    class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
  >
    <div class="container mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <!-- Logo / Home -->
        <div class="flex items-center">
          <RouterLink
            to="/"
            class="text-xl font-bold tracking-tight hover:text-indigo-200 transition duration-300"
          >
            OnlyFlooze
          </RouterLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <RouterLink
            to="/"
            class="hover:text-indigo-200 font-medium transition duration-300 py-2"
          >
            Accueil
          </RouterLink>
          <div v-if="!auth.user" class="flex space-x-4">
            <RouterLink
              to="login"
              class="hover:text-indigo-200 transition duration-300 py-2"
            >
              Connexion
            </RouterLink>
            <RouterLink
              to="register"
              class="bg-white text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-full font-medium transition duration-300"
            >
              S'inscrire
            </RouterLink>
          </div>
          <div v-if="auth.user" class="flex space-x-4 items-center">
            <RouterLink
              to="user"
              class="hover:text-indigo-200 transition duration-300 py-2"
            >
              Profil
            </RouterLink>
            <RouterLink
              to="/categories"
              class="hover:text-indigo-200 transition duration-300 py-2"
            >
              Catégories
            </RouterLink>
            <RouterLink
              to="/transactions"
              class="hover:text-indigo-200 transition duration-300 py-2"
            >
              Transactions
            </RouterLink>
            <button
              @click="handleSignOut"
              class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition duration-300"
            >
              Déconnexion
            </button>
          </div>
        </nav>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button
            @click="toggleMobileMenu"
            class="text-white focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
                v-if="!isMobileMenuOpen"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
                v-else
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="isMobileMenuOpen" class="md:hidden mt-3 pb-3 space-y-3">
        <RouterLink
          to="/"
          class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
        >
          Accueil
        </RouterLink>
        <template v-if="!auth.user">
          <RouterLink
            to="login"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          >
            Connexion
          </RouterLink>
          <RouterLink
            to="register"
            class="block bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition duration-300"
          >
            S'inscrire
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink
            to="user"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          >
            Profil
          </RouterLink>
          <RouterLink
            to="/categories"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          >
            Catégories
          </RouterLink>
          <RouterLink
            to="/transactions"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          >
            Transactions
          </RouterLink>
          <button
            @click="handleSignOut"
            class="block w-full text-left hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          >
            Déconnexion
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
