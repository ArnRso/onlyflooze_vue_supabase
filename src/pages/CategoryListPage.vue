<script lang="ts" setup>
  import { ref } from 'vue'
  import type { Category } from '@/queries/useCategories'
  import {
    useAddCategoryMutation,
    useCategoriesQuery,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation,
  } from '@/queries/useCategories'
  import { useSessionQuery } from '@/queries/useAuth'
  import MdiMagnify from '@/components/icons/MdiMagnify.vue'
  import MdiPencil from '@/components/icons/MdiPencil.vue'
  import MdiTrashCan from '@/components/icons/MdiTrashCan.vue'

  const { data: categories, isLoading, error } = useCategoriesQuery()
  const { mutateAsync: addCategory, isPending: isAdding } = useAddCategoryMutation()
  // Suppression des variables inutilisées
  const { mutateAsync: deleteCategory } = useDeleteCategoryMutation()
  const { mutateAsync: updateCategory } = useUpdateCategoryMutation()
  const { data: user } = useSessionQuery()

  const userId = user && typeof user === 'object' && 'id' in user ? user.id : user?.value?.id

  const newLabel = ref('')
  const newIsRecurring = ref(false)
  const editId = ref<string | null>(null)
  const editLabel = ref('')
  const editIsRecurring = ref(false)

  const handleAdd = async () => {
    if (!newLabel.value.trim() || !userId) return
    await addCategory({
      label: newLabel.value,
      is_recurring: newIsRecurring.value,
    })
    newLabel.value = ''
    newIsRecurring.value = false
  }

  const startEdit = (cat: Category) => {
    editId.value = cat.id
    editLabel.value = cat.label
    editIsRecurring.value = cat.is_recurring
  }

  const handleEdit = async () => {
    if (!editLabel.value.trim()) return
    if (editId.value) {
      await updateCategory({
        id: editId.value,
        updates: { label: editLabel.value, is_recurring: editIsRecurring.value },
      })
      editId.value = null
      editLabel.value = ''
      editIsRecurring.value = false
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette catégorie ?')) {
      await deleteCategory(id)
    }
  }

  const handleToggleRecurring = (cat: Category) => {
    if (editId.value === cat.id) {
      editIsRecurring.value = !editIsRecurring.value
    } else {
      updateCategory({ id: cat.id, updates: { is_recurring: !cat.is_recurring } })
    }
  }
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">Catégories</h1>
      <form class="flex gap-2 mb-6 items-center" @submit.prevent="handleAdd">
        <input
          v-model="newLabel"
          class="flex-1 border rounded px-3 py-2"
          :disabled="isAdding"
          placeholder="Nouvelle catégorie"
          type="text"
        />
        <label
          class="flex items-center cursor-pointer select-none"
          @click="newIsRecurring = !newIsRecurring"
        >
          <span
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            :class="newIsRecurring ? 'bg-indigo-600' : 'bg-gray-300'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="newIsRecurring ? 'translate-x-6' : 'translate-x-1'"
            ></span>
          </span>
          <span class="ml-1">Récurrente</span>
        </label>
        <button
          class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
          :disabled="isAdding || !newLabel.trim()"
          type="submit"
        >
          Ajouter
        </button>
      </form>
      <div v-if="error" class="text-red-600 mb-4 text-center">
        {{ error }}
      </div>
      <div v-if="isLoading" class="text-center">Chargement...</div>
      <table class="min-w-full divide-y divide-gray-200 mb-6">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Nom
            </th>
            <th
              class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Statut
            </th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="cat in categories" :key="cat.id">
            <td class="px-4 py-2">
              <template v-if="editId !== cat.id">
                {{ cat.label }}
              </template>
              <template v-else>
                <input v-model="editLabel" class="flex-1 border rounded px-2 py-1" type="text" />
              </template>
            </td>
            <td class="px-4 py-2">
              <label
                class="flex items-center cursor-pointer select-none"
                @click="handleToggleRecurring(cat)"
              >
                <span
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                  :class="
                    (editId === cat.id ? editIsRecurring : cat.is_recurring)
                      ? 'bg-indigo-600'
                      : 'bg-gray-300'
                  "
                >
                  <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    :class="
                      (editId === cat.id ? editIsRecurring : cat.is_recurring)
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    "
                  ></span>
                </span>
                <span class="ml-1">Récurrente</span>
              </label>
            </td>
            <td class="px-4 py-2 text-right">
              <template v-if="editId !== cat.id">
                <router-link
                  class="inline-block text-indigo-600 hover:text-indigo-800 mr-2"
                  title="Détail"
                  :to="{ name: 'category-detail', params: { id: cat.id } }"
                >
                  <MdiMagnify class="w-5 h-5 align-middle" />
                </router-link>
                <button
                  class="inline-block text-blue-600 hover:text-blue-800 mr-2"
                  title="Modifier"
                  type="button"
                  @click="() => startEdit(cat)"
                >
                  <MdiPencil class="w-5 h-5 align-middle" />
                </button>
                <button
                  class="inline-block text-red-600 hover:text-red-800"
                  title="Supprimer"
                  type="button"
                  @click="() => handleDelete(cat.id)"
                >
                  <MdiTrashCan class="w-5 h-5 align-middle" />
                </button>
              </template>
              <template v-else>
                <button
                  class="bg-green-600 text-white px-2 py-1 rounded shadow mr-2"
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
                      editIsRecurring = false
                    }
                  "
                >
                  Annuler
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
  input:disabled {
    background: #f3f3f3;
  }
</style>
