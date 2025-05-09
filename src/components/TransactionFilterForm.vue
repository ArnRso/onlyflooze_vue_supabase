<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useCategoriesQuery } from '@/queries/useCategories'
import { useTagsQuery } from '@/queries/useTags'
import type { TransactionFilter } from '@/types/TransactionFilter'

const props = defineProps<{ filters: TransactionFilter }>()
const emit = defineEmits<{
  (e: 'update:filters', filters: TransactionFilter): void
}>()

// Champs locaux synchronisés avec la prop
const label = ref(props.filters.label)
const dateMin = ref(props.filters.dateMin)
const dateMax = ref(props.filters.dateMax)
const amountMin = ref<number | null>(props.filters.amountMin)
const amountMax = ref<number | null>(props.filters.amountMax)
const selectedCategory = ref<string | null>(props.filters.category)
const selectedTag = ref<string | null>(props.filters.tag)

// Synchronisation descendante : si la prop change, on met à jour les champs locaux
watch(
  () => props.filters,
  (newFilters) => {
    label.value = newFilters.label
    dateMin.value = newFilters.dateMin
    dateMax.value = newFilters.dateMax
    amountMin.value = newFilters.amountMin
    amountMax.value = newFilters.amountMax
    selectedCategory.value = newFilters.category
    selectedTag.value = newFilters.tag
  },
  { deep: true, immediate: true }
)

const { data: categories } = useCategoriesQuery()
const { data: tags } = useTagsQuery()

// Émission à chaque modification locale
watch(
  [
    label,
    dateMin,
    dateMax,
    amountMin,
    amountMax,
    selectedCategory,
    selectedTag,
  ],
  () => {
    emit('update:filters', {
      label: label.value,
      dateMin: dateMin.value,
      dateMax: dateMax.value,
      amountMin: amountMin.value,
      amountMax: amountMax.value,
      category: selectedCategory.value,
      tag: selectedTag.value,
    })
  },
  { deep: true }
)

function resetFilters() {
  label.value = ''
  dateMin.value = ''
  dateMax.value = ''
  amountMin.value = null
  amountMax.value = null
  selectedCategory.value = null
  selectedTag.value = null
}
</script>

<template>
  <form
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end w-full mb-6"
    @submit.prevent
  >
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Libellé</label
      >
      <input
        v-model="label"
        class="input"
        placeholder="Recherche libellé"
        type="text"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Date min</label
      >
      <input
        v-model="dateMin"
        class="input"
        placeholder="Date min"
        type="date"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Date max</label
      >
      <input
        v-model="dateMax"
        class="input"
        placeholder="Date max"
        type="date"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Montant min</label
      >
      <input
        v-model.number="amountMin"
        class="input"
        placeholder="Montant min"
        type="number"
        step="0.01"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Montant max</label
      >
      <input
        v-model.number="amountMax"
        class="input"
        placeholder="Montant max"
        type="number"
        step="0.01"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1"
        >Catégorie</label
      >
      <select v-model="selectedCategory" class="input">
        <option :value="null">Toutes</option>
        <option v-for="cat in categories ?? []" :key="cat.id" :value="cat.id">
          {{ cat.label }}
        </option>
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Tag</label>
      <select v-model="selectedTag" class="input">
        <option :value="null">Tous</option>
        <option v-for="tag in tags ?? []" :key="tag.id" :value="tag.id">
          {{ tag.label }}
        </option>
      </select>
    </div>
    <div class="sm:col-span-2 md:col-span-4 flex justify-end gap-2">
      <button
        type="button"
        class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded shadow"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </div>
  </form>
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
form > div {
  min-width: 0;
}
</style>
