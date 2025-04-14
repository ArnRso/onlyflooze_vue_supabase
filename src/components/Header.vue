<script setup>
import useAuth from "@/composables/useAuth.js";

const {user, signOut} = useAuth();
</script>

<template>
    <header class="flex justify-between items-center p-4 bg-gray-800 text-white">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink v-if="!user" to="login">Login</RouterLink>
        <RouterLink v-if="!user" to="register">Register</RouterLink>
        <RouterLink v-if="user" to="user">User</RouterLink>
        <button v-if="user" @click="signOut">Logout</button>
    </header>
</template>

<style scoped>

</style>