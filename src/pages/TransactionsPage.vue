<script lang="ts" setup>
  import { useRouter, useRoute } from 'vue-router'
  import type { RouteLocationNormalizedLoaded } from 'vue-router'
  import { useAddBulkTransactionsMutation, useTransactionsQuery } from '@/queries/useTransactions'
  import { computed, ref, watch } from 'vue'
  import TransactionList from '@/components/TransactionList.vue'
  import TransactionFilterForm from '@/components/TransactionFilterForm.vue'
  import BulkActionsMenu from '@/components/BulkActionsMenu.vue'
  import TransactionCreatePanel from '@/components/TransactionCreatePanel.vue'
  import type { TransactionFilter } from '@/types/TransactionFilter'

  const router = useRouter()
  const route = useRoute()
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

  // --- Synchronisation URL <-> filtres/page/pageSize ---
  function filtersToQuery(f: TransactionFilter, pageVal: number, pageSizeVal: number) {
    const q: Record<string, string> = {}
    if (f.label) q.label = f.label
    if (f.dateMin) q.dateMin = f.dateMin
    if (f.dateMax) q.dateMax = f.dateMax
    if (f.amountMin !== null && f.amountMin !== undefined) q.amountMin = String(f.amountMin)
    if (f.amountMax !== null && f.amountMax !== undefined) q.amountMax = String(f.amountMax)
    if (f.category) q.category = String(f.category)
    if (f.tag) q.tag = String(f.tag)
    if (pageVal && pageVal !== 1) q.page = String(pageVal)
    if (pageSizeVal && pageSizeVal !== 50) q.pageSize = String(pageSizeVal)
    return q
  }

  function getQueryString(val: unknown): string {
    if (Array.isArray(val)) return val[0] ?? ''
    return typeof val === 'string' ? val : ''
  }

  function getQueryNumber(val: unknown): number | null {
    const s = getQueryString(val)
    return s !== '' ? Number(s) : null
  }

  function queryToFilters(query: RouteLocationNormalizedLoaded['query']): {
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

  // Initialisation à partir de l'URL
  const {
    filters: initialFilters,
    page: initialPage,
    pageSize: initialPageSize,
  } = queryToFilters(route.query)
  filters.value = { ...filters.value, ...initialFilters }
  page.value = initialPage
  pageSize.value = initialPageSize

  // Watch pour mettre à jour l'URL quand filtres/page/pageSize changent
  watch(
    [filters, page, pageSize],
    ([newFilters, newPage, newPageSize]) => {
      const query = filtersToQuery(newFilters, newPage, newPageSize)
      router.replace({ query })
    },
    { deep: true }
  )

  // Watch pour réagir aux changements d'URL (ex: navigation arrière)
  watch(
    () => route.query,
    (newQuery) => {
      const { filters: qFilters, page: qPage, pageSize: qPageSize } = queryToFilters(newQuery)
      // Ne mettre à jour que si différent pour éviter de casser la pagination
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
  // --- Fin synchronisation URL <-> filtres/page/pageSize ---

  const {
    data: transactionsResponse,
    isLoading,
    error,
    refetch: refetchPaginatedTransactions,
  } = useTransactionsQuery(page, pageSize, filters, false)

  const transactions = computed(() => transactionsResponse.value?.data ?? [])
  const total = computed(() => transactionsResponse.value?.count ?? 0)
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  const deleteError = ref('')

  function goToPage(p: number) {
    if (p >= 1 && p <= totalPages.value) {
      page.value = p
    }
  }

  function handleTransactionCreated() {
    refetchPaginatedTransactions()
  }

  // Pour l'import CSV
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isImporting = ref(false)
  const importMessage = ref('')
  const importError = ref('')
  const { mutateAsync: addBulkTransactions } = useAddBulkTransactionsMutation()

  const openFileDialog = () => {
    if (fileInputRef.value && !isImporting.value) {
      fileInputRef.value.click()
    }
  }

  function parseDate(dateStr: string): string | null {
    if (!dateStr) return null
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      if (
        !isNaN(parseInt(day)) &&
        !isNaN(parseInt(month)) &&
        !isNaN(parseInt(year)) &&
        parseInt(month) >= 1 &&
        parseInt(month) <= 12 &&
        parseInt(day) >= 1 &&
        parseInt(day) <= 31 &&
        year.length === 4
      ) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    console.warn(`Format de date invalide ignoré: ${dateStr}`)
    return null
  }

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    isImporting.value = true
    importMessage.value = ''
    importError.value = ''

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        if (!text) {
          importError.value = 'Impossible de lire le fichier.'
          isImporting.value = false
          return
        }

        const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
        if (lines.length < 2) {
          importError.value = "Le fichier CSV est vide ou ne contient pas d'en-têtes."
          isImporting.value = false
          return
        }

        // Nettoyer les en-têtes en supprimant les guillemets
        const headers = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''))
        const dateIndex = headers.indexOf('Date operation')
        const labelIndex = headers.indexOf('Libelle')
        const debitIndex = headers.indexOf('Debit')
        const creditIndex = headers.indexOf('Credit')

        if (dateIndex === -1 || labelIndex === -1 || debitIndex === -1 || creditIndex === -1) {
          importError.value =
            'En-têtes manquants. Assurez-vous que le fichier contient "Date operation", "Libelle", "Debit", "Credit".'
          console.error('Headers found:', headers) // Pour le débogage
          isImporting.value = false
          return
        }

        const transactionsToCreate = []
        let invalidCount = 0

        for (let i = 1; i < lines.length; i++) {
          // Nettoyer les valeurs en supprimant les guillemets
          const values = lines[i].split(';').map((v) => v.trim().replace(/^"|"$/g, ''))
          if (values.length < Math.max(dateIndex, labelIndex, debitIndex, creditIndex) + 1) {
            console.warn(`Ligne ${i + 1} ignorée: nombre de colonnes incorrect.`)
            invalidCount++
            continue
          }

          const rawDate = values[dateIndex]
          const label = values[labelIndex]
          const debit = parseFloat(values[debitIndex].replace(',', '.') || '0')
          const credit = parseFloat(values[creditIndex].replace(',', '.') || '0')

          if (!label) {
            console.warn(`Ligne ${i + 1} ignorée: Libellé manquant.`)
            invalidCount++
            continue
          }

          const transaction_date = parseDate(rawDate)
          if (!transaction_date) {
            console.warn(`Ligne ${i + 1} ignorée: Date invalide (${rawDate}).`)
            invalidCount++
            continue
          }

          const amount = credit - debit

          transactionsToCreate.push({
            label,
            amount,
            transaction_date,
            category_id: null,
          })
        }

        if (transactionsToCreate.length > 0) {
          try {
            // Import en masse avec un seul appel API - les doublons seront gérés par Supabase via upsert
            const addedTransactions = await addBulkTransactions(transactionsToCreate)
            importMessage.value = `${addedTransactions.length} transaction(s) ajoutée(s). ${
              transactionsToCreate.length - addedTransactions.length
            } transaction(s) déjà existante(s). ${invalidCount} ligne(s) invalide(s) ignorée(s).`
            refetchPaginatedTransactions()
          } catch (e: unknown) {
            importError.value =
              (e as Error).message || 'Erreur lors de la création des transactions.'
          }
        } else {
          importMessage.value = `Aucune nouvelle transaction à ajouter. ${invalidCount} ligne(s) invalide(s) ignorée(s).`
        }

        isImporting.value = false
        if (fileInputRef.value) {
          fileInputRef.value.value = ''
        }
      }

      reader.onerror = () => {
        importError.value = 'Erreur lors de la lecture du fichier.'
        isImporting.value = false
        if (fileInputRef.value) {
          fileInputRef.value.value = ''
        }
      }

      reader.readAsText(file, 'UTF-8')
    } catch (e: unknown) {
      importError.value = (e as Error).message || 'Une erreur est survenue.'
      isImporting.value = false
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    }
  }
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">Transactions</h1>
      <!-- Nouveau bandeau de boutons -->
      <div
        class="flex flex-col sm:flex-row flex-wrap items-center gap-3 sm:gap-4 mb-8 px-4 py-3 bg-gray-50 rounded-lg shadow-sm border border-gray-200"
      >
        <button
          class="w-full sm:w-auto bg-indigo-600 text-white px-3 py-1.5 rounded shadow hover:bg-indigo-700"
          type="button"
          @click="openPanel = openPanel === 'create' ? null : 'create'"
        >
          {{ openPanel === 'create' ? 'Masquer création' : 'Créer transaction' }}
        </button>
        <button
          class="w-full sm:w-auto bg-green-600 text-white px-3 py-1.5 rounded shadow hover:bg-green-700 disabled:opacity-50"
          :class="{ 'opacity-50': isImporting }"
          :disabled="isImporting"
          type="button"
          @click="openFileDialog"
        >
          {{ isImporting ? 'Import en cours...' : 'Importer CSV' }}
        </button>
        <input
          id="csv-upload"
          ref="fileInputRef"
          accept=".csv"
          class="hidden"
          type="file"
          @change="handleFileUpload"
        />
        <button
          class="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1.5 rounded shadow relative"
          type="button"
          @click="openPanel = openPanel === 'filters' ? null : 'filters'"
        >
          {{ openPanel === 'filters' ? 'Masquer recherche' : 'Afficher recherche' }}
          <span
            v-if="activeFiltersCount > 0"
            class="ml-2 inline-block bg-white text-gray-700 font-bold rounded-full px-2 text-xs border border-gray-400 align-middle"
          >
            {{ activeFiltersCount }}
          </span>
        </button>
        <button
          class="w-full sm:w-auto bg-orange-500 text-white px-3 py-1.5 rounded shadow hover:bg-orange-600 relative"
          type="button"
          @click="openPanel = openPanel === 'bulk' ? null : 'bulk'"
        >
          {{ openPanel === 'bulk' ? 'Masquer actions lot' : 'Actions en lot' }}
          <span
            v-if="selectedTransactions.length > 0"
            class="ml-2 inline-block bg-white text-orange-600 font-bold rounded-full px-2 text-xs border border-orange-400 align-middle"
          >
            {{ selectedTransactions.length }}
          </span>
        </button>
        <span v-if="isImporting" class="text-sm text-gray-600 sm:ml-2">Traitement...</span>
      </div>
      <!-- Fin du bandeau de boutons -->
      <Transition name="fade">
        <div v-if="openPanel === 'filters'">
          <div class="mb-6 px-4 py-3 bg-blue-50 rounded-lg shadow-sm border border-blue-200">
            <div class="flex flex-row items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-blue-700">Recherche & filtres</h2>
              <button
                aria-label="Fermer"
                class="text-blue-500 hover:text-blue-700 font-semibold"
                @click="closePanel"
              >
                ✕
              </button>
            </div>
            <TransactionFilterForm v-model:filters="filters" />
          </div>
        </div>
      </Transition>
      <Transition name="fade">
        <BulkActionsMenu
          v-if="openPanel === 'bulk'"
          :selected-transactions="selectedTransactions"
          @close="closePanel"
        />
      </Transition>
      <Transition name="fade">
        <TransactionCreatePanel
          v-if="openPanel === 'create'"
          @close="closePanel"
          @created="handleTransactionCreated"
        />
      </Transition>
      <div v-if="importMessage" class="mb-4 p-3 bg-green-100 text-green-800 rounded text-center">
        {{ importMessage }}
      </div>
      <div v-if="importError" class="mb-4 p-3 bg-red-100 text-red-800 rounded text-center">
        {{ importError }}
      </div>
      <div v-if="error" class="text-red-600 mb-4 text-center">
        {{ error.message }}
      </div>
      <div v-if="deleteError" class="text-red-600 mb-4 text-center">
        {{ deleteError }}
      </div>
      <!-- Pagination + sélecteur pageSize -->
      <div
        v-if="totalPages > 1"
        class="mb-4 mt-6 flex flex-wrap gap-2 justify-between items-center text-sm"
      >
        <div class="flex items-center gap-2">
          <a
            :class="[
              'text-indigo-600 hover:underline',
              { 'opacity-40 pointer-events-none': page === 1 },
            ]"
            href="#"
            @click.prevent="() => goToPage(page - 1)"
          >
            Précédent
          </a>
          <span>Page {{ page }} sur {{ totalPages }}</span>
          <a
            :class="[
              'text-indigo-600 hover:underline',
              { 'opacity-40 pointer-events-none': page === totalPages },
            ]"
            href="#"
            @click.prevent="() => goToPage(page + 1)"
          >
            Suivant
          </a>
        </div>
        <div class="flex items-center gap-2">
          <label for="page-size-select">Résultats par page :</label>
          <select
            id="page-size-select"
            v-model.number="pageSize"
            class="border rounded px-2 py-1"
            @change="page = 1"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
            <option :value="1000">1000 (max)</option>
          </select>
        </div>
      </div>
      <div v-else style="height: 24px"></div>
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

  .multiselect-tags-wrap {
    max-width: 320px;
    white-space: normal;
    word-break: break-word;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
</style>
