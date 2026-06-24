export type RecipeProfile = {
  id: number
  name: string
  type: string
  format: string
  ageCategory: string
  breedSize: string
  description: string
  pet: {
    name: string
    id: string
    weight: number
    age: string
    gender: string
    breed: string
    activityLevel: string
    reproductiveStatus: string
    healthCondition: string
    symptoms: string[]
  }
  calories: number
  dailyNorm: number
  dailyCaloriesNorm: number
  composition: {
    label: string
    percent: number
    grams: number
    color: string
  }[]
  nutrition: {
    label: string
    value: number
    unit: string
    color: string
  }[]
  nutritionPer100: {
    calories: number
    moisture: number
    protein: number
    fat: number
    carbs: number
  }
  nutrients: {
    label: string
    value: number
    unit: string
  }[]
  minerals: {
    label: string
    current: number
    norm: number
    unit: string
    percent: number
  }[]
  vitamins: {
    label: string
    percent: number
  }[]
  digestion: {
    protein: { time: number; remaining: number }[]
    fat: { time: number; remaining: number }[]
    carbs: { time: number; remaining: number }[]
    proteinAbsorption: number
    fatAbsorption: number
    carbsAbsorption: number
    proteinForecast: { hour: number; percent: number; grams: number }[]
    fatForecast: { hour: number; percent: number; grams: number }[]
    carbsForecast: { hour: number; percent: number; grams: number }[]
  }
}

