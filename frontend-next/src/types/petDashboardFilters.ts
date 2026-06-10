export type PetDashboardFilters = {
  genders: string[]
  ageGroups: string[]
  minWeight: number | null
  maxWeight: number | null
  breedIds: number[]
  sizeCategories: string[]
  reproductiveStatusIds: number[]
  activityTypeIds: number[]
  symptomIds: number[]
  healthConditionCodes: string[]
  favorite: 'all' | 'saved' | 'unsaved'
  recipeStatus: 'all' | 'calculated' | 'not_calculated'
}

export type FilterChip = {
  id: string
  label: string
}

export const EMPTY_PET_DASHBOARD_FILTERS: PetDashboardFilters = {
  genders: [],
  ageGroups: [],
  minWeight: null,
  maxWeight: null,
  breedIds: [],
  sizeCategories: [],
  reproductiveStatusIds: [],
  activityTypeIds: [],
  symptomIds: [],
  healthConditionCodes: [],
  favorite: 'all',
  recipeStatus: 'all',
}

/** Figma activity labels → DB activity_type ids */
export const ACTIVITY_FILTER_GROUPS: { label: string; ids: number[] }[] = [
  { label: 'Пассивный', ids: [1] },
  { label: 'Средний', ids: [2, 3] },
  { label: 'Активный', ids: [4] },
  { label: 'Высокая активность в экстремальных условиях', ids: [5] },
]

export const GENDER_OPTIONS = [
  { label: 'Самец', value: 'male' },
  { label: 'Самка', value: 'female' },
] as const

export const AGE_OPTIONS = [
  { label: 'Щенки', value: 'puppy' },
  { label: 'Взрослые', value: 'adult' },
  { label: 'Пожилые', value: 'senior' },
] as const

export const SIZE_OPTIONS = [
  { label: 'Мелкие', value: 'small' },
  { label: 'Средние', value: 'medium' },
  { label: 'Крупные', value: 'large' },
] as const

export const FAVORITE_OPTIONS = [
  { label: 'Все', value: 'all' as const },
  { label: 'Сохранённые', value: 'saved' as const },
  { label: 'Несохранённые', value: 'unsaved' as const },
]

export const RECIPE_OPTIONS = [
  { label: 'Все', value: 'all' as const },
  { label: 'Рецептура рассчитана', value: 'calculated' as const },
  { label: 'Рецептура не рассчитана', value: 'not_calculated' as const },
]
