<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Récapitulatif des opérations récurrentes – Mois de mai 2025
      </h1>
      <div v-if="isLoadingCategories || isLoadingTx" class="text-center py-8">Chargement...</div>
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200 mt-6">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jour prévu</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant prévu</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="cat in summary" :key="cat.id">
              <td class="px-4 py-2 font-semibold">{{ cat.label }}</td>
              <td class="px-4 py-2">
                <span v-if="cat.estimate">{{ cat.estimate.estimatedDay }}</span>
                <span v-else>-</span>
              </td>
              <td class="px-4 py-2 text-right">
                <span v-if="cat.estimate">{{ cat.estimate.nextAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}</span>
                <span v-else>-</span>
              </td>
              <td class="px-4 py-2 text-right">
                <template v-if="cat.txThisMonth.length > 0">
                  <span class="text-green-700 font-bold">Déjà en base</span>
                  <ul class="text-xs mt-1">
                    <li v-for="tx in cat.txThisMonth" :key="tx.id">
                      {{ new Date(tx.transaction_date).toLocaleDateString('fr-FR') }} :
                      {{ tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}
                    </li>
                  </ul>
                </template>
                <template v-else-if="cat.estimate">
                  <span class="text-blue-700 font-bold">Prévu le {{ cat.estimate.estimatedDay }}/05</span>
                </template>
                <template v-else>
                  <span class="text-gray-400">Pas de données</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCategoriesQuery } from '@/queries/useCategories';
import { useTransactionsQuery } from '@/queries/useTransactions';
import { estimateNextRecurringTransaction } from '@/services/recurringTransactionService';

const currentMonth = 4; // mai (0-based)
const currentYear = 2025;
const today = 8;

const { data: categories, isLoading: isLoadingCategories } = useCategoriesQuery();
const { data: transactionsResp, isLoading: isLoadingTx } = useTransactionsQuery(1, 1000, '', false);

const recurringCategories = computed(() => (categories.value ?? []).filter(c => c.is_recurring));
const allTransactions = computed(() => transactionsResp.value?.data ?? []);

const summary = computed(() => {
  // Pour chaque catégorie récurrente, regrouper ses transactions et calculer la prévision
  return recurringCategories.value.map(cat => {
    const catTx = allTransactions.value.filter(tx => tx.category_id === cat.id);
    // Transactions du mois en cours
    const txThisMonth = catTx.filter(tx => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    // Estimation prochaine occurrence
    const estimate = estimateNextRecurringTransaction(
      catTx.map(t => ({ date: t.transaction_date, amount: t.amount }))
    );
    return {
      id: cat.id,
      label: cat.label,
      txThisMonth,
      estimate,
    };
  }).sort((a, b) => {
    // Trier par jour prévu (estimatedDay)
    if (!a.estimate) return 1;
    if (!b.estimate) return -1;
    return a.estimate.estimatedDay - b.estimate.estimatedDay;
  });
});
</script>

<style scoped>
.monthly-recurring-summary {
  max-width: 900px;
  margin: 0 auto;
}
</style>
