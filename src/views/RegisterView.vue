<script setup lang="ts">
import { ref } from "vue";
import { useRegisterMutation } from "@/queries/useAuth";

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const { mutateAsync: registerUser, isPending } = useRegisterMutation();

const register = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await registerUser({ email: email.value, password: password.value });
    successMessage.value =
      "Compte créé avec succès ! Vérifiez votre email pour confirmer l'inscription.";
  } catch (e: any) {
    errorMessage.value = e.message || "Erreur lors de l'inscription";
  }
};
</script>
<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div
      class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">Inscription</h2>
        <p class="text-gray-600">Créez votre compte pour commencer</p>
      </div>

      <form @submit.prevent="register" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"
            >Email</label
          >
          <div class="mt-1">
            <input
              v-model="email"
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"
            >Mot de passe</label
          >
          <div class="mt-1">
            <input
              v-model="password"
              id="password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Le mot de passe doit contenir au moins 6 caractères
          </p>
        </div>

        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
          >
            Créer un compte
          </button>
        </div>
      </form>

      <div class="mt-6">
        <p
          v-if="errorMessage"
          class="text-red-600 text-center text-sm font-medium p-3 bg-red-50 border border-red-200 rounded-md"
        >
          {{ errorMessage }}
        </p>

        <div
          v-if="successMessage"
          class="bg-green-50 border border-green-200 rounded-md p-4 mt-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                {{ successMessage }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center text-sm">
          <p>
            Déjà un compte?
            <RouterLink
              to="/login"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Se connecter
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
