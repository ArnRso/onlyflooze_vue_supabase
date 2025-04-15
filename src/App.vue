<script setup>
import Header from "@/components/Header.vue";
import useAuth from "@/composables/useAuth";
import { onMounted } from "vue";

const { checkSession, listenToAuthChanges } = useAuth();

onMounted(() => {
  checkSession();
  listenToAuthChanges();
});
</script>

<template>
  <Header />
  <RouterView />
</template>

<style scoped></style>
