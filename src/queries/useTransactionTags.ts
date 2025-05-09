import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/supabase'
import type { Tables } from '@/types/supabase'

export type TransactionTag = Tables<'transaction_tag'>
export type Tag = Tables<'tag'>

// Récupérer les tags associés à une transaction
export function useTransactionTagsQuery(transactionId: string) {
  return useQuery<Tag[]>({
    queryKey: ['transaction-tags', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_tag')
        .select('tag:tag_id(*)')
        .eq('transaction_id', transactionId)
      if (error) throw new Error(error.message)
      // data: [{ tag: { ...tag fields } }]
      return (data ?? [])
        .map((row) => {
          if (
            row &&
            typeof row === 'object' &&
            row.tag &&
            typeof row.tag === 'object' &&
            !Array.isArray(row.tag)
          ) {
            return row.tag as Tag
          }
          return null
        })
        .filter(Boolean) as Tag[]
    },
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 5,
  })
}

// Lier un tag à une transaction
export function useAddTransactionTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ transaction_id, tag_id }: TransactionTag) => {
      const { error } = await supabase.from('transaction_tag').insert([{ transaction_id, tag_id }])
      if (error) throw new Error(error.message)
      return { transaction_id, tag_id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transaction-tags', variables.transaction_id],
      })
    },
  })
}

// Délier un tag d'une transaction
export function useDeleteTransactionTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ transaction_id, tag_id }: TransactionTag) => {
      const { error } = await supabase
        .from('transaction_tag')
        .delete()
        .eq('transaction_id', transaction_id)
        .eq('tag_id', tag_id)
      if (error) throw new Error(error.message)
      return { transaction_id, tag_id }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['transaction-tags', variables.transaction_id],
      })
    },
  })
}
