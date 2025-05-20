// src/services/import/parseDate.ts
// Fonction utilitaire pour parser les dates de type "DD/MM/YYYY" en "YYYY-MM-DD"

export function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    if (
      !isNaN(parseInt(day)) &&
      !isNaN(parseInt(month)) &&
      !isNaN(parseInt(year)) &&
      parseInt(month) >= 1 &&
      parseInt(month) <= 12 &&
      parseInt(day) >= 1 &&
      parseInt(day) <= 31 &&
      year.length === 4
    ) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }
  console.warn(`Format de date invalide ignoré: ${dateStr}`)
  return null
}
