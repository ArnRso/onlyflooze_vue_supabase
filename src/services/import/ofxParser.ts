// src/services/import/ofxParser.ts
// Parseur simple OFX pour extraire les transactions
import type { TablesInsert } from '@/types/supabase'

export function parseOfxTransactions(ofxText: string): {
  transactions: TablesInsert<'transaction'>[]
  invalidCount: number
  error?: string
} {
  try {
    // Extraction basique des transactions OFX (format SGML)
    const transactions: TablesInsert<'transaction'>[] = []
    const ofx = ofxText.replace(/\r/g, '')
    const transactionBlocks = ofx.split('<STMTTRN>').slice(1)
    for (const block of transactionBlocks) {
      const amountMatch = block.match(/<TRNAMT>([^<\n]+)/)
      const dateMatch = block.match(/<DTPOSTED>([^<\n]+)/)
      const memoMatch = block.match(/<MEMO>([^<\n]+)/)
      const nameMatch = block.match(/<NAME>([^<\n]+)/)
      if (!amountMatch || !dateMatch) {
        continue
      }
      const amount = parseFloat(amountMatch[1].replace(',', '.'))
      const date = dateMatch[1].substring(0, 8) // YYYYMMDD
      const label = memoMatch?.[1] || nameMatch?.[1] || ''
      // Conversion date au format ISO (YYYY-MM-DD)
      const isoDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
      transactions.push({
        label,
        amount,
        transaction_date: isoDate,
        category_id: null,
      } as TablesInsert<'transaction'>)
    }
    return { transactions, invalidCount: 0 }
  } catch (e) {
    return { transactions: [], invalidCount: 0, error: (e as Error).message }
  }
}
