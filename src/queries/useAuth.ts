import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/supabase'
import type { Tables } from '@/types/supabase'
import type { User } from '@supabase/supabase-js'

// Variable globale pour éviter plusieurs souscriptions
let hasSubscribedToAuthStateChange = false

export function useLoginMutation() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw new Error(error.message)
      return data.user as User
    },
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      return data.user as User
    },
  })
}

export function useProfileQuery(userId: string | null) {
  return useQuery<Tables<'profiles'> | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw new Error(error.message)
      return data as Tables<'profiles'>
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function useSessionQuery() {
  const queryClient = useQueryClient()
  // Souscription unique aux changements d'état d'authentification
  if (typeof window !== 'undefined' && !hasSubscribedToAuthStateChange) {
    supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    })
    hasSubscribedToAuthStateChange = true
  }
  return useQuery<User | null>({
    queryKey: ['session'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.user ?? null
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
