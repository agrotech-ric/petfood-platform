export type Ingredient = {
  id: number
  category: string
  name: string
  subtype: string | null
  protein: number
  fat: number
  moisture: number
  calcium: number
  phosphorus: number
  vitaminB1: number
  // Дополнительные нутриенты для профиля
  calories: number
  fiber: number
  ash: number
  cholesterol: number
  sugar: number
  // Минералы
  magnesium: number
  sodium: number
  potassium: number
  iron: number
  copper: number
  zinc: number
  manganese: number
  // Жирные кислоты
  linoleic: number
  alphaLinolenic: number
  arachidonic: number
  epa: number
  dha: number
  // Холин и микро
  choline: number
  selenium: number
  iodine: number
  // Витамины
  vitaminA: number
  vitaminE: number
  vitaminD: number
  vitaminB2: number
  vitaminB3: number
  vitaminB5: number
  vitaminB6: number
  vitaminB9: number
  vitaminB12: number
  vitaminC: number
  vitaminK: number
  // Производные витамина А
  alphaCarotene: number
  betaCarotene: number
  betaCryptoxanthin: number
  luteinZeaxanthin: number
  lycopene: number
  retinol: number
}

export const MOCK_INGREDIENTS: Ingredient[] = [
  {
    id: 1, category: 'Зелень', name: 'Укроп', subtype: null,
    protein: 2, fat: 1, moisture: 65, calcium: 0.01, phosphorus: 0.04, vitaminB1: 0.05,
    calories: 43, fiber: 2.1, ash: 1.2, cholesterol: 0, sugar: 0.7,
    magnesium: 55, sodium: 61, potassium: 738, iron: 2.77, copper: 0.11, zinc: 0.91, manganese: 0.44,
    linoleic: 0.1, alphaLinolenic: 0.29, arachidonic: 0, epa: 0, dha: 0,
    choline: 18.7, selenium: 1.6, iodine: 0,
    vitaminA: 154, vitaminE: 1.7, vitaminD: 0, vitaminB2: 0.09, vitaminB3: 1.07, vitaminB5: 0.37,
    vitaminB6: 0.16, vitaminB9: 0.15, vitaminB12: 0, vitaminC: 85, vitaminK: 55,
    alphaCarotene: 0, betaCarotene: 1.84, betaCryptoxanthin: 0, luteinZeaxanthin: 1.37, lycopene: 0, retinol: 0,
  },
  {
    id: 2, category: 'Зелень', name: 'Салат', subtype: 'Зеленый',
    protein: 4, fat: 2, moisture: 67, calcium: 0.05, phosphorus: 0.05, vitaminB1: 0.04,
    calories: 15, fiber: 1.3, ash: 0.8, cholesterol: 0, sugar: 0.8,
    magnesium: 13, sodium: 28, potassium: 194, iron: 0.86, copper: 0.05, zinc: 0.18, manganese: 0.25,
    linoleic: 0.1, alphaLinolenic: 0.1, arachidonic: 0, epa: 0, dha: 0,
    choline: 13.4, selenium: 0.6, iodine: 0,
    vitaminA: 166, vitaminE: 0.22, vitaminD: 0, vitaminB2: 0.08, vitaminB3: 0.38, vitaminB5: 0.13,
    vitaminB6: 0.09, vitaminB9: 0.04, vitaminB12: 0, vitaminC: 9.2, vitaminK: 102.3,
    alphaCarotene: 0, betaCarotene: 1.99, betaCryptoxanthin: 0, luteinZeaxanthin: 1.73, lycopene: 0, retinol: 0,
  },
  {
    id: 3, category: 'Зелень', name: 'Салат', subtype: 'Феолетовый',
    protein: 4, fat: 2, moisture: 75, calcium: 0.04, phosphorus: 0.6, vitaminB1: 0.05,
    calories: 14, fiber: 1.5, ash: 0.9, cholesterol: 0, sugar: 0.5,
    magnesium: 12, sodium: 25, potassium: 187, iron: 0.8, copper: 0.04, zinc: 0.17, manganese: 0.22,
    linoleic: 0.08, alphaLinolenic: 0.08, arachidonic: 0, epa: 0, dha: 0,
    choline: 12.0, selenium: 0.5, iodine: 0,
    vitaminA: 150, vitaminE: 0.2, vitaminD: 0, vitaminB2: 0.07, vitaminB3: 0.35, vitaminB5: 0.12,
    vitaminB6: 0.08, vitaminB9: 0.04, vitaminB12: 0, vitaminC: 8.5, vitaminK: 99.0,
    alphaCarotene: 0, betaCarotene: 1.8, betaCryptoxanthin: 0, luteinZeaxanthin: 1.6, lycopene: 0, retinol: 0,
  },
  {
    id: 4, category: 'Зелень', name: 'Кинза', subtype: null,
    protein: 2, fat: 1, moisture: 67, calcium: 0.05, phosphorus: 0.06, vitaminB1: 0.6,
    calories: 23, fiber: 2.8, ash: 1.5, cholesterol: 0, sugar: 0.87,
    magnesium: 26, sodium: 46, potassium: 521, iron: 1.77, copper: 0.22, zinc: 0.5, manganese: 0.43,
    linoleic: 0.1, alphaLinolenic: 0.1, arachidonic: 0, epa: 0, dha: 0,
    choline: 12.8, selenium: 0.9, iodine: 0,
    vitaminA: 337, vitaminE: 2.5, vitaminD: 0, vitaminB2: 0.16, vitaminB3: 1.11, vitaminB5: 0.57,
    vitaminB6: 0.15, vitaminB9: 0.06, vitaminB12: 0, vitaminC: 27, vitaminK: 310,
    alphaCarotene: 0, betaCarotene: 3.93, betaCryptoxanthin: 0, luteinZeaxanthin: 0.86, lycopene: 0, retinol: 0,
  },
  {
    id: 5, category: 'Мясо', name: 'Курица', subtype: 'Грудка',
    protein: 24, fat: 8, moisture: 75, calcium: 0.6, phosphorus: 0.01, vitaminB1: 0.04,
    calories: 240, fiber: 0, ash: 1.1, cholesterol: 1, sugar: 0,
    magnesium: 28.31, sodium: 53.06, potassium: 243.2, iron: 0.73, copper: 0.05, zinc: 1.03, manganese: 0.09,
    linoleic: 0.5, alphaLinolenic: 0.04, arachidonic: 0.07, epa: 0.21, dha: 0.35,
    choline: 44.77, selenium: 8.89, iodine: 1.45,
    vitaminA: 912.09, vitaminE: 0.14, vitaminD: 7.55, vitaminB2: 0.1, vitaminB3: 5.15, vitaminB5: 0.86,
    vitaminB6: 0.26, vitaminB9: 0, vitaminB12: 0.2, vitaminC: 3.99, vitaminK: 1.11,
    alphaCarotene: 0.5, betaCarotene: 0.04, betaCryptoxanthin: 0.07, luteinZeaxanthin: 0.21, lycopene: 0.35, retinol: 0.7,
  },
  {
    id: 6, category: 'Мясо', name: 'Курица', subtype: 'Сердце',
    protein: 16, fat: 8, moisture: 67, calcium: 0.04, phosphorus: 0.05, vitaminB1: 0.04,
    calories: 185, fiber: 0, ash: 1.0, cholesterol: 1, sugar: 0,
    magnesium: 21, sodium: 60, potassium: 195, iron: 4.31, copper: 0.39, zinc: 1.73, manganese: 0.06,
    linoleic: 1.5, alphaLinolenic: 0.1, arachidonic: 0.3, epa: 0.1, dha: 0.2,
    choline: 80, selenium: 21, iodine: 0,
    vitaminA: 15, vitaminE: 0.3, vitaminD: 1, vitaminB2: 1.1, vitaminB3: 3.8, vitaminB5: 1.8,
    vitaminB6: 0.2, vitaminB9: 0.01, vitaminB12: 7.3, vitaminC: 3, vitaminK: 0,
    alphaCarotene: 0, betaCarotene: 0, betaCryptoxanthin: 0, luteinZeaxanthin: 0, lycopene: 0, retinol: 0.01,
  },
  {
    id: 7, category: 'Мясо', name: 'Курица', subtype: 'Печень',
    protein: 21, fat: 9, moisture: 87, calcium: 0.05, phosphorus: 0.04, vitaminB1: 0.05,
    calories: 172, fiber: 0, ash: 1.3, cholesterol: 1, sugar: 0,
    magnesium: 19, sodium: 71, potassium: 230, iron: 8.99, copper: 0.44, zinc: 2.67, manganese: 0.38,
    linoleic: 1.1, alphaLinolenic: 0.08, arachidonic: 0.5, epa: 0.05, dha: 0.18,
    choline: 290, selenium: 54, iodine: 0,
    vitaminA: 11078, vitaminE: 0.55, vitaminD: 0.5, vitaminB2: 2.3, vitaminB3: 9.73, vitaminB5: 6.24,
    vitaminB6: 0.85, vitaminB9: 0.59, vitaminB12: 16.6, vitaminC: 27.9, vitaminK: 0,
    alphaCarotene: 0, betaCarotene: 0, betaCryptoxanthin: 0, luteinZeaxanthin: 0, lycopene: 0, retinol: 11.08,
  },
  {
    id: 8, category: 'Мясо', name: 'Баранина', subtype: 'Грудка',
    protein: 23, fat: 4, moisture: 76, calcium: 0.6, phosphorus: 0.05, vitaminB1: 0.6,
    calories: 294, fiber: 0, ash: 1.2, cholesterol: 1, sugar: 0,
    magnesium: 23, sodium: 72, potassium: 310, iron: 2.08, copper: 0.13, zinc: 4.46, manganese: 0.03,
    linoleic: 0.4, alphaLinolenic: 0.3, arachidonic: 0.15, epa: 0.1, dha: 0.1,
    choline: 94, selenium: 26, iodine: 0,
    vitaminA: 0, vitaminE: 0.24, vitaminD: 0, vitaminB2: 0.27, vitaminB3: 7.47, vitaminB5: 0.68,
    vitaminB6: 0.14, vitaminB9: 0.02, vitaminB12: 2.37, vitaminC: 0, vitaminK: 1.8,
    alphaCarotene: 0, betaCarotene: 0, betaCryptoxanthin: 0, luteinZeaxanthin: 0, lycopene: 0, retinol: 0,
  },
  {
    id: 9, category: 'Крупа', name: 'Перловка', subtype: null,
    protein: 8, fat: 5, moisture: 43, calcium: 0.06, phosphorus: 0.05, vitaminB1: 0.06,
    calories: 352, fiber: 15.6, ash: 1.2, cholesterol: 0, sugar: 0.44,
    magnesium: 79, sodium: 9, potassium: 280, iron: 2.5, copper: 0.42, zinc: 2.13, manganese: 1.32,
    linoleic: 0.5, alphaLinolenic: 0.05, arachidonic: 0, epa: 0, dha: 0,
    choline: 37.8, selenium: 37.7, iodine: 0,
    vitaminA: 0, vitaminE: 0.02, vitaminD: 0, vitaminB2: 0.11, vitaminB3: 4.6, vitaminB5: 0.28,
    vitaminB6: 0.26, vitaminB9: 0.02, vitaminB12: 0, vitaminC: 0, vitaminK: 2.2,
    alphaCarotene: 0, betaCarotene: 0.01, betaCryptoxanthin: 0, luteinZeaxanthin: 0.16, lycopene: 0, retinol: 0,
  },
]

