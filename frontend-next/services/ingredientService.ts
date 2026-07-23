import { apiClient } from '../src/utils/apiClient'

export type Ingredient = {
  id: number
  category: string
  name: string
  subtype: string | null
  portion: number
  calories: number
  protein: number
  fat: number
  carbs: number
  moisture: number
  fiber: number
  ash: number
  cholesterol: number
  sugar: number
  calcium: number
  phosphorus: number
  magnesium: number
  sodium: number
  potassium: number
  iron: number
  copper: number
  zinc: number
  manganese: number
  linoleic: number
  alphaLinolenic: number
  arachidonic: number
  epa: number
  dha: number
  choline: number
  selenium: number
  iodine: number
  vitaminA: number
  vitaminE: number
  vitaminD: number
  vitaminB1: number
  vitaminB2: number
  vitaminB3: number
  vitaminB5: number
  vitaminB6: number
  vitaminB9: number
  vitaminB12: number
  vitaminC: number
  vitaminK: number
  alphaCarotene: number
  betaCarotene: number
  betaCryptoxanthin: number
  luteinZeaxanthin: number
  lycopene: number
  retinol: number
  createdAt?: string
  updatedAt?: string
}

export type IngredientPayload = Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>

export const EMPTY_INGREDIENT: IngredientPayload = {
  name: '', subtype: null, category: '', portion: 100,
  calories: 0, protein: 0, fat: 0, carbs: 0, moisture: 0, fiber: 0, ash: 0,
  cholesterol: 0, sugar: 0, calcium: 0, phosphorus: 0, magnesium: 0, sodium: 0,
  potassium: 0, iron: 0, copper: 0, zinc: 0, manganese: 0, linoleic: 0,
  alphaLinolenic: 0, arachidonic: 0, epa: 0, dha: 0, choline: 0, selenium: 0,
  iodine: 0, vitaminA: 0, vitaminE: 0, vitaminD: 0, vitaminB1: 0, vitaminB2: 0,
  vitaminB3: 0, vitaminB5: 0, vitaminB6: 0, vitaminB9: 0, vitaminB12: 0,
  vitaminC: 0, vitaminK: 0, alphaCarotene: 0, betaCarotene: 0,
  betaCryptoxanthin: 0, luteinZeaxanthin: 0, lycopene: 0, retinol: 0,
}

export function toIngredientPayload(values: Partial<Ingredient>): IngredientPayload {
  const payloadValues = { ...values }
  delete payloadValues.id
  delete payloadValues.createdAt
  delete payloadValues.updatedAt
  const merged = { ...EMPTY_INGREDIENT, ...payloadValues }
  return {
    ...merged,
    name: merged.name.trim(),
    category: merged.category.trim(),
    subtype: merged.subtype?.trim() || null,
  }
}

type ListParams = {
  search?: string
  nutrients?: string[]
  sort?: keyof Ingredient
  direction?: 'asc' | 'desc'
}

export const ingredientService = {
  list: ({ search, nutrients, sort, direction }: ListParams = {}) => {
    const params = new URLSearchParams()
    if (search?.trim()) params.set('q', search.trim())
    nutrients?.forEach(nutrient => params.append('nutrients', nutrient))
    if (sort) params.set('sort', String(sort))
    if (direction) params.set('direction', direction)
    const query = params.toString()
    return apiClient.get<Ingredient[]>(`/api/v1/ingredients${query ? `?${query}` : ''}`)
  },

  get: (id: number) => apiClient.get<Ingredient>(`/api/v1/ingredients/${id}`),

  create: (data: IngredientPayload) =>
    apiClient.post<Ingredient>('/api/v1/ingredients', data),

  update: (id: number, data: IngredientPayload) =>
    apiClient.patch<Ingredient>(`/api/v1/ingredients/${id}`, data),

  delete: (id: number) => apiClient.delete(`/api/v1/ingredients/${id}`),
}
