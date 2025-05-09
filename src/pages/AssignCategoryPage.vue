<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Assigner une catégorie à plusieurs transactions
      </h1>
      <div
        class="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between relative"
      >
        <input
          v-model="search"
          class="flex-1 border rounded px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
          placeholder="Rechercher des transactions..."
        />
        <input
          v-model.number="montantMin"
          class="w-32 border rounded px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Montant min"
          step="0.01"
          type="number"
        />
        <input
          v-model.number="montantMax"
          class="w-32 border rounded px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Montant max"
          step="0.01"
          type="number"
        />
        <button
          v-if="search"
          aria-label="Effacer la recherche"
          class="absolute right-24 sm:right-36 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          type="button"
          @click="clearSearch"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
        </button>
        <button
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
          @click="fetchTransactions"
        >
          Rechercher
        </button>
      </div>
      <div class="mb-4 flex items-center gap-4">
        <label class="flex items-center gap-2">
          <input v-model="showWithoutCategory" type="checkbox" />
          Afficher uniquement les transactions sans catégorie
        </label>
      </div>
      <div
        class="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 sm:space-x-4 whitespace-nowrap"
      >
        <Multiselect
          v-model="selectedCategory"
          :allow-empty="true"
          :options="sortedCategories"
          :taggable="true"
          class="min-w-[200px] w-full sm:w-auto"
          label="label"
          placeholder="Sélectionner ou créer une catégorie"
          track-by="id"
          @tag="handleCategoryCreate"
        />
        <button
          :disabled="!canAssign"
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
          @click="assignCategory"
        >
          Assigner la catégorie
        </button>
      </div>
      <div
        v-if="message"
        :class="[
          'mb-4 p-3 rounded text-center',
          messageType === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800',
        ]"
      >
        {{ message }}
      </div>
      <div class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-center">
                <input
                  :aria-label="
                    allSelected ? 'Tout décocher' : 'Tout sélectionner'
                  "
                  :checked="allSelected"
                  type="checkbox"
                  @change="toggleSelectAll"
                />
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Date
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Libellé
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Montant (€)
              </th>
              <th
                class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Catégorie
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="tx in filteredTransactions" :key="tx.id">
              <td class="px-4 py-2 text-center">
                <input v-model="selectedIds" :value="tx.id" type="checkbox" />
              </td>
              <td class="px-4 py-2">{{ formatDate(tx.transaction_date) }}</td>
              <td class="px-4 py-2">{{ tx.label }}</td>
              <td
                :class="tx.amount < 0 ? 'text-red-600' : 'text-green-600'"
                class="px-4 py-2"
              >
                {{ formatAmount(tx.amount) }}
              </td>
              <td class="px-4 py-2">{{ getCategoryLabel(tx.category_id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Category } from '@/queries/useCategories'
import {
  useAddCategoryMutation,
  useCategoriesQuery,
} from '@/queries/useCategories'
import { useTransactionsQuery } from '@/queries/useTransactions'
import { computed, ref, watch, watchEffect } from 'vue'
import type { Tables } from '@/types/supabase'
import { supabase } from '@/supabase'
import Multiselect from 'vue-multiselect'
import { useQueryClient } from '@tanstack/vue-query'

const search = ref('')
const debouncedSearch = ref(search.value)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, (val) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    debouncedSearch.value = val
  }, 300)
})

const selectedIds = ref<string[]>([])
const selectedCategory = ref<Category | null>(null)
const pendingCategoryId = ref<string | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const showWithoutCategory = ref(false)
const montantMin = ref<number | null>(null)
const montantMax = ref<number | null>(null)

// Récupération des catégories
const { data: categories = [], refetch: refetchCategories } =
  useCategoriesQuery()
const sortedCategories = computed(() => {
  const cats =
    categories && 'value' in categories
      ? (categories.value ?? [])
      : (categories ?? [])
  return [...cats].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
})

