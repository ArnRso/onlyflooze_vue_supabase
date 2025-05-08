<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useCategoriesQuery } from "@/queries/useCategories";
import { useCategoryTransactionsQuery } from "@/queries/useTransactions";
import { estimateNextRecurringTransaction } from "@/services/recurringTransactionService";

const route = useRoute();
const categoryId = computed(() => route.params.id as string);
const { data: categories } = useCategoriesQuery();
const { data: txResult, isLoading, error } = useCategoryTransactionsQuery(categoryId.value);

const category = computed(() => categories.value?.find(c => c.id === categoryId.value));
const transactions = computed(() => txResult.value?.data || []);

const recurringEstimate = computed(() => {
  if (!category.value?.is_recurring) return null;
  return estimateNextRecurringTransaction(
    transactions.value.map(t => ({ date: t.transaction_date, amount: t.amount }))
  );
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <div v-if="!category">
        <p class="text-center text-gray-500">Catégorie introuvable.</p>
      </div>
      <div v-else>
        <div class="flex items-center justify-between mb-6">
          <router-link
            to="/categories"
            class="text-indigo-600 hover:underline"
          >
            ← Retour aux catégories
          </router-link>
          <h1 class="text-3xl font-extrabold text-gray-900 text-center flex-1 m-0">
            {{ category.label }}
          </h1>
          <span class="w-40"></span> <!-- Espaceur pour équilibrer la ligne -->
        </div>
        <div class="mb-4">
          <span v-if="category.is_recurring" class="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Récurrente</span>
          <span v-else class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Ponctuelle</span>
        </div>
        <div v-if="category.is_recurring && recurringEstimate">
          <div class="mb-4 p-4 bg-indigo-50 rounded">
            <div class="font-semibold">Prochaine transaction estimée :</div>
            <div>Jour du mois : <span class="font-mono">{{ recurringEstimate.estimatedDay }}</span></div>
            <div>Montant estimé : <span class="font-mono">{{ recurringEstimate.nextAmount }} €</span></div>
          </div>
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-2">Transactions associées</h3>
        <div v-if="isLoading" class="text-center">Chargement...</div>
        <div v-else-if="transactions.length === 0" class="text-center text-gray-400">Aucune transaction.</div>
        <ul v-else class="divide-y divide-gray-200">
          <li v-for="tx in transactions" :key="tx.id" class="py-2 flex justify-between">
            <span>{{ new Date(tx.transaction_date).toLocaleDateString() }}</span>
            <span class="font-mono">{{ tx.amount }} €</span>
          </li>
        </ul>
        <div v-if="error" class="text-red-600 mt-4 text-center">{{ error.message }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
