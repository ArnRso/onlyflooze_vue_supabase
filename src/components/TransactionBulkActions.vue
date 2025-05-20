<template>
  <UCard class="mb-6 px-4 py-3">
    <template #header>
      <div class="flex flex-row items-center justify-between">
        <h2 class="text-lg font-bold text-primary">Actions en lot</h2>
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
      <form class="flex flex-col gap-4">
        <!-- Attribution catégorie -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch">
          <UFormField class="flex-1" label="Catégorie">
            <USelect v-model="selectedCategoryId" class="w-full" :items="categoryOptions" />
          </UFormField>
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
        <!-- Ajout/suppression tag -->
        <div class="flex flex-col sm:flex-row gap-4 items-stretch">
          <UFormField class="flex-1" label="Tag">
            <USelect v-model="selectedTagId" class="w-full" :items="tagOptions" />
          </UFormField>
          <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
        <!-- Suppression en masse -->
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <UButton
            class="w-full sm:w-auto"
            color="danger"
            icon="i-lucide-trash"
            type="button"
            @click="deleteAll"
          >
            Supprimer toutes les transactions sélectionnées
          </UButton>
        </div>
      </form>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue'
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
  const selectedCategoryId = ref<string>('')
  const selectedTagId = ref<string>('')

  const { mutateAsync: updateTransaction } = useUpdateTransactionMutation()
  const { mutateAsync: deleteTransaction } = useDeleteTransactionMutation()
  const { mutateAsync: addTag } = useAddTransactionTagMutation()
  const { mutateAsync: removeTag } = useDeleteTransactionTagMutation()

  type CategoryOption = { label: string; id: string }
  type TagOption = { label: string; id: string }

  function isRefArray<T>(val: unknown): val is { value: T[] } {
    return (
      !!val &&
      typeof val === 'object' &&
      'value' in val &&
      Array.isArray((val as { value?: unknown }).value)
    )
  }
  function getArray<T>(maybeRef: unknown): T[] {
    if (isRefArray<T>(maybeRef)) {
      return maybeRef.value
    }
    return Array.isArray(maybeRef) ? (maybeRef as T[]) : []
  }
  // S'assure que la valeur sélectionnée est toujours une string
  function ensureValidSelection(model: typeof selectedCategoryId, options: { value: string }[]) {
    if (!options.some((opt) => opt.value === model.value)) {
      model.value = options[0]?.value ?? '_none'
    }
  }

  const categoryOptions = computed<{ label: string; value: string }[]>(() => {
    const opts = [
      { label: 'Aucune', value: '_none' },
      ...getArray<CategoryOption>(categories).map((cat) => ({
        label: cat.label,
        value: cat.id,
      })),
    ]
    ensureValidSelection(selectedCategoryId, opts)
    return opts
  })
  const tagOptions = computed<{ label: string; value: string }[]>(() => {
    const opts = [
      { label: 'Choisir un tag', value: '_none' },
      ...getArray<TagOption>(tags).map((tag) => ({
        label: tag.label,
        value: tag.id,
      })),
    ]
    ensureValidSelection(selectedTagId, opts)
    return opts
  })

  async function assignCategoryToAll() {
    if (!selectedCategoryId.value || selectedCategoryId.value === '_none') return
    await Promise.all(
      props.selectedTransactions.map((tx) =>
        updateTransaction({ id: tx.id, updates: { category_id: selectedCategoryId.value } })
      )
    )
    emit('close')
  }

  async function addTagToAll() {
    if (!selectedTagId.value || selectedTagId.value === '_none') return
    await Promise.all(
      props.selectedTransactions.map((tx) =>
        addTag({ transaction_id: tx.id, tag_id: selectedTagId.value })
      )
    )
    emit('close')
  }

  async function removeTagFromAll() {
    if (!selectedTagId.value || selectedTagId.value === '_none') return
    await Promise.all(
      props.selectedTransactions.map((tx) =>
        removeTag({ transaction_id: tx.id, tag_id: selectedTagId.value })
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
  /* Harmonisé avec TransactionCreatePanel.vue */
</style>
