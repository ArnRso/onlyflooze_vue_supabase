<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAddTransactionMutation } from '@/queries/useTransactions'
import { useCategoriesQuery } from '@/queries/useCategories'

const router = useRouter()
const { data: categories } = useCategoriesQuery()

const label = ref('')
const amount = ref(0)
const transaction_date = ref('')
const category_id = ref('')
const error = ref('')
const { mutateAsync, isPending } = useAddTransactionMutation()

const submit = async () => {
  error.value = ''
  try {
    await mutateAsync({
      label: label.value,
      amount: amount.value,
      transaction_date: transaction_date.value,
      category_id: category_id.value || null,
    })
    await router.push('/transactions')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors de la création'
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
      <h1 class="text-2xl font-bold mb-6 text-center">Créer une transaction</h1>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block mb-1">Libellé</label>
          <input
            v-model="label"
            class="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label class="block mb-1">Montant (€)</label>
          <input
            v-model.number="amount"
            class="w-full border rounded px-3 py-2"
            required
            type="number"
          />
        </div>
        <div>
          <label class="block mb-1">Date</label>
          <input
            v-model="transaction_date"
            class="w-full border rounded px-3 py-2"
            required
            type="date"
          />
        </div>
        <div>
          <label class="block mb-1">Catégorie</label>
          <select v-model="category_id" class="w-full border rounded px-3 py-2">
            <option value="">Aucune</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.label }}
            </option>
          </select>
        </div>
        <div v-if="error" class="text-red-600 text-center">{{ error }}</div>
        <div class="flex justify-between items-center">
          <button
            class="text-gray-600"
            type="button"
            @click="() => router.push('/transactions')"
          >
            Annuler
          </button>
          <button
            :disabled="isPending"
            class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
            type="submit"
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
