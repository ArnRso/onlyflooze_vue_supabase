// src/services/import/transactionImportService.ts
// Service d'import de transactions, sélectionne le parseur selon le type de fichier

import { parseCsvTransactions } from './csvParser'
import {
  addBulkTransactions,
  refreshPaginatedTransactions,
} from '@/services/import/transactionSaveService'
import type { TablesInsert } from '@/types/supabase'

export type SupportedFormat = 'csv' // | 'ofx' | 'qfx' (à venir)

export interface ImportResult {
  transactions: TablesInsert<'transaction'>[]
  invalidCount: number
  error?: string
}

export interface ImportAndSaveResult {
  addedCount: number
  duplicateCount: number
  invalidCount: number
  error?: string
}

export function detectFileFormat(file: File): SupportedFormat | null {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'csv') return 'csv'
  // if (ext === 'ofx') return 'ofx'
  // if (ext === 'qfx') return 'qfx'
  return null
}

export async function extractTransactionsFromFile(file: File): Promise<ImportResult> {
  const format = detectFileFormat(file)
  if (!format) {
    return { transactions: [], invalidCount: 0, error: 'Format de fichier non supporté.' }
  }
  const text = await file.text()
  if (format === 'csv') {
    return parseCsvTransactions(text)
  }
  // if (format === 'ofx') { ... }
  // if (format === 'qfx') { ... }
  return { transactions: [], invalidCount: 0, error: 'Format de fichier non supporté.' }
}

export async function importTransactionsFromFile(file: File): Promise<ImportAndSaveResult> {
  const result = await extractTransactionsFromFile(file)
  if (result.error) {
    return { addedCount: 0, duplicateCount: 0, invalidCount: 0, error: result.error }
  }
  const transactionsToCreate = result.transactions
  const invalidCount = result.invalidCount
  if (transactionsToCreate.length > 0) {
    try {
      const addedTransactions = await addBulkTransactions(transactionsToCreate)
      const addedCount = Array.isArray(addedTransactions) ? addedTransactions.length : 0
      const duplicateCount = transactionsToCreate.length - addedCount
      refreshPaginatedTransactions()
      return {
        addedCount,
        duplicateCount,
        invalidCount,
      }
    } catch (e: unknown) {
      return {
        addedCount: 0,
        duplicateCount: 0,
        invalidCount,
        error: (e as Error).message || 'Erreur lors de la création des transactions.',
      }
    }
  } else {
    return { addedCount: 0, duplicateCount: 0, invalidCount }
  }
}
