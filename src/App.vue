<script setup>
import Header from "@/components/Header.vue";
import useAuth from "@/composables/useAuth.js";

useAuth();
</script>

<template>
    <Header/>
    <RouterView/>
</template>

<style scoped>
</style>
