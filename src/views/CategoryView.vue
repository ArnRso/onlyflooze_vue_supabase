<script setup lang="ts">
import { ref } from "vue";
import type { Category } from "@/queries/useCategories";
import {
  useCategoriesQuery,
  useAddCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/queries/useCategories";
import { useSessionQuery } from "@/queries/useAuth";

const { data: categories, isLoading, error } = useCategoriesQuery();
const { mutateAsync: addCategory, isPending: isAdding } =
  useAddCategoryMutation();
const { mutateAsync: deleteCategory, isPending: isDeleting } =
  useDeleteCategoryMutation();
const { mutateAsync: updateCategory, isPending: isUpdating } =
  useUpdateCategoryMutation();
const { data: user } = useSessionQuery();

const userId =
  user && typeof user === "object" && "id" in user
    ? (user as any).id
    : (user as any)?.value?.id;

const newLabel = ref("");
const editId = ref<string | null>(null);
const editLabel = ref("");

const handleAdd = async () => {
  if (!newLabel.value.trim() || !userId) return;
  await addCategory({ label: newLabel.value, user_id: userId });
  newLabel.value = "";
};

const startEdit = (cat: Category) => {
  editId.value = cat.id;
  editLabel.value = cat.label;
};

const handleEdit = async () => {
  if (!editLabel.value.trim()) return;
  if (editId.value) {
    await updateCategory({
      id: editId.value,
      updates: { label: editLabel.value },
    });
    editId.value = null;
    editLabel.value = "";
  }
};

const handleDelete = async (id: string) => {
  if (confirm("Supprimer cette catégorie ?")) {
    await deleteCategory(id);
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div
      class="max-w-md w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Catégories
      </h1>
      <form @submit.prevent="handleAdd" class="flex gap-2 mb-6">
        <input
          v-model="newLabel"
          type="text"
          placeholder="Nouvelle catégorie"
          class="flex-1 border rounded px-3 py-2"
          :disabled="isAdding"
        />
        <button
          type="submit"
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
          :disabled="isAdding || !newLabel.trim()"
        >
          Ajouter
        </button>
      </form>
      <div v-if="error" class="text-red-600 mb-4 text-center">
        {{ error }}
      </div>
      <div v-if="isLoading" class="text-center">Chargement...</div>
      <ul>
        <li
          v-for="cat in categories"
          :key="cat.id"
          class="flex items-center justify-between py-2 border-b last:border-b-0"
        >
          <div v-if="editId !== cat.id">{{ cat.label }}</div>
          <div v-else class="flex gap-2 flex-1">
            <input
              v-model="editLabel"
              type="text"
              class="flex-1 border rounded px-2 py-1"
            />
            <button
              @click="handleEdit"
              class="bg-green-600 text-white px-2 py-1 rounded shadow"
            >
              Valider
            </button>
            <button
              @click="
                () => {
                  editId = null;
                  editLabel = '';
                }
              "
              class="bg-gray-300 px-2 py-1 rounded"
            >
              Annuler
            </button>
          </div>
          <div v-if="editId !== cat.id" class="flex gap-2">
            <button
              @click="() => startEdit(cat)"
              class="text-blue-600 hover:underline"
            >
              Modifier
            </button>
            <button
              @click="() => handleDelete(cat.id)"
              class="text-red-600 hover:underline"
            >
              Supprimer
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}
</style>
