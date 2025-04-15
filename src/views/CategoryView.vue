<script setup>
import { ref, onMounted } from "vue";
import useCategory from "@/composables/useCategory.js";
import useAuth from "@/composables/useAuth.js";

const {
  categories,
  loading,
  error,
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = useCategory();

const newLabel = ref("");
const editId = ref(null);
const editLabel = ref("");

onMounted(() => {
  fetchCategories();
});

const handleAdd = async () => {
  if (!newLabel.value.trim()) return;
  await addCategory(newLabel.value);
  newLabel.value = "";
};

const startEdit = (cat) => {
  editId.value = cat.id;
  editLabel.value = cat.label;
};

const handleEdit = async () => {
  if (!editLabel.value.trim()) return;
  await updateCategory(editId.value, { label: editLabel.value });
  editId.value = null;
  editLabel.value = "";
};

const handleDelete = async (id) => {
  if (confirm("Supprimer cette catégorie ?")) {
    await deleteCategory(id);
  }
};
</script>

<template>
  <div class="max-w-xl mx-auto py-8">
    <h1 class="text-2xl font-bold mb-4">Catégories</h1>

    <form @submit.prevent="handleAdd" class="flex gap-2 mb-6">
      <input
        v-model="newLabel"
        type="text"
        placeholder="Nouvelle catégorie"
        class="flex-1 border rounded px-3 py-2"
        :disabled="loading"
      />
      <button
        type="submit"
        class="bg-indigo-600 text-white px-4 py-2 rounded"
        :disabled="loading || !newLabel.trim()"
      >
        Ajouter
      </button>
    </form>

    <div v-if="error" class="text-red-600 mb-4">{{ error }}</div>
    <div v-if="loading">Chargement...</div>

    <ul>
      <li
        v-for="cat in categories"
        :key="cat.id"
        class="flex items-center justify-between py-2 border-b"
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
            class="bg-green-600 text-white px-2 py-1 rounded"
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
          <button @click="() => startEdit(cat)" class="text-blue-600">
            Modifier
          </button>
          <button @click="() => handleDelete(cat.id)" class="text-red-600">
            Supprimer
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
input:disabled {
  background: #f3f3f3;
}
</style>
