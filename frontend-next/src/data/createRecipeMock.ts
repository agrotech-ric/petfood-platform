export const INGREDIENT_CATEGORIES = [
  {
    key: 'water',
    label: 'Вода, соль и сахар',
    items: ['Вода — Обыкновенный', 'Соль — Обычная', 'Сахар — Белый'],
  },
  {
    key: 'herbs',
    label: 'Зелень и специи',
    items: ['Укроп', 'Петрушка', 'Кинза', 'Базилик'],
  },
  {
    key: 'grains',
    label: 'Крупы',
    items: ['Рис — Белый', 'Гречка', 'Перловка', 'Овсянка'],
  },
  {
    key: 'oils',
    label: 'Масло и жир',
    items: ['Животный Жир — Говяжий', 'Рыбий Жир — Печень Трески', 'Подсолнечное масло'],
  },
  {
    key: 'meat',
    label: 'Мясо',
    items: ['Курица — Мясо', 'Курица — Грудка', 'Говядина — Фарш', 'Баранина'],
  },
  {
    key: 'vegetables',
    label: 'Овощи и фрукты',
    items: ['Горох — Зелёный Горошек', 'Морковь', 'Кукуруза — Обыкновенный', 'Яблоко'],
  },
  {
    key: 'dairy',
    label: 'Яйца и молочные продукты',
    items: ['Яйцо — Куриное', 'Творог — Обезжиренный', 'Молоко'],
  },
]

export const DOG_BREEDS = [
  'Золотистый ретривер', 'Лабрадор', 'Немецкая овчарка',
  'Пудель', 'Чихуахуа', 'Мопс', 'Хаски', 'Другая',
]

export const AGE_OPTIONS = [
  '3 месяца', '6 месяцев', '1 год', '2 года', '3 года', '5 лет', '7 лет', '10 лет',
]

export const ACTIVITY_OPTIONS = ['Пасивный', 'Умеренный', 'Активный', 'Очень активный']

export const REPRODUCTIVE_OPTIONS = ['Нет', 'Беременность', 'Лактация', 'Кастрирован/а']

export const GENDER_OPTIONS = ['Самец', 'Самка']

export const AGE_CATEGORY_OPTIONS = ['Для щенков', 'Для взрослых', 'Для пожилых']

export const BREED_SIZE_OPTIONS = ['Для всех', 'Мелкие', 'Средние', 'Крупные']

export const HEALTH_CONDITIONS = [
  'Здоров', 'Аллергия', 'Ожирение', 'Мочекаменная болезнь',
  'Сахарный диабет', 'Поддержка здоровья',
]

export const SYMPTOMS_OPTIONS = [
  'Нет', 'Кашель', 'Вялость', 'Отсутствие аппетита',
  'Затрудненное дыхание', 'Зуд', 'Рвота', 'Диарея',
]

export const NUTRIENT_LIMITS = [
  { key: 'moisture', label: 'Влага', min: 5, max: 40, defaultMin: 5, defaultMax: 40 },
  { key: 'protein', label: 'Белки', min: 2.35, max: 12.35, defaultMin: 2.35, defaultMax: 12.35 },
  { key: 'carbs', label: 'Углеводы', min: 21.33, max: 31.33, defaultMin: 21.33, defaultMax: 31.33 },
  { key: 'fat', label: 'Жиры', min: 0.93, max: 10.93, defaultMin: 0.93, defaultMax: 10.93 },
]

export const MAXIMIZE_OPTIONS = [
  'Белки', 'Жиры', 'Углеводы', 'Витамин А', 'Витамин С', 'Кальций', 'Фосфор',
]

// Мок результата (этап 3) — переиспользуем из профиля корма
export const MOCK_RECIPE_RESULT = {
  calories: 240,
  dailyNorm: 300,
  dailyCaloriesNorm: 1255,
  composition: [
    { label: 'Рыбий Жир — Печень Трески', percent: 15, grams: 7.42, color: '#4a90d9' },
    { label: 'Кукуруза — Обыкновенный', percent: 85, grams: 42.04, color: '#5cb85c' },
  ],
  nutrition: [
    { label: 'Влага', value: 64.57, unit: 'г', color: '#f47f4b' },
    { label: 'Золы', value: 2.74, unit: 'г', color: '#4a90d9' },
    { label: 'Углеводы', value: 16.81, unit: 'г', color: '#e8c84a' },
    { label: 'Жиры', value: 16.69, unit: 'г', color: '#5cb85c' },
  ],
  nutritionCalories: 302.19,
  nutrients: [
    { label: 'Зола', value: 4.3, unit: 'г' },
    { label: 'Клетчатка', value: 6.88, unit: 'г' },
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
}
