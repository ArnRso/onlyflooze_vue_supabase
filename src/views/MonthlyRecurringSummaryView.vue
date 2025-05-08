<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
      <div class="flex items-center justify-between mb-6">
        <button @click="prevMonth" class="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold">&lt;</button>
        <h1 class="text-3xl font-extrabold text-gray-900 text-center">
          Récapitulatif des opérations récurrentes – Mois de {{ new Date(selectedYear, selectedMonth).toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) }}
        </h1>
        <button @click="nextMonth" class="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold">&gt;</button>
      </div>
      <div class="mb-8">
        <table class="min-w-full divide-y divide-gray-200 bg-gray-50 rounded">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Déjà sortis</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Déjà rentrés</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prévu à sortir</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prévu à rentrer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="px-4 py-2 text-left text-lg font-bold text-green-700">
                {{ totalSorti.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}
              </td>
              <td class="px-4 py-2 text-left text-lg font-bold text-green-700">
                {{ totalRentre.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}
              </td>
              <td class="px-4 py-2 text-right text-lg font-bold text-blue-700">
                {{ totalAPrevoir.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}
              </td>
              <td class="px-4 py-2 text-right text-lg font-bold text-blue-700">
                {{ totalARentrer.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="isLoading" class="text-center py-8">Chargement...</div>
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
              <td class="px-4 py-2 font-semibold">
                <div class="flex items-center gap-2">
                  <router-link :to="{ name: 'category-detail', params: { id: cat.id } }" class="text-indigo-600 hover:underline flex-shrink-0" title="Voir le détail">
                    <MdiMagnify class="inline w-5 h-5 align-text-bottom" />
                  </router-link>
                  <span class="truncate">{{ cat.label }}</span>
                </div>
              </td>
              <td class="px-4 py-2">
                <span v-if="cat.estimate">{{ cat.estimate.estimatedDay }}</span>
                <span v-else>-</span>
              </td>
              <td
                class="px-4 py-2 text-right"
                :class="{
                  'text-red-600': cat.estimate && cat.estimate.nextAmount < 0,
                  'text-green-600': cat.estimate && cat.estimate.nextAmount > 0
                }"
              >
                <span v-if="cat.estimate">{{ cat.estimate.nextAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}</span>
                <span v-else>-</span>
              </td>
              <td class="px-4 py-2 text-right">
                <template v-if="cat.txThisMonth.length > 0">
                  <span class="text-green-700 font-bold">Déjà en base</span>
                  <ul class="text-xs mt-1">
                    <li v-for="tx in cat.txThisMonth" :key="tx.id">
                      {{ new Date(tx.transaction_date).toLocaleDateString('fr-FR') }} :
                      <span :class="tx.amount < 0 ? 'text-red-600' : 'text-green-600'">
                        {{ tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) }}
                      </span>
                    </li>
                  </ul>
                </template>
                <template v-else-if="cat.estimate">
                  <span class="text-blue-700 font-bold">Prévu le {{ cat.estimate.estimatedDay }}/{{ (selectedMonth+1).toString().padStart(2, '0') }}</span>
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
import { ref, computed } from 'vue';
import { useRecurringCategoriesWithTransactionsQuery } from '@/queries/useCategories';
import { estimateNextRecurringTransaction } from '@/services/recurringTransactionService';
import MdiMagnify from '@/components/icons/MdiMagnify.vue';

const now = new Date();
const selectedMonth = ref(now.getMonth()); // 0-based
const selectedYear = ref(now.getFullYear());

function prevMonth() {
  if (selectedMonth.value === 0) {
    selectedMonth.value = 11;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
}
function nextMonth() {
  if (selectedMonth.value === 11) {
    selectedMonth.value = 0;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
}

const { data: recurringCatsResp, isLoading: isLoadingCats } = useRecurringCategoriesWithTransactionsQuery();
const recurringCategories = computed(() => recurringCatsResp.value ?? []);

const summary = computed(() => {
  return recurringCategories.value.map(cat => {
    const catTx = Array.isArray(cat.transactions) ? cat.transactions as Array<{ transaction_date: string; amount: number; id: string }> : [];
    const txThisMonth = catTx.filter((tx: { transaction_date: string }) => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === selectedYear.value && d.getMonth() === selectedMonth.value;
    });
    const estimate = estimateNextRecurringTransaction(
      catTx.map((t: { transaction_date: string; amount: number }) => ({ date: t.transaction_date, amount: t.amount }))
    );
    return {
      id: cat.id,
      label: cat.label,
      txThisMonth,
      estimate,
    };
  }).sort((a, b) => {
    if (!a.estimate) return 1;
    if (!b.estimate) return -1;
    return a.estimate.estimatedDay - b.estimate.estimatedDay;
  });
});

const totalSorti = computed(() => {
  return summary.value.reduce((sum, cat) => {
    return sum + cat.txThisMonth.filter(tx => tx.amount < 0).reduce((s, tx) => s + tx.amount, 0);
  }, 0);
});
const totalAPrevoir = computed(() => {
  return summary.value.reduce((sum, cat) => {
    if (cat.txThisMonth.length === 0 && cat.estimate && cat.estimate.nextAmount < 0) {
      return sum + cat.estimate.nextAmount;
    }
    return sum;
  }, 0);
});
const totalRentre = computed(() => {
  return summary.value.reduce((sum, cat) => {
    return sum + cat.txThisMonth.filter(tx => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  }, 0);
});
const totalARentrer = computed(() => {
  return summary.value.reduce((sum, cat) => {
    if (cat.txThisMonth.length === 0 && cat.estimate && cat.estimate.nextAmount > 0) {
      return sum + cat.estimate.nextAmount;
    }
    return sum;
  }, 0);
});

const isLoading = computed(() => isLoadingCats && !recurringCatsResp.value);
</script>

<style scoped>
.monthly-recurring-summary {
  max-width: 900px;
  margin: 0 auto;
}
</style>
