<script setup>
  import AppHeader from '@/components/AppHeader.vue'
  import { useSessionQuery } from '@/queries/useAuth'

  // Appel du hook pour vérifier la session au boot
  useSessionQuery()
</script>

<template>
  <UApp>
    <AppHeader />
    <RouterView />
  </UApp>
</template>

<style scoped></style>
