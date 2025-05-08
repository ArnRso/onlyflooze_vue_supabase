<script setup lang="ts">
import { useSessionQuery, useProfileQuery } from '@/queries/useAuth'

const { data: user } = useSessionQuery()
const { data: profile } = useProfileQuery(user.value?.id ?? null)
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-gray-900 mb-2">
          Profil utilisateur
        </h2>
        <p class="text-gray-600">Informations de votre compte</p>
      </div>
      <div v-if="user">
        <ul class="space-y-4">
          <li>
            <span class="block text-sm font-medium text-gray-700">Email</span>
            <span class="block text-lg text-gray-900">{{ user.email }}</span>
          </li>
          <li>
            <span class="block text-sm font-medium text-gray-700">Id</span>
            <span class="block text-lg text-gray-900">{{ user?.id }}</span>
          </li>
          <li>
            <span class="block text-sm font-medium text-gray-700">Nom</span>
            <span class="block text-lg text-gray-900">{{
              profile?.full_name || 'Non renseigné'
            }}</span>
          </li>
          <li v-if="profile?.username">
            <span class="block text-sm font-medium text-gray-700"
              >Nom d'utilisateur</span
            >
            <span class="block text-lg text-gray-900">{{
              profile.username
            }}</span>
          </li>
          <li v-if="profile?.website">
            <span class="block text-sm font-medium text-gray-700"
              >Site web</span
            >
            <span class="block text-lg text-indigo-600 underline">{{
              profile.website
            }}</span>
          </li>
        </ul>
      </div>
      <div v-else class="text-center text-gray-500 mt-8">
        <p>Pas connecté</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
