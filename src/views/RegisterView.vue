<template>
    <div>
        <h2>Inscription</h2>

        <form @submit.prevent="register">
            <input v-model="email" placeholder="Email" required type="email"/>
            <input v-model="password" placeholder="Mot de passe" required type="password"/>
            <button type="submit">Créer un compte</button>
        </form>

        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <p v-if="successMessage" style="color: green;">{{ successMessage }}</p>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { supabase } from '@/supabase';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const successMessage = ref('');

const register = async () => {
    errorMessage.value = '';
    successMessage.value = '';

    const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
    });

    if (error) {
        errorMessage.value = error.message;
    } else {
        successMessage.value = "Compte créé avec succès ! Vérifie ton email pour confirmer l'inscription.";
    }
};
</script>
