import { ref } from "vue";
import { supabase } from "@/supabase.js";

export default function useCategory() {
  const categories = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Récupérer toutes les catégories
  const fetchCategories = async () => {
    loading.value = true;
    error.value = null;
    const { data, error: err } = await supabase.from("category").select("*");
    if (err) {
      error.value = err.message;
    } else {
      categories.value = data;
    }
    loading.value = false;
  };

  // Ajouter une catégorie
  const addCategory = async (label) => {
    error.value = null;
    const { data, error: err } = await supabase
      .from("category")
      .insert([{ label }])
      .select();
    if (err) {
      error.value = err.message;
      return null;
    }
    if (data && data.length > 0) {
      categories.value.push(data[0]);
      return data[0];
    }
    return null;
  };

  // Modifier une catégorie
  const updateCategory = async (id, updates) => {
    error.value = null;
    const { data, error: err } = await supabase
      .from("category")
      .update(updates)
      .eq("id", id)
      .select();
    if (err) {
      error.value = err.message;
      return null;
    }
    if (data && data.length > 0) {
      const idx = categories.value.findIndex((c) => c.id === id);
      if (idx !== -1) categories.value[idx] = data[0];
      return data[0];
    }
    return null;
  };

  // Supprimer une catégorie
  const deleteCategory = async (id) => {
    error.value = null;
    const { error: err } = await supabase
      .from("category")
      .delete()
      .eq("id", id);
    if (err) {
      error.value = err.message;
      return false;
    }
    categories.value = categories.value.filter((c) => c.id !== id);
    return true;
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
