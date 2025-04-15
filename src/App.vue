<script setup>
import Header from "@/components/Header.vue";
import { useAuthStore } from "@/stores/auth";
import { onMounted } from "vue";

const auth = useAuthStore();

onMounted(() => {
  auth.checkSession();
  auth.listenToAuthChanges();
});
</script>

<template>
  <Header />
  <RouterView />
</template>

<style scoped></style>
