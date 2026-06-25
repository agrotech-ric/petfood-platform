export type PetProfile = {
  id: string
  name: string
  age: string
  breed: string
  gender: string
  birthDate: string
  weight: number
  activityLevel: string
  reproductiveStatus: string
  description: string
  photoUrl?: string
}

export type PetFood = {
  id: number
  name: string
  type: string
  format: string
  calories: number
  lastModified: string
}

export type PetCurrentCondition = {
  date: string
  disease: string
  description: string
  symptoms: string[]
}

export type PetDiseaseHistory = {
  id: number
  date: string
  disease: string
  symptoms: string
  description: string
}

export type PetContraindications = {
  ingredients: string[]
  description: string
}

export type WeightEntry = {
  id: number
  date: string
  weight: number
}

export type ActivityEntry = {
  id: number
  date: string
  hours: number
}

export const MOCK_PET: PetProfile = {
  id: '112034567890',
  name: 'Фред',
  age: '1 год',
  breed: 'Золотой ретривер',
  gender: 'Самец',
  birthDate: '1 января 2025',
  weight: 15,
  activityLevel: 'пасивный',
  reproductiveStatus: 'нет',
  description: 'любит играть на солнце, живет в квартире, выгуливаем на улице 1 раз в день по 2 часа',
  photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg/400px-Golden_Retriever_Dukedestiny01_drvd.jpg',
}

export const MOCK_PET_FOODS: PetFood[] = [
  { id: 1, name: 'Пауч Royal Canine для щенков с курицей', type: 'коммерческий', format: 'влажный', calories: 240, lastModified: '24.01.2026' },
  { id: 2, name: 'Сухой корм Royal Canine для щенков с говядиной', type: 'коммерческий', format: 'сухой', calories: 345, lastModified: '18.09.2026' },
  { id: 3, name: 'Рецепт "курица с рисом"', type: 'домашний', format: 'влажный', calories: 356, lastModified: '01.03.2026' },
]

export const MOCK_CURRENT_CONDITION: PetCurrentCondition = {
  date: '24.01.2026',
  disease: 'Аллергия',
  description: 'Вялый, много спит, мало ест, иногда кашляет и тяжело дышит',
  symptoms: ['Кашель', 'Вялость', 'Отсутствие аппетита', 'Затрудненное дыхание'],
}

export const MOCK_DISEASE_HISTORY: PetDiseaseHistory[] = [
  { id: 1, date: '11.03.2025', disease: 'несварение', symptoms: 'жидкий стул', description: 'собака съела случайно виноград и ей стало плохо' },
  { id: 2, date: '23.07.2025', disease: 'аллергия', symptoms: 'чесотка', description: 'после курицы начала сильно чесаться' },
  { id: 3, date: '09.12.2025', disease: 'укусил клещ', symptoms: 'чесотка, вялость', description: 'сильных изменений в целом не наблюдается' },
]

export const MOCK_CONTRAINDICATIONS: PetContraindications = {
  ingredients: ['Курица', 'Кукуруза', 'Рис'],
  description: 'Тяжело переносит жирную пищу, также есть аллергия на курицу, плохо переваривает кукурузу, после риса запор',
}

export const MOCK_WEIGHT_HISTORY: WeightEntry[] = [
  { id: 1, date: '11.03.2025', weight: 25 },
  { id: 2, date: '23.07.2025', weight: 23.4 },
  { id: 3, date: '09.12.2025', weight: 27 },
  { id: 4, date: '05.01.2026', weight: 28.6 },
  { id: 5, date: '04.04.2026', weight: 24.5 },
]

export const MOCK_ACTIVITY_HISTORY: ActivityEntry[] = [
  { id: 1, date: '11.03.2025', hours: 1 },
  { id: 2, date: '23.07.2025', hours: 3 },
  { id: 3, date: '09.12.2025', hours: 2 },
  { id: 4, date: '05.01.2026', hours: 3 },
  { id: 5, date: '04.04.2026', hours: 4 },
]
