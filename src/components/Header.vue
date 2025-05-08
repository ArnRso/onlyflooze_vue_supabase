<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useSessionQuery, signOut } from "@/queries/useAuth";
import { useQueryClient } from "@tanstack/vue-query";

const isMobileMenuOpen = ref(false);
const isDropdownOpen = ref(false);
const router = useRouter();
const queryClient = useQueryClient();

const { data: user } = useSessionQuery();

const handleSignOut = async () => {
  await signOut();
  await queryClient.invalidateQueries({ queryKey: ["session"] });
  await router.push("/");
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function closeDropdown() {
  isDropdownOpen.value = false;
}
</script>

<template>
  <header
    class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
  >
    <div class="max-w-7xl w-full mx-auto px-4 py-3">
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
          <RouterLink
            v-if="user"
            to="/transactions"
            class="hover:text-indigo-200 transition duration-300 py-2"
          >
            Transactions
          </RouterLink>
          <RouterLink
            v-if="user"
            to="/categories"
            class="hover:text-indigo-200 transition duration-300 py-2"
          >
            Catégories
          </RouterLink>
          <RouterLink
            v-if="user"
            to="/monthly-recurring-summary"
            class="hover:text-indigo-200 transition duration-300 py-2"
          >
            Récap. récurrent
          </RouterLink>
          <div v-if="!user" class="flex space-x-4">
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
          <div v-if="user" class="flex items-center">
            <!-- Dropdown utilisateur -->
            <div class="relative">
              <button
                @click="toggleDropdown"
                class="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition duration-300 focus:outline-none"
                aria-haspopup="true"
                :aria-expanded="isDropdownOpen"
                type="button"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span class="hidden sm:inline">Mon compte</span>
                <svg
                  class="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                v-if="isDropdownOpen"
                class="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50 overflow-hidden border border-indigo-200"
                @mousedown.self="closeDropdown"
              >
                <RouterLink
                  to="/user"
                  class="block px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  @click="closeDropdown"
                >
                  Profil
                </RouterLink>
                <RouterLink
                  to="/tags"
                  class="block px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  @click="closeDropdown"
                >
                  Tags
                </RouterLink>
                <RouterLink
                  to="/assign-category"
                  class="block px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  @click="closeDropdown"
                >
                  Assigner Catégorie
                </RouterLink>
                <button
                  @click="() => { handleSignOut(); closeDropdown(); }"
                  class="block w-full text-left px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                >
                  Déconnexion
                </button>
              </div>
            </div>
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
          @click="isMobileMenuOpen = false"
        >
          Accueil
        </RouterLink>
        <template v-if="!user">
          <RouterLink
            to="login"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Connexion
          </RouterLink>
          <RouterLink
            to="register"
            class="block bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            S'inscrire
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink
            to="/transactions"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Transactions
          </RouterLink>
          <RouterLink
            to="/categories"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Catégories
          </RouterLink>
          <RouterLink
            to="/monthly-recurring-summary"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Récap. récurrent
          </RouterLink>
          <RouterLink
            to="/user"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Profil
          </RouterLink>
          <RouterLink
            to="/tags"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Tags
          </RouterLink>
          <RouterLink
            to="/assign-category"
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="isMobileMenuOpen = false"
          >
            Assigner Catégorie
          </RouterLink>
          <button
            @click="() => { handleSignOut(); isMobileMenuOpen = false; }"
            class="block w-full text-left hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          >
            Déconnexion
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
