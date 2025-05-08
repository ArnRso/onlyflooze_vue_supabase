<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useCategoriesQuery } from "@/queries/useCategories";
import { useCategoryTransactionsQuery } from "@/queries/useTransactions";
import { estimateNextRecurringTransaction } from "@/services/recurringTransactionService";
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

const route = useRoute();
const categoryId = computed(() => route.params.id as string);
const { data: categories } = useCategoriesQuery();
const { data: txResult, isLoading, error } = useCategoryTransactionsQuery(categoryId.value);

const category = computed(() => categories.value?.find(c => c.id === categoryId.value));
const transactions = computed(() => txResult.value?.data || []);

// Métriques pour la catégorie
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();
const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
const prevYear = currentYear - 1;

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

const totalMoisEnCours = computed(() => {
  return transactions.value
    .filter(tx => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
});
const totalMoisPrecedent = computed(() => {
  return transactions.value
    .filter(tx => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === prevMonthYear && d.getMonth() === prevMonth;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
});
const totalAnneeEnCours = computed(() => {
  return transactions.value
    .filter(tx => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
});
const totalAnneePrecedente = computed(() => {
  return transactions.value
    .filter(tx => {
      const d = new Date(tx.transaction_date);
      return d.getFullYear() === prevYear;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
});

const recurringEstimate = computed(() => {
  if (!category.value?.is_recurring) return null;
  // Utiliser toutes les transactions de la catégorie, pas seulement celles chargées par défaut
  return estimateNextRecurringTransaction(
    (txResult.value?.data || []).map(t => ({ date: t.transaction_date, amount: t.amount }))
  );
});

// Générer dynamiquement la liste des mois disponibles dans les transactions
function getAllMonthsLabels() {
  if (!transactions.value.length) return [];
  // Trouver la date min et max
  const dates = transactions.value.map(tx => new Date(tx.transaction_date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  // Début au premier du mois min
  let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const labels = [];
  while (current <= end) {
    labels.push(current.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }));
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  return labels;
}

const allMonthsKeys = computed(() => {
  if (!transactions.value.length) return [];
  const dates = transactions.value.map(tx => new Date(tx.transaction_date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  const keys = [];
  while (current <= end) {
    keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  return keys;
});

const monthlyTotals = computed(() => {
  // Map: 'YYYY-MM' => total
  const map = new Map();
  transactions.value.forEach(tx => {
    const d = new Date(tx.transaction_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + Math.abs(tx.amount));
  });
  // Générer tous les mois disponibles
  return allMonthsKeys.value.map(key => map.get(key) || 0);
});

const monthlyLabels = computed(() => getAllMonthsLabels());

const barChartData = computed(() => ({
  labels: monthlyLabels.value,
  datasets: [
    {
      label: 'Dépense par mois',
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0, // courbe non lissée
      data: monthlyTotals.value
    }
  ]
}));

const barChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(tickValue: string | number) {
          return formatAmount(typeof tickValue === 'number' ? tickValue : Number(tickValue));
        }
      }
    }
  }
};
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
        <div class="mb-6">
          <table class="min-w-full divide-y divide-gray-200 bg-gray-50 rounded text-sm">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Total mois en cours</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Total mois précédent</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Total année en cours</th>
                <th class="px-4 py-2 text-left font-medium text-gray-500">Total année précédente</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-4 py-2 font-mono">{{ formatAmount(totalMoisEnCours) }}</td>
                <td class="px-4 py-2 font-mono">{{ formatAmount(totalMoisPrecedent) }}</td>
                <td class="px-4 py-2 font-mono">{{ formatAmount(totalAnneeEnCours) }}</td>
                <td class="px-4 py-2 font-mono">{{ formatAmount(totalAnneePrecedente) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mb-6">
          <Line :data="barChartData" :options="barChartOptions" />
        </div>
        <h3 class="text-lg font-semibold mt-6 mb-2">Transactions associées</h3>
        <div v-if="isLoading" class="text-center">Chargement...</div>
        <div v-else-if="transactions.length === 0" class="text-center text-gray-400">Aucune transaction.</div>
        <ul v-else class="divide-y divide-gray-200">
          <li v-for="tx in transactions" :key="tx.id" class="py-2 flex justify-between items-center">
            <span>{{ new Date(tx.transaction_date).toLocaleDateString() }}</span>
            <span class="flex-1 text-gray-700 mx-4 truncate">{{ tx.label }}</span>
            <span class="font-mono">{{ formatAmount(tx.amount) }}</span>
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