export const CATEGORIES = ['Зелень', 'Мясо', 'Крупа', 'Рыба', 'Овощи', 'Фрукты']

export const FILTER_GROUPS = {
  'Макронутриенты': [
    { key: 'protein', label: 'Белки'},
    { key: 'fat', label: 'Жиры'},
    { key: 'moisture', label: 'Влага'},
    { key: 'fiber', label: 'Клетчатка'},
    { key: 'ash', label: 'Зола'},
    { key: 'cholesterol', label: 'Холестерол'},
  ],
  'Микронутриенты': [
    { key: 'choline', label: 'Холин'},
    { key: 'selenium', label: 'Селен'},
    { key: 'iodine', label: 'Йод'},
  ],
  'Витамины': [
    { key: 'vitaminA', label: 'Витамин А'},
    { key: 'vitaminE', label: 'Витамин Е'},
    { key: 'vitaminD', label: 'Витамин Д'},
    { key: 'vitaminB1', label: 'Витамин В1'},
    { key: 'vitaminB2', label: 'Витамин В2'},
    { key: 'vitaminC', label: 'Витамин С'},
  ],
  'Жирные кислоты': [
    { key: 'linoleic', label: 'Линолевая'},
    { key: 'alphaLinolenic', label: 'Альфа-линоленовая'},
    { key: 'epa', label: 'ЭПК'},
    { key: 'dha', label: 'ДГК'},
  ],
  'Соединения витамина А': [
    { key: 'alphaCarotene', label: 'Альфа-каротин'},
    { key: 'betaCarotene', label: 'Бета-каротин'},
    { key: 'retinol', label: 'Ретино'},
  ],
} as const
