<template>
    <div>
        <h2>Connexion</h2>

        <form @submit.prevent="handleLogin">
            <input v-model="email" placeholder="Email" required type="email"/>
            <input v-model="password" placeholder="Mot de passe" required type="password"/>
            <button type="submit">Se connecter</button>
        </form>

        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <p v-if="user">Connecté en tant que {{ user.email }}</p>
        <button v-if="user" @click="handleLogout">Se déconnecter</button>
    </div>
</template>

<script setup>
import {ref} from 'vue';
import useAuth from "@/composables/useAuth.js";

const email = ref('');
const password = ref('');
const errorMessage = ref('');

const {signIn, signOut, user} = useAuth();

const handleLogin = () => {
    signIn(email.value, password.value);
};


const handleLogout = () => {
    signOut();
};
</script>
