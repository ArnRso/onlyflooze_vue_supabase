// src/services/import/csvParser.ts
// Parseur CSV pour extraire les transactions à partir d'un texte CSV.

import type { TablesInsert } from '@/types/supabase'
import { parseDate } from './parseDate'

export type CsvParseResult = {
  transactions: TablesInsert<'transaction'>[]
  invalidCount: number
  error?: string
}

export function parseCsvTransactions(text: string): CsvParseResult {
  if (!text) {
    return { transactions: [], invalidCount: 0, error: 'Impossible de lire le fichier.' }
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length < 2) {
    return {
      transactions: [],
      invalidCount: 0,
      error: "Le fichier CSV est vide ou ne contient pas d'en-têtes.",
    }
  }
  const headers = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''))
  const dateIndex = headers.indexOf('Date operation')
  const labelIndex = headers.indexOf('Libelle')
  const debitIndex = headers.indexOf('Debit')
  const creditIndex = headers.indexOf('Credit')
  if (dateIndex === -1 || labelIndex === -1 || debitIndex === -1 || creditIndex === -1) {
    return {
      transactions: [],
      invalidCount: 0,
      error:
        'En-têtes manquants. Assurez-vous que le fichier contient "Date operation", "Libelle", "Debit", "Credit".',
    }
  }
  const transactions: TablesInsert<'transaction'>[] = []
  let invalidCount = 0
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map((v) => v.trim().replace(/^"|"$/g, ''))
    if (values.length < Math.max(dateIndex, labelIndex, debitIndex, creditIndex) + 1) {
      invalidCount++
      continue
    }
    const rawDate = values[dateIndex]
    const label = values[labelIndex]
    const debit = parseFloat(values[debitIndex].replace(',', '.') || '0')
    const credit = parseFloat(values[creditIndex].replace(',', '.') || '0')
    if (!label) {
      invalidCount++
      continue
    }
    const transaction_date = parseDate(rawDate)
    if (!transaction_date) {
      invalidCount++
      continue
    }
    const amount = credit - debit
    transactions.push({ label, amount, transaction_date, category_id: null })
  }
  return { transactions, invalidCount }
}
