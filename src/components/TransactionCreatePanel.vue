<script lang="ts" setup>
  import { ref } from 'vue'
  import { useCategoriesQuery } from '@/queries/useCategories'
  import { useTagsQuery } from '@/queries/useTags'
  import { useAddTransactionMutation } from '@/queries/useTransactions'
  import { useAddTransactionTagMutation } from '@/queries/useTransactionTags'

  const emit = defineEmits(['close', 'created'])

  const label = ref('')
  const date = ref('')
  const amount = ref<number | null>(null)
  const category = ref<string | null>(null)
  const tag = ref<string | null>(null)
  const error = ref('')
  const isLoading = ref(false)

  const { data: categories } = useCategoriesQuery()
  const { data: tags } = useTagsQuery()
  const { mutateAsync: addTransaction } = useAddTransactionMutation()
  const { mutateAsync: addTransactionTag } = useAddTransactionTagMutation()

  async function handleSubmit() {
    error.value = ''
    if (!label.value || !date.value || amount.value === null) {
      error.value = 'Veuillez remplir tous les champs obligatoires.'
      return
    }
    isLoading.value = true
    try {
      const tx = await addTransaction({
        label: label.value,
        transaction_date: date.value,
        amount: amount.value,
        category_id: category.value || null,
      })
      if (tag.value && tx && tx.id) {
        await addTransactionTag({ transaction_id: tx.id, tag_id: tag.value })
      }
      emit('created')
      emit('close')
      label.value = ''
      date.value = ''
      amount.value = null
      category.value = null
      tag.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur lors de la création.'
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <div class="mb-6 px-4 py-3 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200">
    <div class="flex flex-row items-center justify-between mb-2">
      <h2 class="text-lg font-bold text-indigo-700">Créer une transaction</h2>
      <button
        aria-label="Fermer"
        class="text-indigo-500 hover:text-indigo-700 font-semibold"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>
    <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium mb-1">Libellé *</label>
        <input v-model="label"
               class="input"
               required
               type="text"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Date *</label>
        <input v-model="date"
               class="input"
               required
               type="date"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Montant *</label>
        <input v-model.number="amount"
               class="input"
               required
               step="0.01"
               type="number"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Catégorie</label>
        <select v-model="category" class="input">
          <option :value="null">Aucune</option>
          <option v-for="cat in categories ?? []" :key="cat.id" :value="cat.id">
            {{ cat.label }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tag</label>
        <select v-model="tag" class="input">
          <option :value="null">Aucun</option>
          <option v-for="t in tags ?? []" :key="t.id" :value="t.id">{{ t.label }}</option>
        </select>
      </div>
      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
      <button
        class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Création...' : 'Créer' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
  .input {
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    width: 100%;
    min-width: 0;
    font-size: 1rem;
    background: #fff;
    transition: border-color 0.2s;
  }
  .input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 1px #6366f1;
  }
</style>
