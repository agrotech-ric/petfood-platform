import { apiClient } from '../src/utils/apiClient'
import type { Ingredient } from './ingredientService'

export type RecommenderActivityLevel =
  | 'passive'
  | 'low'
  | 'moderate'
  | 'active'
  | 'extreme'
  | 'obesity_prone'

export type RecommenderDogInfo = {
  weight: number
  age: number
  age_metric: 'years' | 'months'
  gender: 'male' | 'female'
  breed: string
  reproductive_status?: 'none' | 'pregnancy' | 'lactation'
  pregnancy_period?: 'none' | 'early_4_weeks' | 'last_5_weeks'
  lactation_week?: 'none' | 'week_1' | 'week_2' | 'week_3' | 'week_4'
  num_puppies?: number
  activity_level?: RecommenderActivityLevel
}

export type CalorieCalculation = {
  daily_kcal: number
  formula: string
  reference_page: string
  additional_text: string
  size_category: 'small' | 'medium' | 'large' | 'extra_large'
  age_category: 'puppy' | 'adult' | 'senior'
}

export type NutrientCalculation = {
  norms: Record<string, number>
}

export type DisorderRecommendation = {
  disorder: string
  disorder_type: string
  breed_size: string
  recommended_ingredients: string[]
  top_ingredients_with_scores: Array<{
    ingredient: string
    score: number
    category: string
  }>
  predicted_nutrients: Record<string, number>
}

export type RecipeOptimizationRequest = {
  weight: number
  age: number
  breed: string
  reproductive_status?: 'none' | 'pregnancy' | 'lactation'
  ingredients: string[]
  ingredient_ranges: Array<{
    ingredient: string
    min_percent: number
    max_percent: number
  }>
  nutrient_ranges: Array<{
    nutrient: string
    min_value: number
    max_value: number
  }>
  maximize_nutrients: string[]
  target_kcal: number
}

export type RecipeOptimizationResult = {
  success: boolean
  composition: Array<{
    ingredient: string
    grams_per_100g: number
  }>
  nutritional_value_per_100g: Array<{
    nutrient: string
    value_per_100g: number
    unit: string
  }>
  energy_per_100g: number
  total_feed_grams: number
  ingredients_required: Record<string, number>
  nutritional_value_total: Array<{
    nutrient: string
    value_per_100g: number
    unit: string
  }>
  nutrient_deficiencies: Record<string, string>
  method: string
}

export const RECOMMENDER_NUTRIENT_NAMES: Record<string, string> = {
  moisture: 'Влага',
  protein: 'Белки',
  carbs: 'Углеводы',
  fat: 'Жиры',
  fiber: 'Клетчатка, г',
  ash: 'Зола, г',
  cholesterol: 'Холестерин, мг',
  sugar: 'Сахар общее, г',
  calcium: 'Кальций, мг',
  phosphorus: 'Фосфор, мг',
  magnesium: 'Магний, мг',
  sodium: 'Натрий, мг',
  potassium: 'Калий, мг',
  iron: 'Железо, мг',
  copper: 'Медь, мг',
  zinc: 'Цинк, мг',
  manganese: 'Марганец, мг',
  linoleic: 'Линолевая кислота, г',
  alphaLinolenic: 'Альфа-линоленовая кислота, г',
  arachidonic: 'Арахидоновая кислота, г',
  choline: 'Холин, мг',
  selenium: 'Селен, мкг',
  iodine: 'Йод, мкг',
  vitaminA: 'Витамин A, мкг',
  vitaminE: 'Витамин E, мг',
  vitaminD: 'Витамин Д, мкг',
  vitaminB1: 'Витамин В1 (тиамин), мг',
  vitaminB2: 'Витамин В2 (Рибофлавин), мг',
  vitaminB3: 'Витамин В3 (Ниацин), мг',
  vitaminB5: 'Пантотеновая кислота, мг',
  vitaminB6: 'Витамин В6, мг',
  vitaminB9: 'Фолиевая кислота, мкг',
  vitaminB12: 'Витамин В12, мкг',
}

export function toRecommenderIngredientName(
  ingredient: Pick<Ingredient, 'name' | 'subtype'>,
): string {
  return ingredient.subtype
    ? `${ingredient.name} — ${ingredient.subtype}`
    : ingredient.name
}

const STANDARD_TIMEOUT_MS = 45_000
const OPTIMIZATION_TIMEOUT_MS = 120_000

export const recommenderService = {
  health: () => apiClient.get<{
    status: string
    message: string
    version: string
  }>('/recommender/'),

  calculateCalories: (request: RecommenderDogInfo) =>
    apiClient.post<CalorieCalculation>(
      '/recommender/calculate/calories',
      request,
      STANDARD_TIMEOUT_MS,
    ),

  calculateNutrients: (request: RecommenderDogInfo, targetKcal: number) =>
    apiClient.post<NutrientCalculation>(
      `/recommender/calculate/nutrients?target_kcal=${encodeURIComponent(targetKcal)}`,
      request,
      STANDARD_TIMEOUT_MS,
    ),

  recommendForDisorder: (request: { breed: string; disorder: string }) =>
    apiClient.post<DisorderRecommendation>(
      '/recommender/recommendations/disorder',
      request,
      STANDARD_TIMEOUT_MS,
    ),

  optimizeRecipe: (request: RecipeOptimizationRequest) =>
    apiClient.post<RecipeOptimizationResult>(
      '/recommender/optimize/recipe',
      request,
      OPTIMIZATION_TIMEOUT_MS,
    ),
}
