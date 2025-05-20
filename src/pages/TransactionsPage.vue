<script lang="ts" setup>
  import { useAddBulkTransactionsMutation, useTransactionsQuery } from '@/queries/useTransactions'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TransactionList from '@/components/TransactionList.vue'
  import TransactionFilterForm from '@/components/TransactionFilterForm.vue'
  import TransactionBulkActions from '@/components/TransactionBulkActions.vue'
  import TransactionCreatePanel from '@/components/TransactionCreatePanel.vue'
  import type { TransactionFilter } from '@/types/TransactionFilter'
  import { importTransactionsFromFile } from '@/services/import/transactionImportService'
  import { setTransactionSaveHandlers } from '@/services/import/transactionSaveService'

  const page = ref(1)
  const pageSize = ref(50)
  const filters = ref<TransactionFilter>({
    label: '',
    dateMin: '',
    dateMax: '',
    amountMin: null,
    amountMax: null,
    category: null,
    tag: null,
  })

  const openPanel = ref<null | 'create' | 'filters' | 'bulk'>(null)

  function openPanelUnique(panel: 'create' | 'filters' | 'bulk') {
    openPanel.value = panel
  }

  function closePanel() {
    openPanel.value = null
  }

  const selectedTransactions = ref([]) // À connecter plus tard à la sélection réelle

  const activeFiltersCount = computed(() => {
    let count = 0
    const f = filters.value
    if (f.label && f.label.trim() !== '') count++
    if (f.dateMin && f.dateMin.trim() !== '') count++
    if (f.dateMax && f.dateMax.trim() !== '') count++
    if (f.amountMin !== null && f.amountMin !== undefined) count++
    if (f.amountMax !== null && f.amountMax !== undefined) count++
    if (f.category) count++
    if (f.tag) count++
    return count
  })

  const {
    data: transactionsResponse,
    isLoading,
    error,
  } = useTransactionsQuery(page, pageSize, filters, false)

  const { mutateAsync: addBulkTransactions } = useAddBulkTransactionsMutation()
  const { refetch: refreshPaginatedTransactions } = useTransactionsQuery(
    page,
    pageSize,
    filters,
    false
  )

  setTransactionSaveHandlers({ addBulkTransactions, refreshPaginatedTransactions })

  // Sécurité : page ne doit jamais être < 1
  watch(page, (val) => {
    if (val < 1 || isNaN(val)) {
      page.value = 1
    } else {
      refreshPaginatedTransactions()
    }
  })

  // Ajout : refetch quand pageSize change
  watch(pageSize, () => {
    page.value = 1 // On revient à la première page si la taille change
    refreshPaginatedTransactions()
  })

  const transactions = computed(() => transactionsResponse.value?.data ?? [])
  const total = computed(() => transactionsResponse.value?.count ?? 0)
  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.ceil(total.value / pageSize.value) : 1
  )
  const deleteError = ref('')

  function handleTransactionCreated() {
    refreshPaginatedTransactions()
  }

  // Pour l'import CSV
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isImporting = ref(false)
  const importMessage = ref('')
  const importError = ref('')

  const openFileDialog = () => {
    if (fileInputRef.value && !isImporting.value) {
      fileInputRef.value.click()
    }
  }

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    isImporting.value = true
    importMessage.value = ''
    importError.value = ''

    try {
      const result = await importTransactionsFromFile(file)
      importError.value = '' // Réinitialise l'erreur avant d'afficher le message de succès
      if (result.error) {
        importError.value = result.error
        importMessage.value = ''
      } else if (result.addedCount > 0) {
        importMessage.value = `${result.addedCount} transaction(s) ajoutée(s). ${result.duplicateCount} transaction(s) déjà existante(s). ${result.invalidCount} ligne(s) invalide(s) ignorée(s).`
      } else {
        importMessage.value = `Aucune nouvelle transaction à ajouter. ${result.invalidCount} ligne(s) invalide(s) ignorée(s).`
      }
    } catch (e: unknown) {
      importError.value = (e as Error).message || 'Une erreur est survenue.'
      importMessage.value = ''
    } finally {
      isImporting.value = false
      if (fileInputRef.value) fileInputRef.value.value = ''
    }
  }

  const route = useRoute()
  const router = useRouter()

  // Helpers pour parser/stringifier les filtres
  function filtersToQuery(filters: TransactionFilter): Record<string, string> {
    const query: Record<string, string> = {}
    if (filters.label) {
      query.label = filters.label
    }
    if (filters.dateMin) {
      query.dateMin = filters.dateMin
    }
    if (filters.dateMax) {
      query.dateMax = filters.dateMax
    }
    if (filters.amountMin !== null) {
      query.amountMin = String(filters.amountMin)
    }
    if (filters.amountMax !== null) {
      query.amountMax = String(filters.amountMax)
    }
    if (filters.category) {
      query.category = filters.category
    }
    if (filters.tag) {
      query.tag = filters.tag
    }
    return query
  }

  function getQueryString(val: unknown): string {
    if (Array.isArray(val)) {
      return val[0] ?? ''
    }
    return typeof val === 'string' ? val : ''
  }

  function getQueryNumber(val: unknown): number | null {
    const s = getQueryString(val)
    return s !== '' ? Number(s) : null
  }

  function queryToFilters(query: Record<string, unknown>): {
    filters: TransactionFilter
    page: number
    pageSize: number
  } {
    return {
      filters: {
        label: getQueryString(query.label),
        dateMin: getQueryString(query.dateMin),
        dateMax: getQueryString(query.dateMax),
        amountMin: getQueryNumber(query.amountMin),
        amountMax: getQueryNumber(query.amountMax),
        category: getQueryString(query.category) || null,
        tag: getQueryString(query.tag) || null,
      },
      page: query.page ? Number(getQueryString(query.page)) : 1,
      pageSize: query.pageSize ? Number(getQueryString(query.pageSize)) : 50,
    }
  }

  // Initialisation depuis l'URL
  const {
    filters: initialFilters,
    page: initialPage,
    pageSize: initialPageSize,
  } = queryToFilters(route.query)
  filters.value = { ...filters.value, ...initialFilters }
  page.value = initialPage
  pageSize.value = initialPageSize

  // Sync URL à chaque changement
  watch(
    [filters, page, pageSize],
    ([newFilters, newPage, newPageSize]) => {
      const query = {
        ...filtersToQuery(newFilters),
        page: newPage !== 1 ? String(newPage) : undefined,
        pageSize: newPageSize !== 50 ? String(newPageSize) : undefined,
      }
      router.replace({ query })
    },
    { deep: true }
  )

  // Watch pour réagir aux changements d'URL (ex:: navigation arrière)
  watch(
    () => route.query,
    (newQuery) => {
      const { filters: qFilters, page: qPage, pageSize: qPageSize } = queryToFilters(newQuery)
      // Mettre à jour que si différent pour éviter de casser la pagination
      const filtersChanged =
        JSON.stringify(filters.value) !== JSON.stringify({ ...filters.value, ...qFilters })
      const pageChanged = page.value !== qPage
      const pageSizeChanged = pageSize.value !== qPageSize
      if (filtersChanged) {
        filters.value = { ...filters.value, ...qFilters }
      }
      if (pageChanged) {
        page.value = qPage
      }
      if (pageSizeChanged) {
        pageSize.value = qPageSize
      }
    }
  )
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <UContainer>
      <UCard :ui="{ body: 'p-0 sm:p-0', base: 'rounded-xl shadow-md overflow-hidden' }">
        <div class="p-6 sm:p-8">
          <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">Transactions</h1>
          <!-- Bandeau de boutons avec Nuxt UI -->
          <div
            class="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-4 mb-8 px-4 py-3 bg-gray-50 rounded-lg shadow-sm border border-gray-200"
          >
            <UButton
              block
              class="w-full sm:w-auto"
              color="primary"
              icon="i-heroicons-plus"
              :label="openPanel === 'create' ? 'Masquer création' : 'Créer transaction'"
              size="md"
              variant="outline"
              @click="openPanel === 'create' ? closePanel() : openPanelUnique('create')"
            />
            <UButton
              block
              class="w-full sm:w-auto"
              color="primary"
              :disabled="isImporting"
              icon="i-heroicons-arrow-up-tray"
              :label="isImporting ? 'Import en cours...' : 'Importer CSV'"
              :loading="isImporting"
              size="md"
              variant="outline"
              @click="openFileDialog"
            >
              <template v-if="isImporting" #trailing>
                <UBadge class="ml-2" color="primary" variant="soft">...</UBadge>
              </template>
            </UButton>
            <input
              id="csv-upload"
              ref="fileInputRef"
              accept=".csv,.ofx"
              class="hidden"
              type="file"
              @change="handleFileUpload"
            />
            <UButton
              block
              class="w-full sm:w-auto"
              color="primary"
              icon="i-heroicons-magnifying-glass"
              :label="openPanel === 'filters' ? 'Masquer recherche' : 'Recherche & filtres'"
              size="md"
              variant="outline"
              @click="openPanel === 'filters' ? closePanel() : openPanelUnique('filters')"
            >
              <template v-if="activeFiltersCount > 0" #trailing>
                <UBadge class="ml-2" color="primary" variant="soft">
                  {{ activeFiltersCount }}
                </UBadge>
              </template>
            </UButton>
            <UButton
              block
              class="w-full sm:w-auto"
              color="warning"
              icon="i-heroicons-rectangle-group"
              :label="openPanel === 'bulk' ? 'Masquer actions lot' : 'Actions en lot'"
              size="md"
              variant="outline"
              @click="openPanel === 'bulk' ? closePanel() : openPanelUnique('bulk')"
            >
              <template v-if="selectedTransactions.length > 0" #trailing>
                <UBadge class="ml-2" color="warning" variant="soft">
                  {{ selectedTransactions.length }}
                </UBadge>
              </template>
            </UButton>
            <span v-if="isImporting" class="text-sm text-gray-600 sm:ml-2">Traitement...</span>
          </div>
          <Transition name="fade">
            <TransactionCreatePanel
              v-if="openPanel === 'create'"
              @close="closePanel"
              @created="handleTransactionCreated"
            />
          </Transition>
          <Transition name="fade">
            <TransactionFilterForm
              v-if="openPanel === 'filters'"
              v-model:filters="filters"
              @close="closePanel"
            />
          </Transition>
          <Transition name="fade">
            <TransactionBulkActions
              v-if="openPanel === 'bulk'"
              :selected-transactions="selectedTransactions"
              @close="closePanel"
            />
          </Transition>
          <UAlert
            v-if="importMessage"
            class="mb-4 text-center"
            color="success"
            :description="importMessage"
            title="Import réussi"
            variant="soft"
          />
          <UAlert
            v-if="importError"
            class="mb-4 text-center"
            color="error"
            :description="importError"
            variant="soft"
          />
          <UAlert
            v-if="error"
            class="mb-4 text-center"
            color="error"
            :description="error.message"
            variant="soft"
          />
          <UAlert
            v-if="deleteError"
            class="mb-4 text-center"
            color="error"
            :description="deleteError"
            variant="soft"
          />
          <div class="mb-4 mt-6 flex flex-wrap gap-2 justify-between items-center text-sm">
            <UPagination
              v-if="totalPages > 1"
              v-model:page="page"
              :items-per-page="pageSize"
              show-first
              show-last
              :total="total"
            />
            <div class="flex items-center gap-2 ml-auto">
              <label for="page-size-select">Résultats par page :</label>
              <USelect
                id="page-size-select"
                v-model="pageSize"
                class="w-32"
                :items="[
                  { label: '10', value: 10 },
                  { label: '25', value: 25 },
                  { label: '50', value: 50 },
                  { label: '100', value: 100 },
                  { label: '500', value: 500 },
                  { label: '1000 (max)', value: 1000 },
                ]"
                @change="page = 1"
              />
            </div>
          </div>
          <div v-if="isLoading" class="text-center">Chargement...</div>
          <div v-else>
            <div class="overflow-x-auto">
              <TransactionList
                :transactions="transactions"
                @update:selected="selectedTransactions = $event"
              />
            </div>
          </div>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>

<style scoped>
  input:disabled {
    background: #f3f3f3;
  }

  /* Style pour cacher l'input file par défaut mais le rendre accessible */
  input[type='file'].hidden {
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }

  label[for='csv-upload']:disabled {
    cursor: not-allowed;
  }
</style>
