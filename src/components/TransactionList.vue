<template>
  <table
    class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden"
  >
    <thead>
      <tr class="bg-gray-50">
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
        v-for="(tx, i) in transactions"
        :key="tx.id"
        :class="i % 2 === 1 ? 'bg-gray-100' : ''"
        class="border-t border-gray-100 hover:bg-gray-50 transition"
      >
        <td class="px-4 py-2 font-medium text-gray-900">{{ tx.label }}</td>
        <td class="px-4 py-2">
          {{ tx.category ? tx.category.label : 'Aucune' }}
        </td>
        <td class="px-4 py-2">
          <span
            v-for="tag in tx.tags"
            :key="tag.id"
            class="inline-block bg-gray-200 text-gray-700 rounded px-2 py-0.5 mr-1 mb-1 text-xs font-medium"
          >
            #{{ tag.label }}
          </span>
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
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
import type { Category, Tag, Transaction } from '@/queries/useTransactions'
import { defineProps } from 'vue'
import MdiPencil from './icons/MdiPencil.vue'

defineProps<{
  transactions: Array<Transaction & { tags: Tag[]; category?: Category | null }>
}>()

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
