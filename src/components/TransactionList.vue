<template>
  <UCard>
    <UTable
      v-model:row-selection="rowSelection"
      class="w-full"
      :columns="columns"
      :data="tableRows"
      :get-row-id="(row: any) => row.id"
    />
  </UCard>
</template>

<script lang="ts" setup>
  import type { Category, Tag, Transaction } from '@/queries/useTransactions'
  import { watch, computed, h, resolveComponent } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    useDeleteTransactionMutation,
    useAllTransactionsWithCategoryQuery,
  } from '@/queries/useTransactions'
  import { recommendCategoryForTransaction } from '@/services/categoryRecommendationService'

  type TransactionListRow = Transaction & { tags: Tag[]; category?: Category | null }

  const emit = defineEmits(['update:selected', 'suggest-category'])

  const { data: allTxWithCat } = useAllTransactionsWithCategoryQuery()

  // Affichage du bouton suggestion piloté par un props
  const props = defineProps<{
    transactions: TransactionListRow[]
    disableSelection?: boolean
    disableTags?: boolean
    showCategorySuggestion?: boolean // nouveau props
  }>()

  const rowSelection = defineModel<Record<string, boolean>>('rowSelection', { required: false })

  const router = useRouter()
  const {
    mutate: deleteTransaction,
    status: deleteStatus,
    variables: deletingId,
  } = useDeleteTransactionMutation()

  const selectionColumn = {
    id: 'select',
    header: ({ table }: { table: unknown }) => {
      const t = table as {
        getIsSomePageRowsSelected: () => boolean
        getIsAllPageRowsSelected: () => boolean
        toggleAllPageRowsSelected: (v: boolean) => void
      }
      const UCheckbox = resolveComponent('UCheckbox')
      return h(UCheckbox, {
        modelValue: t.getIsSomePageRowsSelected() ? 'indeterminate' : t.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          t.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Tout sélectionner',
        class: 'flex justify-center',
      })
    },
    cell: ({ row }: { row: unknown }) => {
      const r = row as { getIsSelected: () => boolean; toggleSelected: (v: boolean) => void }
      const UCheckbox = resolveComponent('UCheckbox')
      return h(UCheckbox, {
        modelValue: r.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => r.toggleSelected(!!value),
        'aria-label': 'Sélectionner la ligne',
        class: 'flex justify-center',
      })
    },
    class: 'text-center w-8',
  }

  const otherColumns = computed(() => {
    const cols = [
      { accessorKey: 'label', header: 'Libellé', class: 'text-left' },
      {
        accessorKey: 'category',
        header: 'Catégorie',
        class: 'text-left',
        cell: ({ row }: { row: { original: TransactionListRow } }) => {
          const RouterLink = resolveComponent('RouterLink')
          const category = row.original.category
          // Suggestion de catégorie si showCategorySuggestion et pas de catégorie
          if (!category && props.showCategorySuggestion && allTxWithCat?.value) {
            // Correction typage : on "élargit" le type pour la fonction
            const suggestion = recommendCategoryForTransaction(
              { label: row.original.label },
              allTxWithCat.value as (Transaction & { category?: Category | null })[]
            )
            if (suggestion) {
              return h('div', { class: 'flex items-center gap-2' }, [
                h(
                  RouterLink,
                  {
                    class: 'text-primary-600 hover:underline cursor-pointer',
                    to: { path: '/transactions', query: { category: '_none' } },
                  },
                  () => 'Sans catégorie'
                ),
                h(
                  'button',
                  {
                    class: 'ml-2 text-xs text-indigo-600 underline',
                    type: 'button',
                    onClick: () =>
                      emit('suggest-category', { transaction: row.original, category: suggestion }),
                  },
                  'Suggérer : ' + suggestion.label
                ),
              ])
            }
          }
          if (!category) {
            return h(
              RouterLink,
              {
                class: 'text-primary-600 hover:underline cursor-pointer',
                to: { path: '/transactions', query: { category: '_none' } },
              },
              () => 'Sans catégorie'
            )
          }
          return h(
            RouterLink,
            {
              class: 'text-primary-600 hover:underline cursor-pointer',
              to: { path: '/transactions', query: { category: category.id } },
            },
            () => category.label
          )
        },
      },
      !props.disableTags && {
        accessorKey: 'tags',
        header: 'Tags',
        class: 'text-left',
        cell: ({ row }: { row: { original: TransactionListRow } }) => {
          const RouterLink = resolveComponent('RouterLink')
          const tags = row.original.tags
          if (!tags?.length) {
            return h(
              RouterLink,
              {
                class: 'text-primary-600 hover:underline cursor-pointer',
                to: { path: '/transactions', query: { tag: '_none' } },
              },
              () => 'Sans tag'
            )
          }
          return tags.map((tag) =>
            h(
              RouterLink,
              {
                key: tag.id,
                class:
                  'inline-block bg-gray-200 rounded px-2 py-0.5 mr-1 mb-1 text-xs font-medium text-primary-600 hover:underline cursor-pointer',
                to: { path: '/transactions', query: { tag: tag.id } },
              },
              () => tag.label
            )
          )
        },
      },
      {
        accessorKey: 'transaction_date',
        header: 'Date',
        class: 'text-right',
        cell: ({
          row,
        }: {
          row: { getValue: (key: string) => string; original: TransactionListRow }
        }) => {
          const dateStr = row.getValue('transaction_date')
          if (!dateStr) return '-'
          const d = new Date(dateStr)
          if (isNaN(d.getTime())) return dateStr
          return d.toLocaleDateString('fr-FR')
        },
      },
      {
        accessorKey: 'amount',
        header: 'Montant',
        class: 'text-right',
        cell: ({
          row,
        }: {
          row: { getValue: (key: string) => number; original: TransactionListRow }
        }) => {
          const amount = row.getValue('amount')
          const color = amount < 0 ? 'text-red-600' : 'text-green-600'
          return h(
            'div',
            { class: `text-right w-full font-medium ${color}` },
            new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }).format(amount)
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        class: 'text-center',
        cell: ({ row }: { row: { original: TransactionListRow } }) => {
          const UButton = resolveComponent('UButton')
          const id = String(row.original.id)
          return h('div', { class: 'flex items-center justify-center' }, [
            h(
              resolveComponent('UButtonGroup'),
              {},
              {
                default: () => [
                  h(UButton, {
                    size: 'xs',
                    color: 'info',
                    icon: 'mdi:pencil',
                    variant: 'outline',
                    title: 'Éditer la transaction',
                    onClick: () => id && router.push(`/transactions/${id}/edit`),
                  }),
                  h(UButton, {
                    size: 'xs',
                    color: 'error',
                    icon: 'mdi:trash-can',
                    variant: 'outline',
                    title: 'Supprimer la transaction',
                    disabled: deleteStatus.value === 'pending' && deletingId.value === id,
                    onClick: () => deleteTransaction(id),
                  }),
                ],
              }
            ),
          ])
        },
      },
    ]
    return cols.filter((col): col is Exclude<(typeof cols)[number], false> => Boolean(col))
  })

  const columns = computed(() => {
    return props.disableSelection ? otherColumns.value : [selectionColumn, ...otherColumns.value]
  })

  const tableRows = computed(() => props.transactions)

  watch(rowSelection, () => {
    const selected = props.transactions.filter((tx) => rowSelection?.value?.[tx.id])
    emit('update:selected', selected)
  })
</script>
