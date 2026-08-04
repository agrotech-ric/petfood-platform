export type FilterOption = { key: string; label: string }

export type FilterGroup = {
  key: string
  title: string
  options: FilterOption[]
  searchable?: boolean
}

export const STATIC_RECIPE_FILTER_GROUPS: FilterGroup[] = [
  {
    key: 'format',
    title: 'Формат',
    options: [
      { key: 'wet', label: 'Влажный' },
      { key: 'dry', label: 'Сухой' },
    ],
  },
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

export const RECIPE_FORMAT_LABELS = {
  wet: 'Влажный',
  dry: 'Сухой',
} as const

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
  { key: 'fat', label: 'Жиры' },
  { key: 'carbs', label: 'Углеводы' },
  { key: 'fiber', label: 'Клетчатка' },
  { key: 'ash', label: 'Зола' },
  { key: 'cholesterol', label: 'Холестерин' },
  { key: 'sugar', label: 'Сахар общее' },
  { key: 'choline', label: 'Холин' },
  { key: 'selenium', label: 'Селен' },
  { key: 'iodine', label: 'Йод' },
  { key: 'linoleic', label: 'Линолевая кислота' },
  { key: 'alphaLinolenic', label: 'Альфа-линоленовая кислота' },
  { key: 'arachidonic', label: 'Арахидоновая кислота' },
  { key: 'epa', label: 'Эйкозапентаеновая кислота (ЭПК)' },
  { key: 'dha', label: 'Докозагексаеновая кислота (ДГК)' },
  { key: 'vitaminA', label: 'Витамин А' },
  { key: 'vitaminE', label: 'Витамин E' },
  { key: 'vitaminD', label: 'Витамин Д' },
  { key: 'vitaminB1', label: 'Витамин B1' },
  { key: 'vitaminB2', label: 'Витамин B2' },
  { key: 'vitaminB3', label: 'Витамин B3' },
  { key: 'vitaminB5', label: 'Пантотеновая кислота' },
  { key: 'vitaminB6', label: 'Витамин B6' },
  { key: 'vitaminB9', label: 'Фолиевая кислота' },
  { key: 'vitaminB12', label: 'Витамин B12' },
  { key: 'vitaminC', label: 'Витамин C' },
  { key: 'vitaminK', label: 'Витамин K' },
  { key: 'calcium', label: 'Кальций' },
  { key: 'phosphorus', label: 'Фосфор' },
  { key: 'magnesium', label: 'Магний' },
  { key: 'sodium', label: 'Натрий' },
  { key: 'potassium', label: 'Калий' },
  { key: 'iron', label: 'Железо' },
  { key: 'copper', label: 'Медь' },
  { key: 'zinc', label: 'Цинк' },
  { key: 'manganese', label: 'Марганец' },
] as const
