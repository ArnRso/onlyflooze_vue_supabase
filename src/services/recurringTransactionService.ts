// Utilitaire pour estimer la prochaine transaction récurrente d'une catégorie
// Entrée : liste de transactions [{ date: string, amount: number }]
// Sortie : { estimatedDay: number, nextAmount: number }

export interface TransactionLike {
  date: string; // format ISO ou YYYY-MM-DD
  amount: number;
}

export interface NextRecurringEstimate {
  estimatedDay: number; // jour du mois estimé (1-31)
  nextAmount: number;   // montant de la transaction la plus récente
}

export function estimateNextRecurringTransaction(transactions: TransactionLike[]): NextRecurringEstimate | null {
  if (!transactions || transactions.length === 0) return null;

  // Trier les transactions par date croissante
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Extraire les jours du mois de chaque transaction
  const days = sorted.map(t => new Date(t.date).getDate());
  // Moyenne des jours du mois
  const estimatedDay = Math.round(days.reduce((a, b) => a + b, 0) / days.length);

  // Montant de la transaction la plus récente
  const nextAmount = sorted[sorted.length - 1].amount;

  return { estimatedDay, nextAmount };
}
