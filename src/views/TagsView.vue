<script setup lang="ts">
import { ref } from "vue";
import {
  useTagsQuery,
  useAddTagMutation,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from "@/queries/useTags";
import { Tag } from "@/queries/useTransactions";

const { data: tags, isLoading, error } = useTagsQuery();
const { mutateAsync: addTag, isPending: isAdding } = useAddTagMutation();
const { mutateAsync: deleteTag } = useDeleteTagMutation();
const { mutateAsync: updateTag } = useUpdateTagMutation();

const newLabel = ref("");
const editId = ref<string | null>(null);
const editLabel = ref("");

const handleAdd = async () => {
  if (!newLabel.value.trim()) return;
  await addTag({ label: newLabel.value });
  newLabel.value = "";
};

const startEdit = (tag: Tag) => {
  editId.value = tag.id;
  editLabel.value = tag.label;
};

const handleEdit = async () => {
  if (!editLabel.value.trim()) return;
  if (editId.value) {
    await updateTag({
      id: editId.value,
      updates: { label: editLabel.value },
    });
    editId.value = null;
    editLabel.value = "";
  }
};

const handleDelete = async (id: string) => {
  if (confirm("Supprimer ce tag ?")) {
    await deleteTag(id);
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div
      class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8"
    >
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Tags
      </h1>
      <form @submit.prevent="handleAdd" class="flex gap-2 mb-6">
        <input
          v-model="newLabel"
          type="text"
          placeholder="Nouveau tag"
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
          v-for="tag in tags"
          :key="tag.id"
          class="flex items-center justify-between py-2 border-b last:border-b-0"
        >
          <div v-if="editId !== tag.id">{{ tag.label }}</div>
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
          <div v-if="editId !== tag.id" class="flex gap-2">
            <button
              @click="() => startEdit(tag)"
              class="text-blue-600 hover:underline"
            >
              Modifier
            </button>
            <button
              @click="() => handleDelete(tag.id)"
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
