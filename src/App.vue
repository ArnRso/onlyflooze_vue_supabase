<script setup>
import AppHeader from '@/components/AppHeader.vue'
import { useSessionQuery } from '@/queries/useAuth'

// Appel du hook pour vérifier la session au boot
useSessionQuery()
</script>

<template>
  <AppHeader />
  <RouterView />
</template>

<style scoped></style>
