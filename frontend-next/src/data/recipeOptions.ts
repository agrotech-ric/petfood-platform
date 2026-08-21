export type FilterOption = { key: string; label: string }

export type FilterGroup = {
  key: string
  title: string
  options: FilterOption[]
  searchable?: boolean
}

export const STATIC_RECIPE_FILTER_GROUPS: FilterGroup[] = [
  {
    key: 'ageCategory',
    title: 'Возрастная категория',
    options: [
      { key: 'puppies', label: 'Для щенков' },
      { key: 'adults', label: 'Для взрослых' },
      { key: 'senior', label: 'Для пожилых' },
    ],
  },
  {
    key: 'breedSize',
    title: 'Размер породы',
    options: [
      { key: 'all', label: 'Для всех' },
      { key: 'small', label: 'Мелкие' },
      { key: 'medium', label: 'Средние' },
      { key: 'large', label: 'Крупные' },
    ],
  },
]

export const RECIPE_AGE_LABELS = {
  puppies: 'Щенки',
  adults: 'Взрослые',
  senior: 'Пожилые',
} as const

export const RECIPE_BREED_SIZE_LABELS = {
  all: 'Для всех',
  small: 'Мелкие',
  medium: 'Средние',
  large: 'Крупные',
} as const

export const RECIPE_NUTRIENT_LIMITS = [
  { key: 'moisture', label: 'Влага', min: 0, max: 100, defaultMin: 5, defaultMax: 40 },
  { key: 'protein', label: 'Белки', min: 0, max: 100, defaultMin: 2.35, defaultMax: 12.35 },
  { key: 'carbs', label: 'Углеводы', min: 0, max: 100, defaultMin: 21.33, defaultMax: 31.33 },
  { key: 'fat', label: 'Жиры', min: 0, max: 100, defaultMin: 0.93, defaultMax: 10.93 },
] as const

export const RECIPE_MAXIMIZE_OPTIONS = [
  { key: 'moisture', label: 'Влага' },
  { key: 'protein', label: 'Белки' },
  { key: 'carbs', label: 'Углеводы' },
  { key: 'fat', label: 'Жиры' },
] as const
