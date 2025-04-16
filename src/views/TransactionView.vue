<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useTransactionStore } from "@/stores/transaction";
import { useCategoryStore } from "@/stores/category";
import { useRouter } from "vue-router";

const transactionStore = useTransactionStore();

const categoryStore = useCategoryStore();

const router = useRouter();

onMounted(() => {
  categoryStore.fetchCategories();
});

function getCategoryLabel(categoryId: string | null) {
  const cat = categoryStore.categories.find((c) => c.id === categoryId);
  return cat ? cat.label : "-";
}

async function handleEdit(txId: string) {
  const tx = await transactionStore.fetchTransactionById(txId);
  if (tx) {
    router.push({
      path: `/transactions/${txId}/edit`,
      state: { transaction: tx },
    });
  } else {
    alert("Erreur lors du chargement de la transaction.");
  }
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
      <div v-if="transactionStore.error" class="text-red-600 mb-4 text-center">
        {{ transactionStore.error }}
      </div>
      <div v-if="transactionStore.loading" class="text-center">
        Chargement...
      </div>
      <ul>
        <li
          v-for="tx in transactionStore.transactions"
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
