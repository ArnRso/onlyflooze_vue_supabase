<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
</script>

<template>
  <div>
    <h2>Profil utilisateur</h2>
    <div v-if="auth.user">
      <p>Email : {{ auth.user.email }}</p>
      <p>Id : {{ auth.user.id }}</p>
      <!-- Ajoute d'autres propriétés si besoin -->
    </div>
    <div v-else>
      <p>Pas connecté</p>
    </div>
  </div>
</template>

<style scoped></style>