export const MOCK_RECIPE_PROFILE: RecipeProfile = {
  id: 3,
  name: 'Рецепт "курица с рисом"',
  type: 'домашний',
  format: 'Влажный',
  ageCategory: 'Для щенков',
  breedSize: 'Для всех',
  description: 'Корм с отварным рисом и курицей на пару, с добавлением рыбьего жира. Рецепт разработан для применения пищи во время аллергии или для аллергиков',
  pet: {
    name: 'Фред',
    id: '112034567890',
    weight: 12,
    age: '1 год',
    gender: 'Самец',
    breed: 'Золотой ретривер',
    activityLevel: 'пасивный',
    reproductiveStatus: 'Нет',
    healthCondition: 'Аллергия',
    symptoms: ['Кашель', 'Вялость', 'Отсутствие аппетита', 'Затрудненное дыхание'],
  },
  calories: 240,
  dailyNorm: 300,
  dailyCaloriesNorm: 1255,
  composition: [
    { label: 'Рыбий Жир — Печень Трески', percent: 15, grams: 7.42, color: '#4a90d9' },
    { label: 'Кукуруза — Обжаренный', percent: 85, grams: 62.04, color: '#5cb85c' },
  ],
  nutrition: [
    { label: 'Влага', value: 64.57, unit: 'г', color: '#f47f4b' },
    { label: 'Золы', value: 3.34, unit: 'г', color: '#4a90d9' },
    { label: 'Углеводы', value: 16.81, unit: 'г', color: '#e8c84a' },
    { label: 'Жиры', value: 16.69, unit: 'г', color: '#5cb85c' },
  ],
  nutritionPer100: {
    calories: 282.16,
    moisture: 64.57,
    protein: 3.34,
    fat: 16.69,
    carbs: 16.81,
  },
  nutrients: [
    { label: 'Зола', value: 4.3, unit: 'г' },
    { label: 'Клетчатка', value: 6.86, unit: 'г' },
    { label: 'Холестерин', value: 180.9, unit: 'мг' },
    { label: 'Сахар общее', value: 10.66, unit: 'г' },
    { label: 'Холин', value: 210.48, unit: 'мг' },
    { label: 'Селен', value: 41.66, unit: 'мкг' },
    { label: 'Йод', value: 5.69, unit: 'мкг' },
    { label: 'Линолевая кислота', value: 4.24, unit: 'г' },
    { label: 'Альфа-линоленовая кислота', value: 0.18, unit: 'г' },
    { label: 'Арахидоновая кислота', value: 0.2, unit: 'г' },
    { label: 'Эйкозапентаеновая кислота (ЭПК)', value: 0.02, unit: 'г' },
    { label: 'Докозагексаеновая кислота (ДГК)', value: 0.07, unit: 'г' },
  ],
  minerals: [
    { label: 'Кальций', current: 8.54, norm: 111.34, unit: 'мг', percent: 103 },
    { label: 'Фосфор', current: 60, norm: 90, unit: 'мг', percent: 103 },
    { label: 'Магний', current: 75, norm: 55, unit: 'мг', percent: 135 },
    { label: 'Натрий', current: 80, norm: 70, unit: 'мг', percent: 115 },
    { label: 'Калий', current: 200, norm: 196, unit: 'мг', percent: 102 },
    { label: 'Железо', current: 6, norm: 8, unit: 'мг', percent: 75 },
    { label: 'Медь', current: 0.3, norm: 0.75, unit: 'мг', percent: 40 },
    { label: 'Цинк', current: 8, norm: 15, unit: 'мг', percent: 53 },
    { label: 'Марганец', current: 0.7, norm: 0.9, unit: 'мг', percent: 78 },
  ],
  vitamins: [
    { label: 'Витамин А', percent: 20 },
    { label: 'Витамин Е', percent: 112 },
    { label: 'Витамин Д', percent: 125 },
    { label: 'Витамин В1 (тиамин)', percent: 105 },
    { label: 'Витамин В2 (рибофлавин)', percent: 165 },
    { label: 'Витамин В3 (ниацин)', percent: 70 },
    { label: 'Пантотеновая кислота', percent: 30 },
    { label: 'Витамин В6', percent: 48 },
    { label: 'Фолиевая кислота', percent: 75 },
    { label: 'Витамин В12', percent: 20 },
    { label: 'Витамин С', percent: 119 },
    { label: 'Витамин К', percent: 149 },
  ],
  digestion: {
    protein: [
      { time: 0, remaining: 1.35 },
      { time: 1, remaining: 0.93 },
      { time: 2, remaining: 0.53 },
      { time: 3, remaining: 0.22 },
      { time: 4, remaining: 0.04 },
    ],
    fat: [
      { time: 0, remaining: 1.35 },
      { time: 1, remaining: 1.1 },
      { time: 2, remaining: 0.8 },
      { time: 3, remaining: 0.4 },
      { time: 4, remaining: 0.1 },
    ],
    carbs: [
      { time: 0, remaining: 1.35 },
      { time: 1, remaining: 0.7 },
      { time: 2, remaining: 0.3 },
      { time: 3, remaining: 0.1 },
      { time: 4, remaining: 0.02 },
    ],
    proteinAbsorption: 80.4,
    fatAbsorption: 70.2,
    carbsAbsorption: 90.1,
    proteinForecast: [
      { hour: 0, percent: 0, grams: 1.35 },
      { hour: 1, percent: 31.5, grams: 0.93 },
      { hour: 2, percent: 60.4, grams: 0.53 },
      { hour: 3, percent: 84.0, grams: 0.22 },
      { hour: 4, percent: 96.0, grams: 0.04 },
    ],
    fatForecast: [
      { hour: 0, percent: 0, grams: 1.35 },
      { hour: 1, percent: 18.5, grams: 1.1 },
      { hour: 2, percent: 40.7, grams: 0.8 },
      { hour: 3, percent: 70.4, grams: 0.4 },
      { hour: 4, percent: 92.6, grams: 0.1 },
    ],
    carbsForecast: [
      { hour: 0, percent: 0, grams: 1.35 },
      { hour: 1, percent: 48.1, grams: 0.7 },
      { hour: 2, percent: 77.8, grams: 0.3 },
      { hour: 3, percent: 92.6, grams: 0.1 },
      { hour: 4, percent: 98.5, grams: 0.02 },
    ],
  },
}
