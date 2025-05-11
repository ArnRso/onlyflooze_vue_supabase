<script lang="ts" setup>
  import { ref, computed } from 'vue'
  import { useCategoriesQuery } from '@/queries/useCategories'
  import { useTagsQuery } from '@/queries/useTags'
  import { useAddTransactionMutation } from '@/queries/useTransactions'
  import { useAddTransactionTagMutation } from '@/queries/useTransactionTags'
  import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

  const emit = defineEmits(['close', 'created'])

  const label = ref('')
  const date = ref('')
  const amount = ref<number | null>(null)
  const category = ref<string | null>(null)
  const tag = ref<string | null>(null)
  const error = ref('')
  const isLoading = ref(false)

  const dateCalendar = computed({
    get: () => {
      if (!date.value) return undefined
      const [y, m, d] = date.value.split('-').map(Number)
      if (!y || !m || !d) return undefined
      return new CalendarDate(y, m, d)
    },
    set: (v) => {
      date.value = v
        ? `${v.year.toString().padStart(4, '0')}-${v.month.toString().padStart(2, '0')}-${v.day.toString().padStart(2, '0')}`
        : ''
    },
  })
  const df = new Intl.DateTimeFormat('fr-FR')

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
  <UCard class="mb-6 px-4 py-3">
    <template #header>
      <div class="flex flex-row items-center justify-between">
        <h2 class="text-lg font-bold text-primary">Créer une transaction</h2>
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
    <UForm class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <UFormField label="Libellé *" name="label">
        <UInput v-model="label"
                class="w-full"
                placeholder="Libellé"
                required
        />
      </UFormField>
      <div class="flex flex-col sm:flex-row gap-4">
        <UFormField class="flex-1" label="Date *" name="date">
          <UPopover class="w-full">
            <div class="relative w-full">
              <UInput
                class="w-full cursor-pointer text-left"
                icon="i-lucide-calendar"
                placeholder="Date"
                readonly
                required
                :value="date.value ? df.format(dateCalendar.value.toDate(getLocalTimeZone())) : ''"
                @click="open"
              />
              <button
                v-if="date.value"
                aria-label="Effacer la date"
                class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                type="button"
                @click.stop="date.value = ''"
              >
                <span class="i-lucide-x text-base"></span>
              </button>
            </div>
            <template #content>
              <UCalendar v-model="dateCalendar" class="p-2" locale="fr" />
            </template>
          </UPopover>
        </UFormField>
        <UFormField class="flex-1" label="Montant *" name="amount">
          <UInput
            v-model.number="amount"
            class="w-full"
            placeholder="Montant"
            required
            step="0.01"
            type="number"
          />
        </UFormField>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <UFormField class="flex-1" label="Catégorie" name="category">
          <USelect
            v-model="category"
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
        <UFormField class="flex-1" label="Tag" name="tag">
          <USelect
            v-model="tag"
            class="w-full"
            :items="[
              { label: 'Aucun', value: null },
              ...((tags ?? []) as Array<{ label: string; id: string }>).map((t) => ({
                label: t.label,
                value: t.id,
              })),
            ]"
          />
        </UFormField>
      </div>
      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
      <UButton block
               color="primary"
               icon="i-lucide-plus"
               :loading="isLoading"
               type="submit"
      >
        Créer
      </UButton>
    </UForm>
  </UCard>
</template>

<style scoped>
  /* Plus besoin de .input, tout est Nuxt UI */
</style>
