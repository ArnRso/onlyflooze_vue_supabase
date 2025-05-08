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

  // Trouver le mois précédent par rapport à la transaction la plus récente
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const prevMonth = lastDate.getMonth() === 0 ? 11 : lastDate.getMonth() - 1;
  const prevYear = lastDate.getMonth() === 0 ? lastDate.getFullYear() - 1 : lastDate.getFullYear();

  // Filtrer les transactions du mois précédent
  const prevMonthTransactions = sorted.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  // Si aucune transaction le mois précédent, on prend le montant de la dernière transaction connue
  let nextAmount: number;
  if (prevMonthTransactions.length > 0) {
    nextAmount = prevMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  } else {
    nextAmount = sorted[sorted.length - 1].amount;
  }

  return { estimatedDay, nextAmount };
}
