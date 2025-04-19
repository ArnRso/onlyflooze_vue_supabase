<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  useTransactionsQuery,
  useDeleteTransactionMutation,
} from "@/queries/useTransactions";
import { useCategoriesQuery } from "@/queries/useCategories";
import { ref, computed } from "vue";

const router = useRouter();
const page = ref(1);
const pageSize = 3;
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
const deleteError = ref("");

function getCategoryLabel(categoryId: string | null) {
  const cat = categories?.value?.find((c) => c.id === categoryId);
  return cat ? cat.label : "-";
}

async function handleEdit(txId: string) {
  router.push({
    path: `/transactions/${txId}/edit`,
  });
}

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
      <div v-if="isLoading" class="text-center">Chargement...</div>
      <ul>
        <li
          v-for="tx in transactions"
          :key="tx.id"
          class="flex items-center justify-between py-2 border-b last:border-b-0"
        >
          <div class="flex-1">
            <div>{{ tx.label }}</div>
            <div class="text-sm text-gray-500">
              {{ tx.amount }} € le {{ tx.transaction_date }}
            </div>
            <div class="text-sm text-gray-500">
              Catégorie: {{ getCategoryLabel(tx.category_id) }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="() => handleEdit(tx.id)"
              class="text-blue-600 hover:underline"
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
          </div>
        </li>
      </ul>
      <div class="mt-6 flex justify-between">
        <button
          @click="() => goToPage(page - 1)"
          :disabled="page === 1"
          class="bg-gray-300 text-gray-700 px-4 py-2 rounded shadow disabled:opacity-50"
        >
          Précédent
        </button>
        <span>Page {{ page }} sur {{ totalPages }}</span>
        <button
          @click="() => goToPage(page + 1)"
          :disabled="page === totalPages"
          class="bg-gray-300 text-gray-700 px-4 py-2 rounded shadow disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}
</style>
