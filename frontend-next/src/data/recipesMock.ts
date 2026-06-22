export type Recipe = {
  id: number
  name: string
  type: 'Домашний' | 'Коммерческий'
  format: 'Влажный' | 'Сухой'
  ageCategory: 'Щенки' | 'Взрослые' | 'Пожилые'
  lastModified: string
}

export const MOCK_RECIPES: Recipe[] = [
  { id: 1, name: 'Пауч Royal Canine для щенков с курицей', type: 'Коммерческий', format: 'Влажный', ageCategory: 'Щенки', lastModified: '24.01.2026' },
  { id: 2, name: 'Сухой корм Royal Canine для щенков с говядиной', type: 'Коммерческий', format: 'Сухой', ageCategory: 'Щенки', lastModified: '18.09.2026' },
  { id: 3, name: 'Рецепт "курица с рисом"', type: 'Домашний', format: 'Влажный', ageCategory: 'Щенки', lastModified: '01.03.2026' },
  { id: 4, name: 'Пауч Royal Canine для щенков с курицей', type: 'Коммерческий', format: 'Влажный', ageCategory: 'Щенки', lastModified: '24.01.2026' },
  { id: 5, name: 'Сухой корм Royal Canine для щенков с говядиной', type: 'Коммерческий', format: 'Сухой', ageCategory: 'Щенки', lastModified: '18.09.2026' },
  { id: 6, name: 'Рецепт "курица с рисом"', type: 'Домашний', format: 'Влажный', ageCategory: 'Взрослые', lastModified: '01.03.2026' },
  { id: 7, name: 'Сухой корм Royal Canine для щенков с говядиной', type: 'Домашний', format: 'Влажный', ageCategory: 'Взрослые', lastModified: '18.09.2026' },
  { id: 8, name: 'Рецепт "курица с рисом"', type: 'Домашний', format: 'Влажный', ageCategory: 'Взрослые', lastModified: '01.03.2026' },
  { id: 9, name: 'Сухой корм Royal Canine для щенков с говядиной', type: 'Домашний', format: 'Влажный', ageCategory: 'Взрослые', lastModified: '18.09.2026' },
]

export type FilterOption = { key: string; label: string }
export type FilterGroup = {
  key: string
  title: string
  options: FilterOption[]
  searchable?: boolean
}

export const RECIPE_FILTER_GROUPS: FilterGroup[] = [
  {
    key: 'type',
    title: 'Тип',
    options: [
      { key: 'domestic', label: 'Домашний' },
      { key: 'commercial', label: 'Коммерческий' },
    ],
  },
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
      { key: 'small', label: 'Мелкие' },
      { key: 'medium', label: 'Средние' },
      { key: 'large', label: 'Крупные' },
    ],
  },
  {
    key: 'reproductiveStatus',
    title: 'Репродуктивный статус',
    options: [
      { key: 'none', label: 'Нет' },
      { key: 'pregnancy', label: 'Щенность (беременность)' },
      { key: 'lactation', label: 'Период лактации' },
    ],
  },
  {
    key: 'activityLevel',
    title: 'Уровень активности',
    options: [
      { key: 'passive', label: 'Пассивный' },
      { key: 'medium', label: 'Средний' },
      { key: 'active', label: 'Активный' },
      { key: 'extreme', label: 'Высокая активность в экстремальных условиях' },
    ],
  },
  {
    key: 'healthCondition',
    title: 'Состояние здоровья',
    searchable: true,
    options: [
      { key: 'support', label: 'Поддержка здоровья' },
      { key: 'obesity', label: 'Ожирение' },
      { key: 'allergy', label: 'Аллергия' },
      { key: 'urolithiasis', label: 'Мочекаменная болезнь' },
      { key: 'diabetes', label: 'Сахарный диабет' },
    ],
  },
  {
    key: 'symptoms',
    title: 'Симптомы',
    searchable: true,
    options: [
      { key: 'none', label: 'Нет' },
      { key: 'itching', label: 'Зуд' },
      { key: 'cough', label: 'Кашель' },
      { key: 'appetiteLoss', label: 'Отствие аппетита' },
      { key: 'fever', label: 'Повышенная температура' },
    ],
  },
  {
    key: 'composition',
    title: 'Состав',
    searchable: true,
    options: [
      { key: 'chickenBreast', label: 'Курица, грудка' },
      { key: 'rice', label: 'Рис' },
      { key: 'carrot', label: 'Морковь' },
      { key: 'fishOil', label: 'Рыбий жир' },
      { key: 'chickenFat', label: 'Куриный жр' },
    ],
  },
]
