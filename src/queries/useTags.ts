import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

export type Tag = Tables<'tag'>

export function useTagsQuery() {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag')
        .select('*')
        .order('label', { ascending: true })
      if (error) throw new Error(error.message)
      return data as Tag[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TablesInsert<'tag'>) => {
      const { data, error } = await supabase.from('tag').insert([payload]).select().single()
      if (error) throw new Error(error.message)
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tag').delete().eq('id', id)
      if (error) throw new Error(error.message)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTagMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'tag'> }) => {
      const { data, error } = await supabase
        .from('tag')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as Tag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
