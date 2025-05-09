<script lang="ts" setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { signOut, useLoginMutation, useSessionQuery } from '@/queries/useAuth'
  import { useQueryClient } from '@tanstack/vue-query'

  const email = ref('')
  const password = ref('')
  const errorMessage = ref('')

  const { mutateAsync: login } = useLoginMutation()
  const { data: user } = useSessionQuery()
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleLogin = async () => {
    try {
      await login({ email: email.value, password: password.value })
      errorMessage.value = ''
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      await router.push('/')
    } catch (e: unknown) {
      errorMessage.value = e instanceof Error ? e.message : 'Identifiants invalides.'
    }
  }

  const handleLogout = async () => {
    await signOut()
    await queryClient.invalidateQueries({ queryKey: ['session'] })
    await router.push('/')
  }
</script>
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">Connexion</h2>
        <p class="text-gray-600">Accédez à votre espace personnel</p>
      </div>

      <form class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-gray-700" for="email">Email</label>
          <div class="mt-1">
            <input
              id="email"
              v-model="email"
              autocomplete="email"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              name="email"
              placeholder="votre@email.com"
              required
              type="email"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700" for="password">Mot de passe</label>
          <div class="mt-1">
            <input
              id="password"
              v-model="password"
              autocomplete="current-password"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              name="password"
              placeholder="••••••••"
              required
              type="password"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              name="remember-me"
              type="checkbox"
            />
            <label class="ml-2 block text-sm text-gray-900" for="remember-me">
              Se souvenir de moi
            </label>
          </div>
        </div>
        <div>
          <button
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
            type="submit"
          >
            Se connecter
          </button>
        </div>
      </form>

      <div class="mt-6">
        <p v-if="errorMessage" class="text-red-600 text-center text-sm font-medium mb-4">
          {{ errorMessage }}
        </p>
        <div v-if="user" class="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                aria-hidden="true"
                class="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clip-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fill-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                Connecté en tant que {{ user.email }}
              </p>
            </div>
          </div>
          <button
            class="w-full mt-4 flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
            @click="handleLogout"
          >
            Se déconnecter
          </button>
        </div>
        <div class="mt-6 text-center text-sm">
          <p>
            Pas encore de compte?
            <RouterLink class="font-medium text-indigo-600 hover:text-indigo-500" to="/register">
              S'inscrire
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
