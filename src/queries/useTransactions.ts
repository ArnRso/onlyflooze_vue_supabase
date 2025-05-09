import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'
import { computed, Ref, unref } from 'vue'
import type { TransactionFilter } from '@/types/TransactionFilter'

export type Transaction = Tables<'transaction'>
export type Tag = Tables<'tag'>
export type Category = Tables<'category'>

// L'argument 'search' n'est plus utilisé, tout passe par filters.label
// Si jamais il reste des appels avec 'search', il faut les remplacer par 'filters.label'
export function useTransactionsQuery(
  page: number | Ref<number> = 1,
  pageSize: number | Ref<number> = 10,
  filters: TransactionFilter | Ref<TransactionFilter>,
  showWithoutCategory: Ref<boolean> | boolean = false
) {
  return useQuery<{
    data: (Transaction & { tags: Tag[]; category?: Category | null })[]
    count: number
  }>({
    queryKey: computed(() => [
      'transactions',
      unref(page),
      unref(pageSize),
      JSON.stringify(unref(filters)),
      unref(showWithoutCategory),
    ]),
    queryFn: async () => {
      const from = (unref(page) - 1) * unref(pageSize)
      const to = from + unref(pageSize) - 1
      let query = supabase
        .from('transaction')
        .select('*, category:category_id(*), transaction_tag(tag:tag_id(*))', {
          count: 'exact',
        })
        .order('transaction_date', { ascending: false })
        .range(from, to)
      const resolvedFilters = unref(filters)
      if (resolvedFilters.label) {
        const s = resolvedFilters.label.toLowerCase().trim()
        query = query.ilike('label', `%${s}%`)
      }
      if (resolvedFilters.dateMin) {
        query = query.gte('transaction_date', resolvedFilters.dateMin)
      }
      if (resolvedFilters.dateMax) {
        query = query.lte('transaction_date', resolvedFilters.dateMax)
      }
      if (
        resolvedFilters.amountMin !== null &&
        resolvedFilters.amountMin !== undefined
      ) {
        query = query.gte('amount', resolvedFilters.amountMin)
      }
      if (
        resolvedFilters.amountMax !== null &&
        resolvedFilters.amountMax !== undefined
      ) {
        query = query.lte('amount', resolvedFilters.amountMax)
      }
      if (unref(showWithoutCategory)) {
        query = query.is('category_id', null)
      }
      if (resolvedFilters.category) {
        query = query.eq('category_id', resolvedFilters.category)
      }
      if (resolvedFilters.tag) {
        // Récupérer les transaction_id ayant ce tag (filtrage N-N sans doublons)
        const { data: tagLinks, error: tagLinksError } = await supabase
          .from('transaction_tag')
          .select('transaction_id')
          .eq('tag_id', resolvedFilters.tag)
        if (tagLinksError) throw new Error(tagLinksError.message)
        const transactionIds = (tagLinks ?? []).map((row) => row.transaction_id)
        if (transactionIds.length === 0) {
          // Aucun résultat possible, on force un id impossible
          query = query.in('id', ['00000000-0000-0000-0000-000000000000'])
        } else {
          query = query.in('id', transactionIds)
        }
      }
      const { data, error, count } = await query
      if (error) throw new Error(error.message)
      type TxWithTagsAndCategory = Transaction & {
        transaction_tag?: Array<{ tag: Tag }>
        category?: Category | null
      }
      const transactionsWithDetails = (data as TxWithTagsAndCategory[]).map(
        (tx) => ({
          ...tx,
          tags: Array.isArray(tx.transaction_tag)
            ? tx.transaction_tag.map((tt) => tt.tag).filter(Boolean)
            : [],
          category: tx.category || null,
        })
      )
      return { data: transactionsWithDetails, count: count ?? 0 }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAddTransactionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TablesInsert<'transaction'>) => {
      const { data, error } = await supabase
        .from('transaction')
        .insert([payload])
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: TablesUpdate<'transaction'>
    }) => {
      const { data, error } = await supabase
        .from('transaction')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transaction').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useAddBulkTransactionsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (transactions: TablesInsert<'transaction'>[]) => {
      if (transactions.length === 0) return []

      // Utilisation de la méthode upsert qui ignore les entrées existantes
      const { data, error } = await supabase
        .from('transaction')
        .upsert(transactions, {
          onConflict: 'label,amount,transaction_date,user_id', // Définit les colonnes qui forment la clé d'unicité
          ignoreDuplicates: true, // Ignorer les doublons au lieu de les mettre à jour
        })
        .select()

      if (error) throw new Error(error.message)
      return data as Transaction[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useTransactionByIdQuery(id: string) {
  return useQuery<Transaction | null>({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw new Error(error.message)
      return data as Transaction
    },
    enabled: !!id,
  })
}

export function useCategoryTransactionsQuery(categoryId: string) {
  return useQuery<{ data: Transaction[] }>({
    queryKey: ['transactions', 'category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction')
        .select('*')
        .eq('category_id', categoryId)
        .order('transaction_date', { ascending: false })
      if (error) throw new Error(error.message)
      return { data: data as Transaction[] }
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,
  })
}
