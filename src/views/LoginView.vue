<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useLoginMutation, useSessionQuery, signOut } from "@/queries/useAuth";
import { useQueryClient } from "@tanstack/vue-query";

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const { mutateAsync: login, isPending } = useLoginMutation();
const { data: user } = useSessionQuery();
const router = useRouter();
const queryClient = useQueryClient();

const handleLogin = async () => {
  try {
    await login({ email: email.value, password: password.value });
    errorMessage.value = "";
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    await router.push("/");
  } catch (e: any) {
    errorMessage.value = e.message || "Identifiants invalides.";
  }
};

const handleLogout = async () => {
  await signOut();
  await queryClient.invalidateQueries({ queryKey: ["session"] });
  await router.push("/");
};
</script>
<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div
      class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">Connexion</h2>
        <p class="text-gray-600">Accédez à votre espace personnel</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
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
              autocomplete="current-password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              Se souvenir de moi
            </label>
          </div>
          <div class="text-sm">
            <a
              href="#"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Mot de passe oublié?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
          >
            Se connecter
          </button>
        </div>
      </form>

      <div class="mt-6">
        <p
          v-if="errorMessage"
          class="text-red-600 text-center text-sm font-medium mb-4"
        >
          {{ errorMessage }}
        </p>
        <div
          v-if="user"
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
                Connecté en tant que {{ user.email }}
              </p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300"
          >
            Se déconnecter
          </button>
        </div>
        <div class="mt-6 text-center text-sm">
          <p>
            Pas encore de compte?
            <RouterLink
              to="/register"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              S'inscrire
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
