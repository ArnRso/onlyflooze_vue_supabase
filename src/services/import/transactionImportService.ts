// src/services/import/transactionImportService.ts
// Service d'import de transactions, sélectionne le parseur selon le type de fichier

import { parseCsvTransactions } from './csvParser'
import type { CsvParsedTransaction } from './csvParser'

export type SupportedFormat = 'csv' // | 'ofx' | 'qfx' (à venir)

export interface ImportResult {
  transactions: CsvParsedTransaction[]
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

export async function extractTransactionsFromFile(
  file: File,
  parseDate: (dateStr: string) => string | null
): Promise<ImportResult> {
  const format = detectFileFormat(file)
  if (!format) {
    return { transactions: [], invalidCount: 0, error: 'Format de fichier non supporté.' }
  }
  const text = await file.text()
  if (format === 'csv') {
    return parseCsvTransactions(text, parseDate)
  }
  // if (format === 'ofx') { ... }
  // if (format === 'qfx') { ... }
  return { transactions: [], invalidCount: 0, error: 'Format de fichier non supporté.' }
}
