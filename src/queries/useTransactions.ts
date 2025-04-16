import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type Transaction = Tables<"transaction">;

export function useTransactionsQuery() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transaction").select("*");
      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAddTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"transaction">) => {
      const { data, error } = await supabase
        .from("transaction")
        .insert([payload])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"transaction">;
    }) => {
      const { data, error } = await supabase
        .from("transaction")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transaction")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useTransactionByIdQuery(id: string) {
  return useQuery<Transaction | null>({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data as Transaction;
    },
    enabled: !!id,
  });
}
