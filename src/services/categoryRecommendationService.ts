// Service de recommandation de catégorie pour une transaction
// Basé sur la fréquence des catégories attribuées à des transactions au label identique

import type { Tables } from '@/types/supabase'

type Transaction = Tables<'transaction'>
type Category = Tables<'category'>

/**
 * Recommande une catégorie pour une transaction donnée, en se basant sur les labels déjà catégorisés.
 * @param transaction La transaction à catégoriser
 * @param allTransactions Toutes les transactions existantes (avec leur catégorie)
 * @returns La catégorie recommandée (ou null si aucune n'est trouvée)
 */
// Fonction utilitaire : distance de Levenshtein
function levenshtein(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an
  const matrix = Array.from({ length: an + 1 }, () => Array(bn + 1).fill(0))
  for (let i = 0; i <= an; i++) matrix[i][0] = i
  for (let j = 0; j <= bn; j++) matrix[0][j] = j
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[an][bn]
}

// Version fuzzy de la recommandation
export function recommendCategoryForTransaction(
  transaction: Pick<Transaction, 'label'>,
  allTransactions: Array<Transaction & { category?: Category | null }>,
  fuzzy = true
): Category | null {
  if (!transaction.label) return null
  const labelNorm = transaction.label.trim().toLowerCase()
  // Seuil de similarité (à ajuster selon la tolérance souhaitée)
  const MAX_DIST = 2
  const matches = allTransactions.filter((tx) => {
    if (!tx.label || !tx.category) return false
    const txLabelNorm = tx.label.trim().toLowerCase()
    if (labelNorm === txLabelNorm) return true
    if (!fuzzy) return false
    return levenshtein(labelNorm, txLabelNorm) <= MAX_DIST
  })
  if (matches.length === 0) return null
  const freq = new Map<string, { count: number; category: Category }>()
  for (const tx of matches) {
    if (tx.category) {
      const key = String(tx.category.id)
      if (!freq.has(key)) freq.set(key, { count: 0, category: tx.category })
      freq.get(key)!.count++
    }
  }
  let max = 0
  let best: Category | null = null
  for (const { count, category } of freq.values()) {
    if (count > max) {
      max = count
      best = category
    }
  }
  return best
}
