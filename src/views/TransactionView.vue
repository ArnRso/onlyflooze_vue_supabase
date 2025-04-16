<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTransactionsQuery } from "@/queries/useTransactions";
import { useCategoriesQuery } from "@/queries/useCategories";

const router = useRouter();
const { data: transactions, isLoading, error } = useTransactionsQuery();
const { data: categories } = useCategoriesQuery();

function getCategoryLabel(categoryId: string | null) {
  const cat = categories?.value?.find((c) => c.id === categoryId);
  return cat ? cat.label : "-";
}

async function handleEdit(txId: string) {
  router.push({
    path: `/transactions/${txId}/edit`,
  });
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div
      class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
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
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}
</style>
