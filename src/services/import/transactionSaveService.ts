// src/services/import/transactionSaveService.ts
// Service pour la sauvegarde et le rafraîchissement des transactions

import type { TablesInsert } from '@/types/supabase'

// Singleton pour la mutation (à adapter selon l'architecture de ton app)
let addBulkTransactionsFn:
  | ((txs: TablesInsert<'transaction'>[]) => Promise<TablesInsert<'transaction'>[]>)
  | null = null
let refreshPaginatedTransactionsFn: (() => void) | null = null

export function setTransactionSaveHandlers({
  addBulkTransactions,
  refreshPaginatedTransactions,
}: {
  addBulkTransactions: (
    txs: TablesInsert<'transaction'>[]
  ) => Promise<TablesInsert<'transaction'>[]>
  refreshPaginatedTransactions: () => void
}) {
  addBulkTransactionsFn = addBulkTransactions
  refreshPaginatedTransactionsFn = refreshPaginatedTransactions
}

export async function addBulkTransactions(txs: TablesInsert<'transaction'>[]) {
  if (!addBulkTransactionsFn) throw new Error('addBulkTransactions non initialisé')
  return addBulkTransactionsFn(txs)
}

export function refreshPaginatedTransactions() {
  if (!refreshPaginatedTransactionsFn)
    throw new Error('refreshPaginatedTransactions non initialisé')
  return refreshPaginatedTransactionsFn()
}
