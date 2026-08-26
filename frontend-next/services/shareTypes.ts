import type { RecipeCalculationResult } from './recipeService'

export type ShareLinkState = {
  active: boolean
  available: boolean
  url?: string | null
  createdAt?: string | null
}

export type PublicPetProfile = {
  pet: {
    name: string
    speciesName?: string | null
    breedName?: string | null
    gender?: string | null
    colorName?: string | null
    birthDate?: string | null
    weightKg?: number | null
    reproductiveStatusName?: string | null
    reproductiveSubStatusName?: string | null
    puppiesCount?: number | null
    comments?: string | null
    photoAvailable: boolean
    updatedAt?: string | null
  }
  healthRecords: Array<{
    recordDate?: string | null
    conditionName?: string | null
    conditionStatus?: string | null
    activityTypeName?: string | null
    symptoms: string[]
    notes?: string | null
    weightKg?: number | null
    activityHours?: number | null
  }>
  contraindications: { ingredients: string[]; description?: string | null }
  recipes: Array<{
    name: string
    description?: string | null
    ageCategory: string
    breedSize: string
    calories?: number | null
    calculatedAt?: string | null
  }>
}

export type PublicRecipe = {
  name: string
  description?: string | null
  ageCategory: string
  breedSize: string
  targetWeightKg?: number | null
  targetBreedName?: string | null
  targetAgeMonths?: number | null
  targetGender?: string | null
  targetActivityTypeName?: string | null
  targetReproductiveStatusName?: string | null
  targetHealthConditionName?: string | null
  targetDisorder?: string | null
  symptoms: string[]
  targetEnergyKcal?: number | null
  maximizeNutrients: string[]
  ingredients: Array<{
    name: string
    subtype?: string | null
    category: string
    minPercent: number
    maxPercent: number
    resultPercent?: number | null
    resultGrams?: number | null
  }>
  nutrientConstraints: Array<{ nutrientKey: string; minValue: number; maxValue: number }>
  calculationResult: RecipeCalculationResult
  calculationVersion?: string | null
  calculatedAt: string
  linkedPet?: {
    name: string
    speciesName?: string | null
    breedName?: string | null
    birthDate?: string | null
    weightKg?: number | null
    photoAvailable: boolean
  } | null
}
