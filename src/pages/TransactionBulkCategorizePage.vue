<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <UContainer>
      <UCard :ui="{ body: 'p-0 sm:p-0', base: 'rounded-xl shadow-md overflow-hidden' }">
        <div class="p-6 sm:p-8">
          <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
            Catégorisation en masse
          </h1>
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Colonne gauche -->
            <div class="flex-1 min-w-0">
              <h2
                v-if="latestUncategorized?.label"
                class="text-xl font-semibold text-center text-indigo-700 mb-4"
              >
                {{ latestUncategorized.label }}
              </h2>
              <div class="mb-8">
                <UFormField label="Libellé de la transaction">
                  <UInput ref="inputLabelRef" v-model="inputLabel" placeholder="Libellé..." />
                </UFormField>
              </div>
              <div>
                <h3 class="text-lg font-bold mb-2">Transactions correspondantes</h3>
                <div v-if="isLoadingMatching" class="text-center text-gray-500 py-4">
                  Chargement...
                </div>
                <div v-else-if="errorMatching" class="text-center text-red-600 py-4">
                  Erreur : {{ errorMatching.message }}
                </div>
                <div
                  v-else-if="matchingTransactions?.data?.length === 0"
                  class="text-center text-gray-400 py-4"
                >
                  Aucune transaction trouvée.
                </div>
                <div v-else>
                  <TransactionList
                    :disableSelection="true"
                    :disableTags="true"
                    :transactions="matchingTransactionRows"
                  />
                </div>
              </div>
            </div>
            <!-- Colonne droite : catégories -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold mb-4">Catégories</h3>
              <UFormField label="Filtrer les catégories">
                <div class="flex gap-2 items-center">
                  <UInput
                    ref="categoryFilterRef"
                    v-model="categoryFilter"
                    placeholder="Filtrer par nom..."
                  />
                  <UButton
                    v-if="selectedCategory"
                    color="primary"
                    :disabled="isBulkUpdating"
                    label="Associer à toutes"
                    @click="assignCategoryToAll"
                  />
                </div>
              </UFormField>
              <div v-if="suggestedCategory" class="w-full mb-2 text-xs text-gray-500">
                Suggestion :
                <span class="font-semibold">{{ suggestedCategory.label }}</span>
                <span
                  v-if="selectedCategory && selectedCategory.id === suggestedCategory.id"
                  class="ml-2 text-green-600"
                >
                  (sélectionnée)
                </span>
                <button
                  v-else
                  class="ml-2 text-indigo-600 underline"
                  type="button"
                  @click="selectCategory(suggestedCategory)"
                >
                  Utiliser cette catégorie
                </button>
              </div>
              <div class="flex flex-wrap gap-2 mt-4">
                <div v-if="filteredCategories.length > 0" class="flex flex-wrap gap-2">
                  <button
                    v-for="cat in filteredCategories"
                    :key="cat.id"
                    class="px-3 py-1 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    :class="{
                      'ring-2 ring-indigo-500': selectedCategory && selectedCategory.id === cat.id,
                    }"
                    type="button"
                    @click="selectCategory(cat)"
                  >
                    {{ cat.label }}
                    <span
                      v-if="cat.is_recurring"
                      class="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded"
                    >
                      Récurrente
                    </span>
                    <span v-else class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      Ponctuelle
                    </span>
                  </button>
                </div>
                <button
                  v-if="categoryFilter.trim()"
                  class="px-3 py-1 rounded-full border border-green-300 bg-green-50 text-green-700 font-medium hover:bg-green-100 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="categoryExists"
                  type="button"
                  @click="createCategoryFromFilter"
                >
                  Créer la catégorie "{{ categoryFilter }}"
                </button>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch, computed, nextTick, onMounted } from 'vue'
  import {
    useLatestUncategorizedTransactionQuery,
    useTransactionsQuery,
    useUpdateTransactionMutation,
    useAllTransactionsWithCategoryQuery,
  } from '@/queries/useTransactions'
  import { useCategoriesQuery, useAddCategoryMutation } from '@/queries/useCategories'
  import { recommendCategoryForTransaction } from '@/services/categoryRecommendationService'
  import type { Category } from '@/queries/useCategories'
  import TransactionList from '@/components/TransactionList.vue'

  const inputLabel = ref('')
  const inputLabelRef = ref<HTMLInputElement | null>(null)
  const categoryFilter = ref('')
  const categoryFilterRef = ref<{ inputRef: HTMLInputElement | null } | null>(null)
  const selectedCategory = ref<Category | null>(null)
  const isBulkUpdating = ref(false)

  const { data: latestUncategorized, refetch: refetchLatestUncategorized } =
    useLatestUncategorizedTransactionQuery()

  onMounted(() => {
    refetchLatestUncategorized()
  })

  // Met à jour la valeur de l'input à chaque fetch d'une transaction
  watch(
    () => latestUncategorized.value,
    (tx) => {
      inputLabel.value = tx?.label ?? ''
    },
    { immediate: true }
  )

  // Récupère toutes les transactions dont le label correspond à inputLabel
  const labelFilter = computed(() => ({
    label: inputLabel.value,
    dateMin: '',
    dateMax: '',
    amountMin: null,
    amountMax: null,
    category: null,
    tag: null,
  }))
  const {
    data: matchingTransactions,
    isLoading: isLoadingMatching,
    error: errorMatching,
  } = useTransactionsQuery(1, 100, labelFilter, false)

  const matchingTransactionRows = computed(() => {
    return (matchingTransactions.value?.data ?? []).map((tx) => ({
      ...tx,
      tags: tx.tags ?? [],
      category: tx.category ?? null,
    }))
  })

  // Récupère les catégories filtrées
  const { data: categories, refetch: refetchCategories } = useCategoriesQuery()
  const { mutateAsync: addCategory } = useAddCategoryMutation()
  const { mutateAsync: updateTransaction } = useUpdateTransactionMutation()

  const filteredCategories = computed(() => {
    if (!categories?.value) return []
    const filter = categoryFilter.value.trim().toLowerCase()
    if (!filter) return categories.value
    return categories.value.filter((cat) => cat.label.toLowerCase().includes(filter))
  })

  const categoryExists = computed(() => {
    const filter = categoryFilter.value.trim().toLowerCase()
    if (!filter || !categories?.value) return false
    return categories.value.some((cat) => cat.label.trim().toLowerCase() === filter)
  })

  // Récupère toutes les transactions avec leur catégorie pour la suggestion
  const { data: allTxWithCat } = useAllTransactionsWithCategoryQuery()

  // Suggestion de catégorie pour le label courant (fuzzy)
  const suggestedCategory = computed(() => {
    if (!inputLabel.value || !allTxWithCat?.value) return null
    return recommendCategoryForTransaction(
      { label: inputLabel.value },
      allTxWithCat.value.map((tx) => ({
        ...tx,
        amount: 0,
        category_id: null,
        created_at: '',
        id: '',
        transaction_date: '',
        user_id: '',
      }))
    )
  })

  watch(
    filteredCategories,
    (cats) => {
      if (cats.length === 1) {
        selectedCategory.value = cats[0]
      } else if (cats.length === 0) {
        selectedCategory.value = null
      }
    },
    { immediate: true }
  )

  // Sélectionne une catégorie
  async function selectCategory(category: Category) {
    selectedCategory.value = category
  }

  // Associe la catégorie sélectionnée à toutes les transactions trouvées
  async function assignCategoryToAll() {
    if (!selectedCategory.value || !matchingTransactions?.value?.data?.length) return
    isBulkUpdating.value = true
    try {
      await Promise.all(
        matchingTransactions.value.data.map((tx) =>
          updateTransaction({ id: tx.id, updates: { category_id: selectedCategory.value!.id } })
        )
      )
      await refetchLatestUncategorized() // Refetch une nouvelle transaction sans catégorie
      categoryFilter.value = ''
      selectedCategory.value = null
      nextTick(() => {
        setTimeout(() => {
          nextTick(() => {
            categoryFilterRef.value?.inputRef?.focus()
          })
        }, 0)
      })
    } finally {
      isBulkUpdating.value = false
    }
  }

  // Crée une catégorie à partir du filtre
  async function createCategoryFromFilter() {
    if (!categoryFilter.value.trim()) return
    const label = categoryFilter.value.trim()
    const cat = await addCategory({ label, is_recurring: false })
    await refetchCategories() // Refetch la liste des catégories après ajout
    selectedCategory.value = cat
  }
</script>

<style scoped></style>
