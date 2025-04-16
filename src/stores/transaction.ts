import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/supabase";
import type { Tables } from "@/types/supabase";

export interface Transaction extends Tables<"transaction"> {}

export const useTransactionStore = defineStore("transaction", () => {
  const transactions = ref<Transaction[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Transaction courante pour l'édition
  const currentTransaction = ref<Transaction | null>(null);

  // Récupérer toutes les transactions
  const fetchTransactions = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    const { data, error: err } = await supabase.from("transaction").select("*");
    if (err) {
      error.value = err.message;
    } else {
      transactions.value = data as Transaction[];
    }
    loading.value = false;
  };

  // Ajouter une transaction
  const addTransaction = async (
    payload: Omit<Transaction, "id" | "created_at">
  ): Promise<Transaction | null> => {
    error.value = null;
    const { data, error: err } = await supabase
      .from("transaction")
      .insert([payload])
      .select();
    if (err) {
      error.value = err.message;
      return null;
    }
    if (data && data.length > 0) {
      transactions.value.push(data[0] as Transaction);
      return data[0] as Transaction;
    }
    return null;
  };

  // Modifier une transaction
  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> => {
    error.value = null;
    const { data, error: err } = await supabase
      .from("transaction")
      .update(updates)
      .eq("id", id)
      .select();
    if (err) {
      error.value = err.message;
      return null;
    }
    if (data && data.length > 0) {
      const idx = transactions.value.findIndex((t) => t.id === id);
      if (idx !== -1) transactions.value[idx] = data[0] as Transaction;
      return data[0] as Transaction;
    }
    return null;
  };

  // Supprimer une transaction
  const deleteTransaction = async (id: string): Promise<boolean> => {
    error.value = null;
    const { error: err } = await supabase
      .from("transaction")
      .delete()
      .eq("id", id);
    if (err) {
      error.value = err.message;
      return false;
    }
    transactions.value = transactions.value.filter((t) => t.id !== id);
    return true;
  };

  // Récupérer une transaction par son id
  const getTransactionById = (id: string): Transaction | undefined => {
    return transactions.value.find((t) => t.id === id);
  };

  // Récupérer une transaction par son id (depuis Supabase)
  const fetchTransactionById = async (
    id: string
  ): Promise<Transaction | null> => {
    error.value = null;
    loading.value = true;
    const { data, error: err } = await supabase
      .from("transaction")
      .select("*")
      .eq("id", id)
      .single();
    loading.value = false;
    if (err) {
      error.value = err.message;
      return null;
    }
    return data as Transaction;
  };

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionById,
    fetchTransactionById,
    currentTransaction,
  };
});
