<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useTransactionStore } from "@/stores/transaction";
import { useCategoryStore } from "@/stores/category";
import { storeToRefs } from "pinia";

const router = useRouter();
const transactionStore = useTransactionStore();
const categoryStore = useCategoryStore();

const label = ref("");
const amount = ref(0);
const transaction_date = ref("");
const category_id = ref("");
const error = ref("");
const loading = ref(false);

categoryStore.fetchCategories();

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await transactionStore.addTransaction({
      label: label.value,
      amount: amount.value,
      transaction_date: transaction_date.value,
      category_id: category_id.value || null,
    });
    router.push("/transactions");
  } catch (e: any) {
    error.value = e.message || "Erreur lors de la création";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div
      class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <h1 class="text-2xl font-bold mb-6 text-center">Créer une transaction</h1>
      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block mb-1">Libellé</label>
          <input
            v-model="label"
            required
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block mb-1">Montant (€)</label>
          <input
            v-model.number="amount"
            type="number"
            required
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block mb-1">Date</label>
          <input
            v-model="transaction_date"
            type="date"
            required
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block mb-1">Catégorie</label>
          <select v-model="category_id" class="w-full border rounded px-3 py-2">
            <option value="">Aucune</option>
            <option
              v-for="cat in categoryStore.categories"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.label }}
            </option>
          </select>
        </div>
        <div v-if="error" class="text-red-600 text-center">{{ error }}</div>
        <div class="flex justify-between items-center">
          <button
            type="button"
            @click="() => router.push('/transactions')"
            class="text-gray-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
          >
            Créer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}
</style>
