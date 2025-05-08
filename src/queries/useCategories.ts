import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

export type Category = Tables<'category'>

export function useCategoriesQuery() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .order('label', { ascending: true })
      if (error) throw new Error(error.message)
      return data as Category[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useAddCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TablesInsert<'category'>) => {
      const { data, error } = await supabase
        .from('category')
        .insert([payload])
        .select()
        .order('label', { ascending: true })
        .single()
      if (error) throw new Error(error.message)
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: TablesUpdate<'category'>
    }) => {
      const { data, error } = await supabase
        .from('category')
        .update(updates)
        .eq('id', id)
        .select()
        .order('label', { ascending: true })
        .single()
      if (error) throw new Error(error.message)
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useRecurringCategoriesWithTransactionsQuery() {
  return useQuery({
    queryKey: ['recurring-categories-with-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category')
        .select('*, transactions:transaction(*)')
        .eq('is_recurring', true)
        .order('label', { ascending: true })
      if (error) throw new Error(error.message)
      // data: [{...cat, transactions: [...] }]
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}
