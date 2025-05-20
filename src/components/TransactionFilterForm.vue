<script lang="ts" setup>
  import { watch, computed, reactive } from 'vue'
  import { useCategoriesQuery } from '@/queries/useCategories'
  import { useTagsQuery } from '@/queries/useTags'
  import type { TransactionFilter } from '@/types/TransactionFilter'
  import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

  const props = defineProps<{ filters: TransactionFilter }>()
  const emit = defineEmits<{
    (e: 'update:filters', filters: TransactionFilter): void
    (e: 'close'): void
  }>()

  const state = reactive({
    label: props.filters.label,
    dateMin: props.filters.dateMin,
    dateMax: props.filters.dateMax,
    amountMin: props.filters.amountMin,
    amountMax: props.filters.amountMax,
    category: props.filters.category,
    tag: props.filters.tag,
  })

  watch(
    () => props.filters,
    (newFilters) => {
      state.label = newFilters.label
      state.dateMin = newFilters.dateMin
      state.dateMax = newFilters.dateMax
      state.amountMin = newFilters.amountMin
      state.amountMax = newFilters.amountMax
      state.category = newFilters.category
      state.tag = newFilters.tag
    },
    { deep: true, immediate: true }
  )

  watch(
    () => ({ ...state }),
    (newState) => {
      emit('update:filters', { ...newState })
    },
    { deep: true }
  )

  const { data: categories } = useCategoriesQuery()
  const { data: tags } = useTagsQuery()

  const tagOptions = computed(() => [
    { label: 'Tous', value: '_all' },
    { label: 'Sans tag', value: '_none' },
    ...(tags?.value ?? []).map((tag: { label: string; id: string }) => ({
      label: tag.label,
      value: tag.id,
    })),
  ])
  const categoryOptions = computed(() => [
    { label: 'Toutes', value: '_all' },
    { label: 'Sans catégorie', value: '_none' },
    ...(categories?.value ?? []).map((cat: { label: string; id: string }) => ({
      label: cat.label,
      value: cat.id,
    })),
  ])

  function toCalendarDate(str?: string) {
    if (!str) return undefined
    const [y, m, d] = str.split('-').map(Number)
    if (!y || !m || !d) return undefined
    return new CalendarDate(y, m, d)
  }
  function toDateString(cd?: CalendarDate) {
    if (!cd) return ''
    return `${cd.year.toString().padStart(4, '0')}-${cd.month.toString().padStart(2, '0')}-${cd.day.toString().padStart(2, '0')}`
  }

  const df = new Intl.DateTimeFormat('fr-FR')

  const dateMinCalendar = computed({
    get: () => toCalendarDate(state.dateMin),
    set: (v) => {
      state.dateMin = toDateString(v)
    },
  })
  const dateMaxCalendar = computed({
    get: () => toCalendarDate(state.dateMax),
    set: (v) => {
      state.dateMax = toDateString(v)
    },
  })

  const categoryModel = computed({
    get: () => (state.category === null ? '_all' : state.category),
    set: (v: string) => {
      state.category = v === '_all' ? null : v
    },
  })

  const tagModel = computed({
    get: () => (state.tag === null ? '_all' : state.tag),
    set: (v: string) => {
      state.tag = v === '_all' ? null : v
    },
  })

  function resetFilters() {
    state.label = ''
    state.dateMin = ''
    state.dateMax = ''
    state.amountMin = null
    state.amountMax = null
    state.category = null
    state.tag = null
  }
</script>

<template>
  <UCard class="mb-6 px-4 py-3">
    <template #header>
      <div class="flex flex-row items-center justify-between">
        <h2 class="text-lg font-bold text-primary">Recherche & filtres</h2>
        <UButton
          aria-label="Fermer"
          color="gray"
          icon="i-lucide-x"
          size="sm"
          variant="ghost"
          @click="emit('close')"
        />
      </div>
    </template>
    <UForm class="flex flex-col gap-4" :state="state" @submit.prevent>
      <UFormField label="Libellé" name="label">
        <UInput v-model="state.label" class="w-full" placeholder="Recherche libellé" />
      </UFormField>
      <div class="flex flex-col sm:flex-row gap-4">
        <UFormField class="flex-1" label="Date min" name="dateMin">
          <UPopover class="w-full">
            <div class="relative w-full">
              <UInput
                class="w-full cursor-pointer text-left"
                placeholder="Date min"
                readonly
                :value="
                  state.dateMin && toCalendarDate(state.dateMin)
                    ? df.format(toCalendarDate(state.dateMin)!.toDate(getLocalTimeZone()))
                    : ''
                "
              />
              <button
                v-if="state.dateMin"
                aria-label="Effacer la date min"
                class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                type="button"
                @click.stop="state.dateMin = ''"
              >
                <span class="i-lucide-x text-base"></span>
              </button>
            </div>
            <template #content>
              <UCalendar v-model="dateMinCalendar" class="p-2" locale="fr" />
            </template>
          </UPopover>
        </UFormField>
        <UFormField class="flex-1" label="Date max" name="dateMax">
          <UPopover class="w-full">
            <div class="relative w-full">
              <UInput
                class="w-full cursor-pointer text-left"
                placeholder="Date max"
                readonly
                :value="
                  state.dateMax && toCalendarDate(state.dateMax)
                    ? df.format(toCalendarDate(state.dateMax)!.toDate(getLocalTimeZone()))
                    : ''
                "
              />
              <button
                v-if="state.dateMax"
                aria-label="Effacer la date max"
                class="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                type="button"
                @click.stop="state.dateMax = ''"
              >
                <span class="i-lucide-x text-base"></span>
              </button>
            </div>
            <template #content>
              <UCalendar v-model="dateMaxCalendar" class="p-2" locale="fr" />
            </template>
          </UPopover>
        </UFormField>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <UFormField class="flex-1" label="Montant min" name="amountMin">
          <UInput
            v-model.number="state.amountMin"
            class="w-full"
            placeholder="Montant min"
            step="0.01"
            type="number"
          />
        </UFormField>
        <UFormField class="flex-1" label="Montant max" name="amountMax">
          <UInput
            v-model.number="state.amountMax"
            class="w-full"
            placeholder="Montant max"
            step="0.01"
            type="number"
          />
        </UFormField>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <UFormField class="flex-1" label="Catégorie" name="category">
          <USelect v-model="categoryModel" class="w-full" :items="categoryOptions" />
        </UFormField>
        <UFormField class="flex-1" label="Tag" name="tag">
          <USelect v-model="tagModel" class="w-full" :items="tagOptions" />
        </UFormField>
      </div>
      <div class="flex justify-end gap-2 mt-2">
        <UButton
          color="primary"
          icon="i-lucide-rotate-ccw"
          type="button"
          variant="outline"
          @click="resetFilters"
        >
          Réinitialiser
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<style scoped>
  /* Harmonisé avec TransactionCreatePanel.vue */
</style>
