<script setup lang="ts">
import useAuth from "@/composables/useAuth";

const { user } = useAuth();
</script>

<template>
  {{ user }}
</template>

<style scoped></style>
