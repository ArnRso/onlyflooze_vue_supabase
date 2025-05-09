<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { signOut, useSessionQuery } from '@/queries/useAuth'
  import { useQueryClient } from '@tanstack/vue-query'

  const isMobileMenuOpen = ref(false)
  const isDropdownOpen = ref(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: user } = useSessionQuery()

  const handleSignOut = async () => {
    await signOut()
    await queryClient.invalidateQueries({ queryKey: ['session'] })
    await router.push('/')
  }

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value
  }

  function closeDropdown() {
    isDropdownOpen.value = false
  }
</script>

<template>
  <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
    <div class="max-w-7xl w-full mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <!-- Logo / Home -->
        <div class="flex items-center">
          <RouterLink
            class="text-xl font-bold tracking-tight hover:text-indigo-200 transition duration-300"
            to="/"
          >
            OnlyFlooze
          </RouterLink>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-6">
          <RouterLink class="hover:text-indigo-200 font-medium transition duration-300 py-2" to="/">
            Accueil
          </RouterLink>
          <RouterLink
            v-if="user"
            class="hover:text-indigo-200 transition duration-300 py-2"
            to="/transactions"
          >
            Transactions
          </RouterLink>
          <RouterLink
            v-if="user"
            class="hover:text-indigo-200 transition duration-300 py-2"
            to="/categories"
          >
            Catégories
          </RouterLink>
          <RouterLink
            v-if="user"
            class="hover:text-indigo-200 transition duration-300 py-2"
            to="/monthly-recurring-summary"
          >
            Récap. récurrent
          </RouterLink>
          <div v-if="!user" class="flex space-x-4">
            <RouterLink class="hover:text-indigo-200 transition duration-300 py-2" to="login">
              Connexion
            </RouterLink>
            <RouterLink
              class="bg-white text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-full font-medium transition duration-300"
              to="register"
            >
              S'inscrire
            </RouterLink>
          </div>
          <div v-if="user" class="flex items-center">
            <!-- Dropdown utilisateur -->
            <div class="relative">
              <button
                :aria-expanded="isDropdownOpen"
                aria-haspopup="true"
                class="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition duration-300 focus:outline-none"
                type="button"
                @click="toggleDropdown"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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
                  <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <div
                v-if="isDropdownOpen"
                class="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-50 overflow-hidden border border-indigo-200"
                @mousedown.self="closeDropdown"
              >
                <RouterLink
                  class="block px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  to="/user"
                  @click="closeDropdown"
                >
                  Profil
                </RouterLink>
                <RouterLink
                  class="block px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  to="/tags"
                  @click="closeDropdown"
                >
                  Tags
                </RouterLink>
                <RouterLink
                  class="block px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  to="/assign-category"
                  @click="closeDropdown"
                >
                  Assigner Catégorie
                </RouterLink>
                <button
                  class="block w-full text-left px-4 py-2 hover:bg-indigo-50 transition rounded-none"
                  @click="
                    () => {
                      handleSignOut()
                      closeDropdown()
                    }
                  "
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </nav>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button class="text-white focus:outline-none" @click="toggleMobileMenu">
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                v-if="!isMobileMenuOpen"
                d="M4 6h16M4 12h16M4 18h16"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
              <path
                v-else
                d="M6 18L18 6M6 6l12 12"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="isMobileMenuOpen" class="md:hidden mt-3 pb-3 space-y-3">
        <RouterLink
          class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
          to="/"
          @click="isMobileMenuOpen = false"
        >
          Accueil
        </RouterLink>
        <template v-if="!user">
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="login"
            @click="isMobileMenuOpen = false"
          >
            Connexion
          </RouterLink>
          <RouterLink
            class="block bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition duration-300"
            to="register"
            @click="isMobileMenuOpen = false"
          >
            S'inscrire
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="/transactions"
            @click="isMobileMenuOpen = false"
          >
            Transactions
          </RouterLink>
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="/categories"
            @click="isMobileMenuOpen = false"
          >
            Catégories
          </RouterLink>
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="/monthly-recurring-summary"
            @click="isMobileMenuOpen = false"
          >
            Récap. récurrent
          </RouterLink>
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="/user"
            @click="isMobileMenuOpen = false"
          >
            Profil
          </RouterLink>
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="/tags"
            @click="isMobileMenuOpen = false"
          >
            Tags
          </RouterLink>
          <RouterLink
            class="block hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            to="/assign-category"
            @click="isMobileMenuOpen = false"
          >
            Assigner Catégorie
          </RouterLink>
          <button
            class="block w-full text-left hover:bg-white/10 px-3 py-2 rounded-lg transition duration-300"
            @click="
              () => {
                handleSignOut()
                isMobileMenuOpen = false
              }
            "
          >
            Déconnexion
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
// Correction du nom du composant
