import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { supabase } from "@/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
import { Ref, unref, computed } from "vue";

export type Transaction = Tables<"transaction">;
export type Tag = Tables<"tag">;

export function useTransactionsQuery(
  page: number | Ref<number> = 1,
  pageSize: number | Ref<number> = 10,
  search: Ref<string> | string = '',
  showWithoutCategory: Ref<boolean> | boolean = false,
  filterCategoryIds: Ref<string[]> | string[] | null = null // <-- Ajout d'un paramètre pour filtrer par catégories
) {
  return useQuery<{ data: (Transaction & { tags: Tag[] })[]; count: number }>({
    queryKey: computed(() => [
      "transactions",
      unref(page),
      unref(pageSize),
      unref(search),
      unref(showWithoutCategory),
      unref(filterCategoryIds)
    ]),
    queryFn: async () => {
      const from = (unref(page) - 1) * unref(pageSize);
      const to = from + unref(pageSize) - 1;
      let query = supabase
        .from("transaction")
        .select("*, transaction_tag(tag:tag_id(*))", { count: "exact" })
        .order("transaction_date", { ascending: false })
        .range(from, to);
      if (unref(search)) {
        const s = unref(search).toLowerCase().trim();
        query = query.ilike("label", `%${s}%`);
      }
      if (unref(showWithoutCategory)) {
        query = query.is('category_id', null);
      }
      if (filterCategoryIds && unref(filterCategoryIds)?.length > 0) {
        query = query.in('category_id', unref(filterCategoryIds));
      }
      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      const transactionsWithTags = (data as any[]).map((tx) => ({
        ...tx,
        tags: (tx.transaction_tag ?? []).map((tt: any) => tt.tag).filter(Boolean),
      }));
      return { data: transactionsWithTags, count: count ?? 0 };
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

export function useAddBulkTransactionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transactions: TablesInsert<"transaction">[]) => {
      if (transactions.length === 0) return [];

      // Utilisation de la méthode upsert qui ignore les entrées existantes
      const { data, error } = await supabase
        .from("transaction")
        .upsert(transactions, {
          onConflict: "label,amount,transaction_date,user_id", // Définit les colonnes qui forment la clé d'unicité
          ignoreDuplicates: true, // Ignorer les doublons au lieu de les mettre à jour
        })
        .select();

      if (error) throw new Error(error.message);
      return data as Transaction[];
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

export function useCategoryTransactionsQuery(categoryId: string) {
  return useQuery<{ data: Transaction[] }>({
    queryKey: ["transactions", "category", categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction")
        .select("*")
        .eq("category_id", categoryId)
        .order("transaction_date", { ascending: false });
      if (error) throw new Error(error.message);
      return { data: data as Transaction[] };
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5,
  });
}
