<template>
  <UCard class="mb-6 px-4 py-3">
    <template #header>
      <div class="flex flex-row items-center justify-between">
        <h2 class="text-lg font-bold text-warning">Actions en lot</h2>
        <UButton
          aria-label="Fermer"
          color="gray"
          icon="i-lucide-x"
          size="sm"
          variant="ghost"
          @click="$emit('close')"
        />
      </div>
    </template>
    <div v-if="selectedTransactions.length === 0" class="text-gray-500 mb-2">
      Aucune transaction sélectionnée.
    </div>
    <div v-else>
      <p class="mb-2">{{ selectedTransactions.length }} transaction(s) sélectionnée(s).</p>
      <UForm class="flex flex-col gap-4" @submit.prevent>
        <!-- Catégorie -->
        <div class="flex flex-col sm:flex-row gap-2 items-stretch">
          <UFormField class="flex-1 flex flex-col justify-end" label="Catégorie" name="category">
            <USelect
              v-model="selectedCategoryId"
              class="w-full"
              :items="[
                { label: 'Aucune', value: null },
                ...((categories ?? []) as Array<{ label: string; id: string }>).map((cat) => ({
                  label: cat.label,
                  value: cat.id,
                })),
              ]"
            />
          </UFormField>
          <div class="flex items-end">
            <UButton
              class="w-full sm:w-auto"
              color="primary"
              :disabled="!selectedCategoryId"
              icon="i-lucide-check"
              type="button"
              @click="assignCategoryToAll"
            >
              Attribuer à tous
            </UButton>
          </div>
        </div>
        <!-- Tag -->
        <div class="flex flex-col sm:flex-row gap-2 items-stretch">
          <UFormField class="flex-1 flex flex-col justify-end" label="Tag" name="tag">
            <USelect
              v-model="selectedTagId"
              class="w-full"
              :items="[
                { label: 'Choisir un tag', value: null },
                ...((tags ?? []) as Array<{ label: string; id: string }>).map((tag) => ({
                  label: tag.label,
                  value: tag.id,
                })),
              ]"
            />
          </UFormField>
          <div class="flex flex-row gap-2 items-end w-full sm:w-auto">
            <UButton
              class="w-full sm:w-auto"
              color="success"
              :disabled="!selectedTagId"
              icon="i-lucide-plus"
              type="button"
              @click="addTagToAll"
            >
              Ajouter à tous
            </UButton>
            <UButton
              class="w-full sm:w-auto"
              color="warning"
              :disabled="!selectedTagId"
              icon="i-lucide-minus"
              type="button"
              @click="removeTagFromAll"
            >
              Retirer de tous
            </UButton>
          </div>
        </div>
        <!-- Suppression -->
        <div class="flex flex-col sm:flex-row items-center gap-2">
          <UButton
            class="w-full sm:w-auto"
            color="red"
            :disabled="false"
            icon="i-lucide-trash"
            type="button"
            @click="deleteAll"
          >
            Supprimer toutes les transactions sélectionnées
          </UButton>
        </div>
      </UForm>
    </div>
  </UCard>
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
  /* Plus besoin de .input, tout est Nuxt UI */
</style>
