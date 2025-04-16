import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
import { Ref, unref, computed } from "vue";

export type Transaction = Tables<"transaction">;

export function useTransactionsQuery(
  page: number | Ref<number> = 1,
  pageSize: number | Ref<number> = 10
) {
  return useQuery<{ data: Transaction[]; count: number }>({
    queryKey: computed(() => ["transactions", unref(page), unref(pageSize)]),
    queryFn: async () => {
      const from = (unref(page) - 1) * unref(pageSize);
      const to = from + unref(pageSize) - 1;
      const { data, error, count } = await supabase
        .from("transaction")
        .select("*", { count: "exact" })
        .order("transaction_date", { ascending: false })
        .range(from, to);
      if (error) throw new Error(error.message);
      return { data: data as Transaction[], count: count ?? 0 };
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
