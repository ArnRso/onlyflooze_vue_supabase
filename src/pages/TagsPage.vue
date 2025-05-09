<script lang="ts" setup>
import { ref } from 'vue'
import {
  useAddTagMutation,
  useDeleteTagMutation,
  useTagsQuery,
  useUpdateTagMutation,
} from '@/queries/useTags'
import { Tag } from '@/queries/useTransactions'

const { data: tags, isLoading, error } = useTagsQuery()
const { mutateAsync: addTag, isPending: isAdding } = useAddTagMutation()
const { mutateAsync: deleteTag } = useDeleteTagMutation()
const { mutateAsync: updateTag } = useUpdateTagMutation()

const newLabel = ref('')
const editId = ref<string | null>(null)
const editLabel = ref('')

const handleAdd = async () => {
  if (!newLabel.value.trim()) return
  await addTag({ label: newLabel.value })
  newLabel.value = ''
}

const startEdit = (tag: Tag) => {
  editId.value = tag.id
  editLabel.value = tag.label
}

const handleEdit = async () => {
  if (!editLabel.value.trim()) return
  if (editId.value) {
    await updateTag({
      id: editId.value,
      updates: { label: editLabel.value },
    })
    editId.value = null
    editLabel.value = ''
  }
}

const handleDelete = async (id: string) => {
  if (confirm('Supprimer ce tag ?')) {
    await deleteTag(id)
  }
}
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
      <form class="flex gap-2 mb-6" @submit.prevent="handleAdd">
        <input
          v-model="newLabel"
          :disabled="isAdding"
          class="flex-1 border rounded px-3 py-2"
          placeholder="Nouveau tag"
          type="text"
        />
        <button
          :disabled="isAdding || !newLabel.trim()"
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
          type="submit"
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
              class="flex-1 border rounded px-2 py-1"
              type="text"
            />
            <button
              class="bg-green-600 text-white px-2 py-1 rounded shadow"
              @click="handleEdit"
            >
              Valider
            </button>
            <button
              class="bg-gray-300 px-2 py-1 rounded"
              @click="
                () => {
                  editId = null
                  editLabel = ''
                }
              "
            >
              Annuler
            </button>
          </div>
          <div v-if="editId !== tag.id" class="flex gap-2">
            <button
              class="text-blue-600 hover:underline"
              @click="() => startEdit(tag)"
            >
              Modifier
            </button>
            <button
              class="text-red-600 hover:underline"
              @click="() => handleDelete(tag.id)"
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
