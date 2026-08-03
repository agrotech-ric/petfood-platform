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
  nutrients_ranges: Record<string, { min: number; max: number }>
}

export type RecipeOptimizationRequest = {
  weight: number
  age: number
  age_metric: 'years' | 'months'
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
  ingredient_profiles?: Array<{
    ingredient: string
    nutrients: Record<string, number>
  }>
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

const MODEL_NUTRIENT_LABELS: Record<string, string> = {
  calcium_mg: 'Кальций',
  phosphorus_mg: 'Фосфор',
  magnesium_mg: 'Магний',
  sodium_mg: 'Натрий',
  potassium_mg: 'Калий',
  iron_mg: 'Железо',
  copper_mg: 'Медь',
  zinc_mg: 'Цинк',
  manganese_mg: 'Марганец',
  vitamin_a_mcg: 'Витамин A',
  vitamin_d_mcg: 'Витамин Д',
  vitamin_e_mg: 'Витамин E',
  vitamin_b1_mg: 'Витамин В1 (тиамин)',
  vitamin_b2_mg: 'Витамин В2 (рибофлавин)',
  vitamin_b3_mg: 'Витамин В3 (ниацин)',
  vitamin_b5_mg: 'Пантотеновая кислота',
  vitamin_b6_mg: 'Витамин В6',
  vitamin_b9_mcg: 'Фолиевая кислота',
  vitamin_b12_mcg: 'Витамин В12',
  vitamin_c_mg: 'Витамин C',
  vitamin_k_mcg: 'Витамин K',
  selenium_mcg: 'Селен',
  iodine_mcg: 'Йод',
  choline_mg: 'Холин',
  linoleic_acid_g: 'Линолевая кислота',
  alpha_linolenic_acid_g: 'Альфа-линоленовая кислота',
  arachidonic_acid_g: 'Арахидоновая кислота',
  epa_dha: 'ЭПК (50-60%) + ДГК (40-50%)',
}

export function toRecommenderIngredientName(
  ingredient: Pick<Ingredient, 'name' | 'subtype'>,
): string {
  return ingredient.subtype
    ? `${ingredient.name} — ${ingredient.subtype}`
    : ingredient.name
}

export function toRecommenderIngredientProfile(ingredient: Ingredient) {
  return {
    ingredient: toRecommenderIngredientName(ingredient),
    nutrients: {
      moisture_per: ingredient.moisture,
      protein_per: ingredient.protein,
      carbohydrate_per: ingredient.carbs,
      fats_per: ingredient.fat,
      ash_g: ingredient.ash,
      fiber_g: ingredient.fiber,
      cholesterol_mg: ingredient.cholesterol,
      total_sugar_g: ingredient.sugar,
      choline_mg: ingredient.choline,
      selenium_mcg: ingredient.selenium,
      iodine_mcg: ingredient.iodine,
      vitamin_b5_mg: ingredient.vitaminB5,
      linoleic_acid_g: ingredient.linoleic,
      vitamin_b9_mcg: ingredient.vitaminB9,
      alpha_linolenic_acid_g: ingredient.alphaLinolenic,
      arachidonic_acid_g: ingredient.arachidonic,
      epa_g: ingredient.epa,
      dha_g: ingredient.dha,
      calcium_mg: ingredient.calcium,
      copper_mg: ingredient.copper,
      iron_mg: ingredient.iron,
      magnesium_mg: ingredient.magnesium,
      phosphorus_mg: ingredient.phosphorus,
      potassium_mg: ingredient.potassium,
      sodium_mg: ingredient.sodium,
      zinc_mg: ingredient.zinc,
      manganese_mg: ingredient.manganese,
      vitamin_a_mcg: ingredient.vitaminA,
      vitamin_e_mg: ingredient.vitaminE,
      vitamin_d_mcg: ingredient.vitaminD,
      vitamin_b1_mg: ingredient.vitaminB1,
      vitamin_b2_mg: ingredient.vitaminB2,
      vitamin_b3_mg: ingredient.vitaminB3,
      vitamin_b6_mg: ingredient.vitaminB6,
      vitamin_b12_mcg: ingredient.vitaminB12,
    },
  }
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

  calculateNutrients: async (request: RecommenderDogInfo, targetKcal: number) => {
    const result = await apiClient.post<NutrientCalculation>(
      `/recommender/calculate/nutrients?target_kcal=${encodeURIComponent(targetKcal)}`,
      request,
      STANDARD_TIMEOUT_MS,
    )
    return {
      norms: Object.fromEntries(
        Object.entries(result.norms).map(([key, value]) => [MODEL_NUTRIENT_LABELS[key] ?? key, value]),
      ),
    }
  },

  recommendForDisorder: (request: {
    breed: string
    disorder: string
    age: number
    age_metric: 'years' | 'months'
  }) =>
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
