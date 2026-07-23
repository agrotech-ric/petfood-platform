import { apiClient } from '../src/utils/apiClient'

export type RecipeType = 'domestic' | 'commercial'
export type RecipeFormat = 'wet' | 'dry'
export type RecipeAgeCategory = 'puppies' | 'adults' | 'senior'
export type RecipeBreedSize = 'all' | 'small' | 'medium' | 'large'
export type RecipeStatus = 'draft' | 'calculated'
export type RecipeGender = 'male' | 'female'

export type RecipeIngredientInput = {
  ingredientId: number
  minPercent: number
  maxPercent: number
  resultPercent?: number | null
  resultGrams?: number | null
}

export type RecipeNutrientConstraint = {
  nutrientKey: string
  minValue: number
  maxValue: number
}

export type RecipeCalculationResult = {
  calories?: number
  dailyNorm?: number
  dailyCaloriesNorm?: number
  composition?: Array<{
    ingredientId?: number
    label: string
    percent: number
    grams: number
    color?: string
  }>
  nutrition?: Array<{
    key?: string
    label: string
    value: number
    unit: string
    color?: string
  }>
  nutritionPer100?: {
    calories: number
    moisture: number
    protein: number
    fat: number
    carbs: number
  }
  nutrients?: Array<{ key?: string; label: string; value: number; unit: string }>
  minerals?: Array<{
    key?: string
    label: string
    current: number
    norm: number
    unit: string
    percent: number
  }>
  vitamins?: Array<{ key?: string; label: string; percent: number }>
  digestion?: {
    protein: Array<{ time: number; remaining: number }>
    fat: Array<{ time: number; remaining: number }>
    carbs: Array<{ time: number; remaining: number }>
    proteinAbsorption: number
    fatAbsorption: number
    carbsAbsorption: number
    proteinForecast: Array<{ hour: number; percent: number; grams: number }>
    fatForecast: Array<{ hour: number; percent: number; grams: number }>
    carbsForecast: Array<{ hour: number; percent: number; grams: number }>
  }
  [key: string]: unknown
}

export type RecipePayload = {
  petId?: string | null
  name: string
  description?: string | null
  type: RecipeType
  format: RecipeFormat
  ageCategory: RecipeAgeCategory
  breedSize: RecipeBreedSize
  targetWeightKg?: number | null
  targetBreedId?: number | null
  targetAgeMonths?: number | null
  targetGender?: RecipeGender | null
  targetActivityTypeId?: number | null
  targetReproductiveStatusId?: number | null
  targetHealthConditionId?: number | null
  symptomIds?: number[]
  targetEnergyKcal?: number | null
  maximizeNutrient?: string | null
  ingredients?: RecipeIngredientInput[]
  nutrientConstraints?: RecipeNutrientConstraint[]
  calculationResult?: RecipeCalculationResult | null
  calculationVersion?: string | null
}

export type RecipeListItem = {
  id: number
  petId?: string | null
  petName?: string | null
  name: string
  type: RecipeType
  format: RecipeFormat
  ageCategory: RecipeAgeCategory
  breedSize: RecipeBreedSize
  status: RecipeStatus
  calories?: number | null
  createdAt: string
  updatedAt: string
}

export type Recipe = RecipeListItem & {
  ownerId: string
  description?: string | null
  targetWeightKg?: number | null
  targetBreedId?: number | null
  targetBreedName?: string | null
  targetAgeMonths?: number | null
  targetGender?: RecipeGender | null
  targetActivityTypeId?: number | null
  targetActivityTypeName?: string | null
  targetReproductiveStatusId?: number | null
  targetReproductiveStatusName?: string | null
  targetHealthConditionId?: number | null
  targetHealthConditionName?: string | null
  symptoms: Array<{ id: number; name: string }>
  targetEnergyKcal?: number | null
  maximizeNutrient?: string | null
  ingredients: Array<RecipeIngredientInput & {
    name: string
    subtype?: string | null
    category: string
  }>
  nutrientConstraints: RecipeNutrientConstraint[]
  calculationResult?: RecipeCalculationResult | null
  calculationVersion?: string | null
  calculatedAt?: string | null
}

export type RecipeListParams = {
  petId?: string
  search?: string
  types?: RecipeType[]
  formats?: RecipeFormat[]
  ageCategories?: RecipeAgeCategory[]
  breedSizes?: RecipeBreedSize[]
  reproductiveStatusIds?: number[]
  activityTypeIds?: number[]
  healthConditionIds?: number[]
  symptomIds?: number[]
  ingredientIds?: number[]
  status?: RecipeStatus
  sort?: 'name' | 'type' | 'format' | 'ageCategory' | 'breedSize' | 'status' | 'createdAt' | 'updatedAt'
  direction?: 'asc' | 'desc'
}

function appendMany(params: URLSearchParams, key: string, values?: Array<string | number>) {
  values?.forEach(value => params.append(key, String(value)))
}

export const recipeService = {
  list: (filters: RecipeListParams = {}) => {
    const params = new URLSearchParams()
    if (filters.petId) params.set('petId', filters.petId)
    if (filters.search?.trim()) params.set('q', filters.search.trim())
    appendMany(params, 'types', filters.types)
    appendMany(params, 'formats', filters.formats)
    appendMany(params, 'ageCategories', filters.ageCategories)
    appendMany(params, 'breedSizes', filters.breedSizes)
    appendMany(params, 'reproductiveStatusIds', filters.reproductiveStatusIds)
    appendMany(params, 'activityTypeIds', filters.activityTypeIds)
    appendMany(params, 'healthConditionIds', filters.healthConditionIds)
    appendMany(params, 'symptomIds', filters.symptomIds)
    appendMany(params, 'ingredientIds', filters.ingredientIds)
    if (filters.status) params.set('status', filters.status)
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.direction) params.set('direction', filters.direction)
    const query = params.toString()
    return apiClient.get<RecipeListItem[]>(`/api/v1/recipes${query ? `?${query}` : ''}`)
  },

  get: (id: number) => apiClient.get<Recipe>(`/api/v1/recipes/${id}`),

  create: (payload: RecipePayload) =>
    apiClient.post<Recipe>('/api/v1/recipes', payload),

  update: (id: number, payload: RecipePayload) =>
    apiClient.patch<Recipe>(`/api/v1/recipes/${id}`, payload),

  delete: (id: number) => apiClient.delete(`/api/v1/recipes/${id}`),
}
