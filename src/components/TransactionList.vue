<template>
  <table
    class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden"
  >
    <thead>
      <tr class="bg-gray-50">
        <th class="px-2 py-2 text-center">
          <input
            type="checkbox"
            :checked="allSelected"
            @change="toggleSelectAll"
          />
        </th>
        <th class="px-4 py-2 text-left font-semibold text-gray-700">Libellé</th>
        <th class="px-4 py-2 text-left font-semibold text-gray-700">
          Catégorie
        </th>
        <th class="px-4 py-2 text-left font-semibold text-gray-700">Tags</th>
        <th class="px-4 py-2 text-right font-semibold text-gray-700">Date</th>
        <th class="px-4 py-2 text-right font-semibold text-gray-700">
          Montant
        </th>
        <th class="px-4 py-2 text-center font-semibold text-gray-700">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(tx, i) in props.transactions"
        :key="tx.id"
        :class="i % 2 === 1 ? 'bg-gray-100' : ''"
        class="border-t border-gray-100 hover:bg-gray-50 transition"
      >
        <td class="px-2 py-2 text-center">
          <input
            type="checkbox"
            :checked="selectedTransactions.some((t) => t.id === tx.id)"
            @change="
              (e) => {
                const checked = (e.target as HTMLInputElement)?.checked
                if (checked) {
                  if (!selectedTransactions.some((t) => t.id === tx.id))
                    selectedTransactions.push(tx)
                } else {
                  const idx = selectedTransactions.findIndex(
                    (t) => t.id === tx.id
                  )
                  if (idx !== -1) selectedTransactions.splice(idx, 1)
                }
                emitSelection()
              }
            "
          />
        </td>
        <td class="px-4 py-2 font-medium text-gray-900">{{ tx.label }}</td>
        <td class="px-4 py-2">
          <template v-if="tx.category">
            <RouterLink
              class="text-indigo-600 hover:underline cursor-pointer"
              :to="{
                path: '/transactions',
                query: { category: tx.category.id },
              }"
            >
              {{ tx.category.label }}
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              class="text-indigo-600 hover:underline cursor-pointer"
              :to="{ path: '/transactions', query: { category: '_none' } }"
            >
              Sans catégorie
            </RouterLink>
          </template>
        </td>
        <td class="px-4 py-2">
          <template v-if="tx.tags.length">
            <span
              v-for="tag in tx.tags"
              :key="tag.id"
              class="inline-block bg-gray-200 text-gray-700 rounded px-2 py-0.5 mr-1 mb-1 text-xs font-medium"
            >
              <RouterLink
                class="text-indigo-600 hover:underline cursor-pointer"
                :to="{ path: '/transactions', query: { tag: tag.id } }"
              >
                {{ tag.label }}
              </RouterLink>
            </span>
          </template>
          <template v-else>
            <RouterLink
              class="text-indigo-600 hover:underline cursor-pointer"
              :to="{ path: '/transactions', query: { tag: '_none' } }"
            >
              Sans tag
            </RouterLink>
          </template>
        </td>
        <td class="px-4 py-2 text-gray-500 text-right">
          {{ formatDate(tx.transaction_date) }}
        </td>
        <td
          :class="tx.amount < 0 ? 'text-red-600' : 'text-green-700'"
          class="px-4 py-2 text-right font-mono font-semibold"
        >
          {{ formatAmount(tx.amount) }}
        </td>
        <td class="px-4 py-2 text-center">
          <button
            @click="
              $router.push({ name: 'transaction-edit', params: { id: tx.id } })
            "
            class="text-blue-600 hover:bg-blue-100 rounded-full p-1 transition-colors focus:outline-none"
            title="Éditer la transaction"
          >
            <MdiPencil />
          </button>
          <button
            @click="deleteTransaction(tx.id)"
            :disabled="deleteStatus === 'pending'"
            class="text-red-600 hover:bg-red-100 rounded-full p-1 ml-2 transition-colors focus:outline-none"
            title="Supprimer la transaction"
          >
            <MdiTrashCan />
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import type { Category, Tag, Transaction } from '@/queries/useTransactions'
import { defineProps } from 'vue'
import MdiPencil from './icons/MdiPencil.vue'
import MdiTrashCan from './icons/MdiTrashCan.vue'
import { useDeleteTransactionMutation } from '@/queries/useTransactions'
import { ref, watch, computed } from 'vue'
import { defineEmits } from 'vue'
import { RouterLink } from 'vue-router'

const emit = defineEmits(['update:selected'])

const props = defineProps<{
  transactions: Array<Transaction & { tags: Tag[]; category?: Category | null }>
}>()

const selectedTransactions = ref<
  (Transaction & { tags: Tag[]; category?: Category | null })[]
>([])

const allSelected = computed(
  () =>
    props.transactions.length > 0 &&
    selectedTransactions.value.length === props.transactions.length
)

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    selectedTransactions.value = [...props.transactions]
  } else {
    selectedTransactions.value = []
  }
  emitSelection()
}

function emitSelection() {
  emit('update:selected', selectedTransactions.value)
}

watch(
  () => props.transactions,
  () => {
    // Nettoie la sélection si la liste change
    selectedTransactions.value = selectedTransactions.value.filter((tx) =>
      props.transactions.some((t) => t.id === tx.id)
    )
    emitSelection()
  },
  { immediate: true, deep: true }
)

const { mutate: deleteTransaction, status: deleteStatus } =
  useDeleteTransactionMutation()

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
</script>
