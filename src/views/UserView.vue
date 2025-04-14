<script setup>
import useAuth from "@/composables/useAuth.js";

const { user } = useAuth();
</script>

<template>
  {{ user }}
</template>

<style scoped></style>
