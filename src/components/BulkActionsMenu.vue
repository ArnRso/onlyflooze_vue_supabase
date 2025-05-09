<template>
  <div class="mb-6 px-4 py-3 bg-orange-50 rounded-lg shadow-sm border border-orange-200">
    <div class="flex flex-row items-center justify-between mb-2">
      <h2 class="text-lg font-bold text-orange-700">Actions en lot</h2>
      <button
        aria-label="Fermer"
        class="text-orange-500 hover:text-orange-700 font-semibold"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>
    <div v-if="selectedTransactions.length === 0" class="text-gray-500 mb-2">
      Aucune transaction sélectionnée.
    </div>
    <div v-else>
      <p class="mb-2">{{ selectedTransactions.length }} transaction(s) sélectionnée(s).</p>
      <form class="flex flex-col gap-4">
        <!-- Attribution catégorie -->
        <div class="flex flex-row items-center gap-2">
          <label class="font-medium">Catégorie :</label>
          <select v-model="selectedCategoryId" class="input">
            <option :value="null">Aucune</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.label }}</option>
          </select>
          <button
            class="bg-indigo-600 text-white px-3 py-1.5 rounded shadow hover:bg-indigo-700"
            :disabled="!selectedCategoryId"
            type="button"
            @click="assignCategoryToAll"
          >
            Attribuer à tous
          </button>
        </div>
        <!-- Ajout/suppression tag -->
        <div class="flex flex-row items-center gap-2">
          <label class="font-medium">Tag :</label>
          <select v-model="selectedTagId" class="input">
            <option :value="null">Choisir un tag</option>
            <option v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.label }}</option>
          </select>
          <button
            class="bg-green-600 text-white px-3 py-1.5 rounded shadow hover:bg-green-700"
            :disabled="!selectedTagId"
            type="button"
            @click="addTagToAll"
          >
            Ajouter à tous
          </button>
          <button
            class="bg-yellow-500 text-white px-3 py-1.5 rounded shadow hover:bg-yellow-600"
            :disabled="!selectedTagId"
            type="button"
            @click="removeTagFromAll"
          >
            Retirer de tous
          </button>
        </div>
        <!-- Suppression en masse -->
        <div class="flex flex-row items-center gap-2">
          <button
            class="bg-red-600 text-white px-3 py-1.5 rounded shadow hover:bg-red-700"
            type="button"
            @click="deleteAll"
          >
            Supprimer toutes les transactions sélectionnées
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useCategoriesQuery } from '@/queries/useCategories'
  import { useTagsQuery } from '@/queries/useTags'
  import {
    useUpdateTransactionMutation,
    useDeleteTransactionMutation,
  } from '@/queries/useTransactions'
  import {
    useAddTransactionTagMutation,
    useDeleteTransactionTagMutation,
  } from '@/queries/useTransactionTags'
  import type { Transaction, Tag, Category } from '@/queries/useTransactions'

  const props = defineProps<{
    selectedTransactions: Array<Transaction & { tags: Tag[]; category?: Category | null }>
  }>()
  const emit = defineEmits(['close'])

  const { data: categories = [] } = useCategoriesQuery()
  const { data: tags = [] } = useTagsQuery()
  const selectedCategoryId = ref<string | null>(null)
  const selectedTagId = ref<string | null>(null)

  const { mutateAsync: updateTransaction } = useUpdateTransactionMutation()
  const { mutateAsync: deleteTransaction } = useDeleteTransactionMutation()
  const { mutateAsync: addTag } = useAddTransactionTagMutation()
  const { mutateAsync: removeTag } = useDeleteTransactionTagMutation()

  async function assignCategoryToAll() {
    if (!selectedCategoryId.value) return
    await Promise.all(
      props.selectedTransactions.map((tx) =>
        updateTransaction({ id: tx.id, updates: { category_id: selectedCategoryId.value } })
      )
    )
    emit('close')
  }

  async function addTagToAll() {
    if (!selectedTagId.value) return
    await Promise.all(
      props.selectedTransactions.map((tx) =>
        addTag({ transaction_id: tx.id, tag_id: selectedTagId.value! })
      )
    )
    emit('close')
  }

  async function removeTagFromAll() {
    if (!selectedTagId.value) return
    await Promise.all(
      props.selectedTransactions.map((tx) =>
        removeTag({ transaction_id: tx.id, tag_id: selectedTagId.value! })
      )
    )
    emit('close')
  }

  async function deleteAll() {
    if (!confirm('Supprimer toutes les transactions sélectionnées ?')) return
    await Promise.all(props.selectedTransactions.map((tx) => deleteTransaction(tx.id)))
    emit('close')
  }
</script>

<style scoped>
  .input {
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
  }
</style>
