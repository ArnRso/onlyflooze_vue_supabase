<script lang="ts" setup>
  import { useAddBulkTransactionsMutation, useTransactionsQuery } from '@/queries/useTransactions'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TransactionList from '@/components/TransactionList.vue'
  import TransactionFilterForm from '@/components/TransactionFilterForm.vue'
  import BulkActionsMenu from '@/components/TransactionBulkActions.vue'
  import TransactionCreatePanel from '@/components/TransactionCreatePanel.vue'
  import type { TransactionFilter } from '@/types/TransactionFilter'

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

  const {
    data: transactionsResponse,
    isLoading,
    error,
    refetch: refetchPaginatedTransactions,
  } = useTransactionsQuery(page, pageSize, filters, false)

  // Sécurité : page ne doit jamais être < 1
  watch(page, (val) => {
    if (val < 1 || isNaN(val)) page.value = 1
    else refetchPaginatedTransactions() // Ajout : refetch à chaque changement de page
  })

  // Ajout : refetch quand pageSize change
  watch(pageSize, () => {
    page.value = 1 // On revient à la première page si la taille change
    refetchPaginatedTransactions()
  })

  const transactions = computed(() => transactionsResponse.value?.data ?? [])
  const total = computed(() => transactionsResponse.value?.count ?? 0)
  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.ceil(total.value / pageSize.value) : 1
  )
  const deleteError = ref('')

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

  const route = useRoute()
  const router = useRouter()

  // Helpers pour parser/stringifier les filtres
  function parseFiltersFromQuery(query: Record<string, unknown>): TransactionFilter {
    return {
      label: typeof query.label === 'string' ? query.label : '',
      dateMin: typeof query.dateMin === 'string' ? query.dateMin : '',
      dateMax: typeof query.dateMax === 'string' ? query.dateMax : '',
      amountMin: query.amountMin !== undefined ? Number(query.amountMin) : null,
      amountMax: query.amountMax !== undefined ? Number(query.amountMax) : null,
      category: typeof query.category === 'string' ? query.category : null,
      tag: typeof query.tag === 'string' ? query.tag : null,
    }
  }
  function filtersToQuery(filters: TransactionFilter): Record<string, string> {
    const q: Record<string, string> = {}
    if (filters.label) q.label = filters.label
    if (filters.dateMin) q.dateMin = filters.dateMin
    if (filters.dateMax) q.dateMax = filters.dateMax
    if (filters.amountMin !== null && filters.amountMin !== undefined)
      q.amountMin = String(filters.amountMin)
    if (filters.amountMax !== null && filters.amountMax !== undefined)
      q.amountMax = String(filters.amountMax)
    if (filters.category) q.category = filters.category
    if (filters.tag) q.tag = filters.tag
    return q
  }

  // Initialisation depuis l'URL
  page.value = Number(route.query.page) || 1
  pageSize.value = Number(route.query.pageSize) || 50
  filters.value = parseFiltersFromQuery(route.query)

  // Sync URL à chaque changement
  watch([page, pageSize, filters], ([p, ps, f]) => {
    router.replace({
      query: {
        ...route.query,
        page: p !== 1 ? String(p) : undefined,
        pageSize: ps !== 50 ? String(ps) : undefined,
        ...filtersToQuery(f),
      },
    })
  })
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <UCard
      class="max-w-7xl w-full mx-auto"
      :ui="{ body: { padding: 'p-0 sm:p-0' }, base: 'rounded-xl shadow-md overflow-hidden' }"
    >
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
            @click="openPanel = openPanel === 'create' ? null : 'create'"
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
            accept=".csv"
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
            @click="openPanel = openPanel === 'filters' ? null : 'filters'"
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
            @click="openPanel = openPanel === 'bulk' ? null : 'bulk'"
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
          <UCard v-if="openPanel === 'filters'" class="mb-6 bg-blue-50 border-blue-200">
            <div class="flex flex-row items-center justify-between mb-2">
              <h2 class="text-lg font-bold text-blue-700">Recherche & filtres</h2>
              <UButton
                aria-label="Fermer"
                color="blue"
                icon="i-heroicons-x-mark"
                variant="ghost"
                @click="closePanel"
              />
            </div>
            <TransactionFilterForm v-model:filters="filters" />
          </UCard>
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
        <UAlert v-if="importMessage"
                class="mb-4 text-center"
                color="success"
                variant="soft"
        >
          {{ importMessage }}
        </UAlert>
        <UAlert v-if="importError"
                class="mb-4 text-center"
                color="error"
                variant="soft"
        >
          {{ importError }}
        </UAlert>
        <UAlert v-if="error"
                class="mb-4 text-center"
                color="error"
                variant="soft"
        >
          {{ error.message }}
        </UAlert>
        <UAlert v-if="deleteError"
                class="mb-4 text-center"
                color="error"
                variant="soft"
        >
          {{ deleteError }}
        </UAlert>
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
