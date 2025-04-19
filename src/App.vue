<script setup>
import Header from "@/components/Header.vue";
import { useSessionQuery } from "@/queries/useAuth";

// Appel du hook pour vérifier la session au boot
useSessionQuery();
</script>

<template>
  <Header />
  <RouterView />
</template>

<style scoped></style>
