<script lang="ts" setup>
  import { ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useTransactionByIdQuery, useUpdateTransactionMutation } from '@/queries/useTransactions'
  import { useCategoriesQuery } from '@/queries/useCategories'
  import Multiselect from 'vue-multiselect'
  import { useTagsQuery, useAddTagMutation } from '@/queries/useTags'
  import {
    useTransactionTagsQuery,
    useAddTransactionTagMutation,
    useDeleteTransactionTagMutation,
  } from '@/queries/useTransactionTags'
  import { useAddCategoryMutation } from '@/queries/useCategories'
  import type { Category, Tag } from '@/queries/useTransactions'

  const props = defineProps<{ id: string }>()
  const router = useRouter()
  const { data: transaction } = useTransactionByIdQuery(props.id)
  const { mutateAsync, isPending } = useUpdateTransactionMutation()
  const { data: categories } = useCategoriesQuery()
  const { data: tags = [] } = useTagsQuery()
  const { mutateAsync: addTag } = useAddTagMutation()
  const { mutateAsync: addCategory } = useAddCategoryMutation()
  const { data: transactionTags = [] } = useTransactionTagsQuery(props.id)
  const { mutateAsync: addTxTag } = useAddTransactionTagMutation()
  const { mutateAsync: deleteTxTag } = useDeleteTransactionTagMutation()

  const label = ref('')
  const amount = ref(0)
  const transaction_date = ref('')
  const category_id = ref('')
  const error = ref('')
  const selectedCategory = ref<Category | null>(null)
  const selectedTags = ref<Tag[]>([])
  const pendingCategoryId = ref<string | null>(null)

  watch(
    transaction,
    (transaction) => {
      if (transaction) {
        label.value = transaction.label
        amount.value = transaction.amount
        transaction_date.value = transaction.transaction_date
        category_id.value = transaction.category_id || ''
        selectedCategory.value =
          categories.value?.find((c: Category) => c.id === transaction.category_id) || null
        selectedTags.value = Array.isArray(transactionTags)
          ? transactionTags
          : (transactionTags?.value ?? [])
      }
    },
    { immediate: true }
  )

  async function handleCategoryCreate(newLabel: string) {
    const newCategory = await addCategory({ label: newLabel })
    pendingCategoryId.value = newCategory.id
  }

  watch(
    () => categories.value,
    (cats) => {
      if (pendingCategoryId.value && cats) {
        const found = cats.find((c: Category) => c.id === pendingCategoryId.value)
        if (found) {
          selectedCategory.value = found
          category_id.value = found.id
          pendingCategoryId.value = null
        }
      }
    }
  )

  async function handleTagCreate(newLabel: string) {
    const tag = await addTag({ label: newLabel })
    selectedTags.value = [...selectedTags.value, tag]
    await addTxTag({ transaction_id: props.id, tag_id: tag.id })
  }

  watch(
    selectedTags,
    async (newTags, oldTags) => {
      // Ajout
      for (const tag of newTags) {
        if (!oldTags.find((t) => t.id === tag.id)) {
          await addTxTag({ transaction_id: props.id, tag_id: tag.id })
        }
      }
      // Suppression
      for (const tag of oldTags) {
        if (!newTags.find((t) => t.id === tag.id)) {
          await deleteTxTag({ transaction_id: props.id, tag_id: tag.id })
        }
      }
    },
    { deep: true }
  )

  const submit = async () => {
    error.value = ''
    try {
      await mutateAsync({
        id: props.id,
        updates: {
          label: label.value,
          amount: amount.value,
          transaction_date: transaction_date.value,
          category_id: selectedCategory.value?.id || null,
        },
      })
      await router.push('/transactions')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la modification'
    }
  }
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-white py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-7xl w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
      <h1 class="text-2xl font-bold mb-6 text-center">Modifier la transaction</h1>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block mb-1">Libellé</label>
          <input v-model="label" class="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label class="block mb-1">Montant (€)</label>
          <input
            v-model.number="amount"
            class="w-full border rounded px-3 py-2"
            required
            step="0.01"
            type="number"
          />
        </div>
        <div>
          <label class="block mb-1">Date</label>
          <input
            v-model="transaction_date"
            class="w-full border rounded px-3 py-2"
            required
            type="date"
          />
        </div>
        <div>
          <label class="block mb-1">Catégorie</label>
          <Multiselect
            v-model="selectedCategory"
            :allow-empty="true"
            class="w-full"
            label="label"
            :options="categories ?? []"
            placeholder="Sélectionner ou créer une catégorie"
            :taggable="true"
            track-by="id"
            @tag="handleCategoryCreate"
          />
        </div>
        <div>
          <label class="block mb-1">Tags</label>
          <Multiselect
            v-model="selectedTags"
            class="w-full"
            label="label"
            :multiple="true"
            :options="tags ?? []"
            placeholder="Ajouter ou créer des tags"
            :taggable="true"
            track-by="id"
            @tag="handleTagCreate"
          />
        </div>
        <div v-if="error" class="text-red-600 text-center">{{ error }}</div>
        <div class="flex justify-between items-center">
          <button class="text-gray-600" type="button" @click="() => router.push('/transactions')">
            Annuler
          </button>
          <button
            class="bg-indigo-600 text-white px-4 py-2 rounded shadow"
            :disabled="isPending"
            type="submit"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
  input:disabled {
    background: #f3f3f3;
  }
</style>
