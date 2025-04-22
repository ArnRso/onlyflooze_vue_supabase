<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  useTransactionsQuery,
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from "@/queries/useTransactions";
import { useCategoriesQuery } from "@/queries/useCategories";
import { ref, computed } from "vue";

const router = useRouter();
const page = ref(1);
const pageSize = 50;
const {
  data: transactionsResponse,
  isLoading,
  error,
} = useTransactionsQuery(page, pageSize);
const transactions = computed(() => transactionsResponse.value?.data ?? []);
const total = computed(() => transactionsResponse.value?.count ?? 0);
const totalPages = computed(() => Math.ceil(total.value / pageSize));
const { data: categories } = useCategoriesQuery();
const { mutateAsync: deleteTransaction, isPending: isDeleting } =
  useDeleteTransactionMutation();
const { mutateAsync: updateTransaction, isPending: isUpdating } =
  useUpdateTransactionMutation();
const deleteError = ref("");

// Pour l'édition inline
const editId = ref<string | null>(null);
const editLabel = ref("");
const editAmount = ref(0);
const editCategoryId = ref("");
const editDate = ref("");
const editError = ref("");

function startEdit(tx: any) {
  editId.value = tx.id;
  editLabel.value = tx.label;
  editAmount.value = tx.amount;
  editCategoryId.value = tx.category_id || "";
  editDate.value = tx.transaction_date || "";
  editError.value = "";
}

function cancelEdit() {
  editId.value = null;
  editLabel.value = "";
  editAmount.value = 0;
  editCategoryId.value = "";
  editDate.value = "";
  editError.value = "";
}

async function saveEdit(tx: any) {
  editError.value = "";
  try {
    await updateTransaction({
      id: tx.id,
      updates: {
        label: editLabel.value,
        amount: editAmount.value,
        category_id: editCategoryId.value || null,
        transaction_date: editDate.value,
      },
    });
    cancelEdit();
  } catch (e: any) {
    editError.value = e.message || "Erreur lors de la modification";
  }
}

function getCategoryLabel(categoryId: string | null) {
  const cat = categories?.value?.find((c) => c.id === categoryId);
  return cat ? cat.label : "-";
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR");
};

async function handleDelete(txId: string) {
  deleteError.value = "";
  if (confirm("Supprimer cette transaction ?")) {
    try {
      await deleteTransaction(txId);
    } catch (e: any) {
      deleteError.value = e.message || "Erreur lors de la suppression";
    }
  }
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Transactions
      </h1>
      <div class="mb-6 flex justify-end">
        <button
          @click="() => router.push('/transactions/new')"
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
        >
          Créer une transaction
        </button>
      </div>
      <div v-if="error" class="text-red-600 mb-4 text-center">
        {{ error.message }}
      </div>
      <div v-if="deleteError" class="text-red-600 mb-4 text-center">
        {{ deleteError }}
      </div>
      <div
        v-if="totalPages > 1"
        class="mb-4 mt-6 flex justify-between items-center text-sm"
      >
        <a
          href="#"
          @click.prevent="() => goToPage(page - 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === 1 },
          ]"
        >
          Précédent
        </a>
        <span>Page {{ page }} sur {{ totalPages }}</span>
        <a
          href="#"
          @click.prevent="() => goToPage(page + 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === totalPages },
          ]"
        >
          Suivant
        </a>
      </div>
      <div v-else style="height: 24px"></div>
      <div v-if="isLoading" class="text-center">Chargement...</div>
      <div v-else>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Libellé
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Montant (€)
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Catégorie
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="tx in transactions" :key="tx.id">
              <template v-if="editId === tx.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="editLabel"
                    class="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model.number="editAmount"
                    type="number"
                    class="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <input
                    v-model="editDate"
                    type="date"
                    class="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select
                    v-model="editCategoryId"
                    class="border rounded px-2 py-1 w-full"
                  >
                    <option value="">Aucune</option>
                    <option
                      v-for="cat in categories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.label }}
                    </option>
                  </select>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-end"
                >
                  <button
                    @click="() => saveEdit(tx)"
                    :disabled="isUpdating"
                    class="bg-green-600 text-white px-2 py-1 rounded shadow"
                  >
                    Valider
                  </button>
                  <button
                    @click="cancelEdit"
                    class="bg-gray-300 px-2 py-1 rounded"
                  >
                    Annuler
                  </button>
                </td>
              </template>
              <template v-else>
                <td class="px-6 py-4 whitespace-nowrap">{{ tx.label }}</td>
                <td
                  class="px-6 py-4 whitespace-nowrap"
                  :class="tx.amount < 0 ? 'text-red-600' : 'text-green-600'"
                >
                  {{ formatAmount(tx.amount) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ formatDate(tx.transaction_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ getCategoryLabel(tx.category_id) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    @click="() => startEdit(tx)"
                    class="text-blue-600 hover:underline mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    @click="() => handleDelete(tx.id)"
                    :disabled="isDeleting"
                    class="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        <div v-if="editError" class="text-red-600 text-center mt-2">
          {{ editError }}
        </div>
      </div>
      <div
        v-if="totalPages > 1"
        class="mt-6 flex justify-between items-center text-sm"
      >
        <a
          href="#"
          @click.prevent="() => goToPage(page - 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === 1 },
          ]"
        >
          Précédent
        </a>
        <span>Page {{ page }} sur {{ totalPages }}</span>
        <a
          href="#"
          @click.prevent="() => goToPage(page + 1)"
          :class="[
            'text-indigo-600 hover:underline',
            { 'opacity-40 pointer-events-none': page === totalPages },
          ]"
        >
          Suivant
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}
</style>
