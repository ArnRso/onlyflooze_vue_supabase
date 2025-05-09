export type TransactionFilter = {
  label: string
  dateMin: string
  dateMax: string
  amountMin: number | null
  amountMax: number | null
  category: string | null | '_none'
  tag: string | null | '_none'
}
