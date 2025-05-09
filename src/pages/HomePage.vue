<script lang="ts" setup></script>
<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center"
  >
    <div
      class="max-w-2xl w-full mx-auto bg-white/90 rounded-3xl shadow-2xl overflow-hidden p-10 flex flex-col items-center relative"
    >
      <h1
        class="mt-4 text-4xl font-extrabold text-indigo-700 text-center drop-shadow mb-4"
      >
        Bienvenue sur
        <span
          class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          OnlyFlooze
        </span>
      </h1>
      <p class="text-lg text-gray-700 text-center mb-6 max-w-xl">
        Prenez le contrôle de vos finances personnelles en toute simplicité.<br />
        OnlyFlooze vous aide à suivre vos dépenses, catégoriser vos transactions
        et visualiser votre budget en un clin d'œil.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 mt-4">
        <RouterLink
          class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition text-lg"
          to="/register"
        >
          Commencer gratuitement
        </RouterLink>
        <RouterLink
          class="bg-white border-2 border-indigo-600 text-indigo-700 px-8 py-3 rounded-full font-semibold shadow hover:bg-indigo-50 transition text-lg"
          to="/login"
        >
          J'ai déjà un compte
        </RouterLink>
      </div>
      <div class="mt-10 w-full flex flex-col items-center">
        <h2 class="text-2xl font-bold text-indigo-600 mb-2">
          Pourquoi OnlyFlooze ?
        </h2>
        <ul class="text-gray-700 text-base space-y-2 max-w-lg">
          <li>
            💡 <span class="font-medium">Interface claire</span> : visualisez
            vos finances sans prise de tête.
          </li>
          <li>
            🔒 <span class="font-medium">Sécurité</span> : vos données restent
            privées et protégées.
          </li>
          <li>
            📊 <span class="font-medium">Statistiques</span> : suivez
            l’évolution de vos dépenses et revenus.
          </li>
          <li>
            ⚡ <span class="font-medium">Rapide à prendre en main</span> :
            commencez à gérer votre budget en quelques clics.
          </li>
        </ul>
      </div>
      <div class="mt-10 text-center text-gray-400 text-xs">
        &copy; 2025 OnlyFlooze. Tous droits réservés.
      </div>
    </div>
  </div>
</template>

<style scoped></style>