watchEffect(() => {
  if (pendingCategoryId.value) {
    const found = sortedCategories.value.find(
      (cat) => cat.id === pendingCategoryId.value
    )
    if (found) {
      selectedCategory.value = found
      pendingCategoryId.value = null
    }
  }
})

// Récupération des transactions filtrées côté serveur
const page = ref(1)
const pageSize = 1000
const { data: allTransactions = { data: [], count: 0 }, refetch } =
  useTransactionsQuery(page, pageSize, debouncedSearch, showWithoutCategory)

const filteredTransactions = computed(() => {
  // allTransactions peut être une ref ou un objet direct
  const data =
    allTransactions && 'value' in allTransactions
      ? (allTransactions.value?.data ?? [])
      : (allTransactions?.data ?? [])
  let txs = data as Tables<'transaction'>[]
  if (montantMin.value !== null && montantMin.value !== undefined) {
    txs = txs.filter((tx) => tx.amount >= montantMin.value!)
  }
  if (montantMax.value !== null && montantMax.value !== undefined) {
    txs = txs.filter((tx) => tx.amount <= montantMax.value!)
  }
  return txs
})

const canAssign = computed(
  () =>
    selectedIds.value.length > 0 &&
    selectedCategory.value &&
    selectedCategory.value.id
)

const { mutateAsync: addCategory } = useAddCategoryMutation()

const queryClient = useQueryClient()

const allSelected = computed(
  () =>
    filteredTransactions.value.length > 0 &&
    filteredTransactions.value.every((tx: Tables<'transaction'>) =>
      selectedIds.value.includes(tx.id)
    )
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredTransactions.value.map(
      (tx: Tables<'transaction'>) => tx.id
    )
  }
}

async function assignCategory() {
  if (
    !selectedCategory.value ||
    !selectedCategory.value.id ||
    selectedIds.value.length === 0
  )
    return
  try {
    // Un seul appel pour mettre à jour toutes les transactions sélectionnées
    const { error } = await supabase
      .from('transaction')
      .update({ category_id: selectedCategory.value.id })
      .in('id', selectedIds.value)
    if (error) throw new Error(error.message)
    message.value = `Catégorie "${selectedCategory.value.label}" assignée à ${selectedIds.value.length} transaction(s).`
    messageType.value = 'success'
    selectedIds.value = []
    selectedCategory.value = null
    await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    await queryClient.invalidateQueries({ queryKey: ['categories'] })
    refetch()
  } catch (e: unknown) {
    message.value =
      e instanceof Error ? e.message : "Erreur lors de l'assignation."
    messageType.value = 'error'
  }
}

async function handleCategoryCreate(newLabel: string) {
  try {
    const cat = await addCategory({ label: newLabel })
    pendingCategoryId.value = cat.id
    await refetchCategories()
    // Sélectionner l'objet catégorie dès qu'il est dans la liste
    const found = sortedCategories.value.find((c) => c.id === cat.id)
    if (found) {
      selectedCategory.value = found
      pendingCategoryId.value = null
    }
  } catch (e: unknown) {
    message.value =
      e instanceof Error
        ? e.message
        : 'Erreur lors de la création de la catégorie.'
    messageType.value = 'error'
  }
}

function fetchTransactions() {
  // Le filtrage est maintenant côté serveur, la réactivité de search suffit
  refetch()
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR')
}

function getCategoryLabel(categoryId: string | null) {
  // categories peut être une ref ou un tableau direct
  const cats =
    categories && 'value' in categories
      ? (categories.value ?? [])
      : (categories ?? [])
  const cat = cats.find((c: Tables<'category'>) => c.id === categoryId)
  return cat ? cat.label : '-'
}

function clearSearch() {
  search.value = ''
  debouncedSearch.value = ''
  fetchTransactions()
}
</script>

<style scoped>
/* Pas de style custom, tout est géré par Tailwind */
</style>
