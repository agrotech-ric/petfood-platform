import {
  ACTIVITY_FILTER_GROUPS,
  AGE_OPTIONS,
  EMPTY_PET_DASHBOARD_FILTERS,
  FAVORITE_OPTIONS,
  GENDER_OPTIONS,
  RECIPE_OPTIONS,
  SIZE_OPTIONS,
  type FilterChip,
  type PetDashboardFilters,
} from '../types/petDashboardFilters'
import type { Breed, HealthCondition, ReproductiveStatus, Symptom } from '../../services/referenceService'

export function filtersToChips(
  filters: PetDashboardFilters,
  labels: {
    breeds: Breed[]
    symptoms: Symptom[]
    reproductiveStatuses: ReproductiveStatus[]
    healthConditions: HealthCondition[]
  }
): FilterChip[] {
  const chips: FilterChip[] = []

  for (const g of filters.genders) {
    const opt = GENDER_OPTIONS.find((o) => o.value === g)
    if (opt) chips.push({ id: `gender:${g}`, label: opt.label })
  }

  for (const a of filters.ageGroups) {
    const opt = AGE_OPTIONS.find((o) => o.value === a)
    if (opt) chips.push({ id: `age:${a}`, label: opt.label })
  }

  if (filters.minWeight != null || filters.maxWeight != null) {
    const min = filters.minWeight ?? 0
    const max = filters.maxWeight != null ? String(filters.maxWeight) : '∞'
    chips.push({ id: 'weight', label: `Вес, кг: ${min} - ${max}` })
  }

  for (const breedId of filters.breedIds) {
    const b = labels.breeds.find((x) => x.id === breedId)
    const name = b?.nameRu || b?.name || b?.nameEn || String(breedId)
    chips.push({ id: `breed:${breedId}`, label: name })
  }

  for (const s of filters.sizeCategories) {
    const opt = SIZE_OPTIONS.find((o) => o.value === s)
    if (opt) chips.push({ id: `size:${s}`, label: opt.label })
  }

  for (const id of filters.reproductiveStatusIds) {
    const r = labels.reproductiveStatuses.find((x) => x.id === id)
    if (r) chips.push({ id: `repro:${id}`, label: r.name || r.nameRu || String(id) })
  }

  for (const group of ACTIVITY_FILTER_GROUPS) {
    if (group.ids.every((id) => filters.activityTypeIds.includes(id))) {
      chips.push({ id: `activity:${group.label}`, label: group.label })
    }
  }

  if (filters.symptomIds.includes(-1)) {
    chips.push({ id: 'symptom:none', label: 'Нет' })
  }
  for (const id of filters.symptomIds.filter((x) => x > 0)) {
    const s = labels.symptoms.find((x) => x.id === id)
    const name = s?.name || s?.nameRu || String(id)
    chips.push({ id: `symptom:${id}`, label: name })
  }

  for (const code of filters.healthConditionCodes) {
    const h = labels.healthConditions.find((x) => x.code === code)
    if (h) chips.push({ id: `health:${code}`, label: h.nameRu || h.name || code })
  }

  if (filters.favorite !== 'all') {
    const f = FAVORITE_OPTIONS.find((o) => o.value === filters.favorite)
    if (f) chips.push({ id: `favorite:${filters.favorite}`, label: f.label })
  }

  if (filters.recipeStatus !== 'all') {
    const r = RECIPE_OPTIONS.find((o) => o.value === filters.recipeStatus)
    if (r) chips.push({ id: `recipe:${filters.recipeStatus}`, label: r.label })
  }

  return chips
}

export function removeFilterChip(filters: PetDashboardFilters, chipId: string): PetDashboardFilters {
  const next = { ...filters }
  if (chipId.startsWith('gender:')) {
    next.genders = next.genders.filter((g) => `gender:${g}` !== chipId)
  } else if (chipId.startsWith('age:')) {
    next.ageGroups = next.ageGroups.filter((a) => `age:${a}` !== chipId)
  } else if (chipId === 'weight') {
    next.minWeight = null
    next.maxWeight = null
  } else if (chipId.startsWith('breed:')) {
    const id = Number(chipId.slice(6))
    next.breedIds = next.breedIds.filter((b) => b !== id)
  } else if (chipId.startsWith('size:')) {
    const v = chipId.slice(5)
    next.sizeCategories = next.sizeCategories.filter((s) => s !== v)
  } else if (chipId.startsWith('repro:')) {
    const id = Number(chipId.slice(6))
    next.reproductiveStatusIds = next.reproductiveStatusIds.filter((r) => r !== id)
  } else if (chipId.startsWith('activity:')) {
    const label = chipId.slice(9)
    const group = ACTIVITY_FILTER_GROUPS.find((g) => g.label === label)
    if (group) {
      next.activityTypeIds = next.activityTypeIds.filter((id) => !group.ids.includes(id))
    }
  } else if (chipId === 'symptom:none') {
    next.symptomIds = next.symptomIds.filter((id) => id !== -1)
  } else if (chipId.startsWith('symptom:')) {
    const id = Number(chipId.slice(8))
    next.symptomIds = next.symptomIds.filter((s) => s !== id)
  } else if (chipId.startsWith('health:')) {
    const code = chipId.slice(7)
    next.healthConditionCodes = next.healthConditionCodes.filter((c) => c !== code)
  } else if (chipId.startsWith('favorite:')) {
    next.favorite = 'all'
  } else if (chipId.startsWith('recipe:')) {
    next.recipeStatus = 'all'
  }
  return next
}

export function hasActiveFilters(filters: PetDashboardFilters): boolean {
  return JSON.stringify(filters) !== JSON.stringify(EMPTY_PET_DASHBOARD_FILTERS)
}
