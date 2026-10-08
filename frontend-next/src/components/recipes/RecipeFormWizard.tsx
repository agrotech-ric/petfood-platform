import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../context/LanguageContext'
import { ingredientService, type Ingredient } from '../../../services/ingredientService'
import { petService, type HealthRecord, type PetProfileData } from '../../../services/petService'
import { petSearchService, type PetListItem } from '../../../services/petSearchService'
import {
  RECOMMENDER_NUTRIENT_NAMES,
  recommenderService,
  toRecommenderIngredientName,
  toRecommenderIngredientProfile,
  type CalorieCalculation,
  type RecipeOptimizationResult,
  type RecommenderActivityLevel,
  type RecommenderDogInfo,
} from '../../../services/recommenderService'
import {
  recipeService,
  type Recipe,
  type RecipeAgeCategory,
  type RecipeBreedSize,
  type RecipeCalculationResult,
  type RecipeGender,
  type RecipePayload,
  type RecipeStatus,
} from '../../../services/recipeService'
import {
  referenceService,
  type ActivityType,
  type Breed,
  type HealthCondition,
  type RefItem,
  type ReproductiveStatus,
  type Symptom,
} from '../../../services/referenceService'
import {
  RECIPE_AGE_LABELS,
  RECIPE_BREED_SIZE_LABELS,
  RECIPE_MAXIMIZE_OPTIONS,
  RECIPE_NUTRIENT_LIMITS,
} from '../../data/recipeOptions'
import DeleteIcon from '../../assets/icons/delete.svg?react'
import { CalorieFormula } from './CalorieFormula'
import { NutrientBalanceChart } from './NutrientBalanceChart'
import { RecipeDonutChart, RECIPE_CHART_COLORS } from './RecipeDonutChart'
import { DualRangeSlider } from './DualRangeSlider'
import { SearchableNutrientSelect } from './SearchableNutrientSelect'
import { SearchablePetSelect } from './SearchablePetSelect'
import { EMPTY_PET_DASHBOARD_FILTERS } from '../../types/petDashboardFilters'
import styles from '../../styles/CreateRecipe.module.css'

type Range = { min: number; max: number }
type PregnancyPeriod = 'early_4_weeks' | 'last_5_weeks'
type LactationWeek = 'week_1' | 'week_2' | 'week_3' | 'week_4'
type AutosaveStatus = 'pristine' | 'saving' | 'saved' | 'failed'

const AUTOSAVE_DELAY_MS = 800

type FormState = {
  petId: string | null
  name: string
  description: string
  ageCategory: RecipeAgeCategory
  breedSize: RecipeBreedSize
  weight: string
  breedId: string
  ageMonths: string
  gender: RecipeGender
  activityId: string
  reproductiveStatusId: string
  pregnancyPeriod: PregnancyPeriod
  lactationWeek: LactationWeek
  puppyCount: string
  healthConditionId: string
  targetDisorder: string
  symptomIds: number[]
  energy: string
  ingredientIds: number[]
  ingredientRanges: Record<number, Range>
  nutrientRanges: Record<string, Range>
  maximizeNutrients: string[]
}

type References = {
  ingredients: Ingredient[]
  breeds: Breed[]
  activities: ActivityType[]
  reproductiveStatuses: ReproductiveStatus[]
  healthConditions: HealthCondition[]
  symptoms: Symptom[]
}

const EMPTY_REFERENCES: References = {
  ingredients: [],
  breeds: [],
  activities: [],
  reproductiveStatuses: [],
  healthConditions: [],
  symptoms: [],
}

function createInitialState(): FormState {
  return {
    petId: null,
    name: '',
    description: '',
    ageCategory: 'adults',
    breedSize: 'all',
    weight: '',
    breedId: '',
    ageMonths: '',
    gender: 'male',
    activityId: '',
    reproductiveStatusId: '',
    pregnancyPeriod: 'early_4_weeks',
    lactationWeek: 'week_1',
    puppyCount: '1',
    healthConditionId: '',
    targetDisorder: '',
    symptomIds: [],
    energy: '',
    ingredientIds: [],
    ingredientRanges: {},
    nutrientRanges: Object.fromEntries(
      RECIPE_NUTRIENT_LIMITS.map(item => [
        item.key,
        { min: item.defaultMin, max: item.defaultMax },
      ]),
    ),
    maximizeNutrients: ['protein', 'moisture'],
  }
}

function displayName(item: RefItem) {
  return item.nameRu ?? item.name ?? item.nameEn ?? `ID ${item.id}`
}

function ingredientDisplayName(ingredient: Ingredient) {
  return ingredient.subtype
    ? `${ingredient.name} — ${ingredient.subtype}`
    : ingredient.name
}

function monthsSince(dateValue?: string) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  let months = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth()
  if (now.getDate() < date.getDate()) months -= 1
  return String(Math.max(0, months))
}

function latestRecord(records: HealthRecord[]) {
  return [...records].sort((a, b) => {
    const left = new Date(a.recordDate ?? a.createdAt).getTime()
    const right = new Date(b.recordDate ?? b.createdAt).getTime()
    return right - left
  })[0]
}

function stateFromRecipe(recipe: Recipe): FormState {
  return {
    petId: recipe.petId ?? null,
    name: recipe.name,
    description: recipe.description ?? '',
    ageCategory: recipe.ageCategory,
    breedSize: recipe.breedSize,
    weight: recipe.targetWeightKg == null ? '' : String(recipe.targetWeightKg),
    breedId: recipe.targetBreedId == null ? '' : String(recipe.targetBreedId),
    ageMonths: recipe.targetAgeMonths == null ? '' : String(recipe.targetAgeMonths),
    gender: recipe.targetGender ?? 'male',
    activityId: recipe.targetActivityTypeId == null ? '' : String(recipe.targetActivityTypeId),
    reproductiveStatusId:
      recipe.targetReproductiveStatusId == null ? '' : String(recipe.targetReproductiveStatusId),
    pregnancyPeriod: 'early_4_weeks',
    lactationWeek: 'week_1',
    puppyCount: '1',
    healthConditionId:
      recipe.targetHealthConditionId == null ? '' : String(recipe.targetHealthConditionId),
    targetDisorder: recipe.targetDisorder ?? recipe.targetHealthConditionName ?? '',
    symptomIds: recipe.symptoms.map(item => item.id),
    energy: recipe.targetEnergyKcal == null ? '' : String(recipe.targetEnergyKcal),
    ingredientIds: recipe.ingredients.map(item => item.ingredientId),
    ingredientRanges: Object.fromEntries(
      recipe.ingredients.map(item => [
        item.ingredientId,
        { min: item.minPercent, max: item.maxPercent },
      ]),
    ),
    nutrientRanges: {
      ...createInitialState().nutrientRanges,
      ...Object.fromEntries(
        recipe.nutrientConstraints.map(item => [
          item.nutrientKey,
          { min: item.minValue, max: item.maxValue },
        ]),
      ),
    },
    maximizeNutrients: recipe.maximizeNutrients ?? [],
  }
}

function prefillFromPet(
  current: FormState,
  pet: PetProfileData,
  records: HealthRecord[],
  references: References,
) {
  const record = latestRecord(records)
  const healthCondition = references.healthConditions.find(item =>
    displayName(item).toLowerCase() === record?.conditionName?.toLowerCase()
  )
  const symptomNames = new Set((record?.symptoms ?? []).map(item => item.toLowerCase()))

  return {
    ...current,
    petId: pet.id,
    weight: pet.weightKg == null ? current.weight : String(pet.weightKg),
    breedId: pet.breedId == null ? current.breedId : String(pet.breedId),
    ageMonths: monthsSince(pet.birthDate) || current.ageMonths,
    gender: pet.gender === 'female' ? 'female' as const : 'male' as const,
    activityId: record?.activityTypeId == null ? current.activityId : String(record.activityTypeId),
    reproductiveStatusId:
      pet.reproductiveStatusId == null
        ? current.reproductiveStatusId
        : String(pet.reproductiveStatusId),
    lactationWeek: (() => {
      const week = pet.reproductiveSubStatusName?.match(/[1-4]/)?.[0]
      return week ? `week_${week}` as LactationWeek : current.lactationWeek
    })(),
    puppyCount: pet.puppiesCount == null || pet.puppiesCount <= 0
      ? current.puppyCount
      : String(pet.puppiesCount),
    healthConditionId:
      healthCondition == null ? current.healthConditionId : String(healthCondition.id),
    targetDisorder: record?.conditionName ?? current.targetDisorder,
    symptomIds: references.symptoms
      .filter(item => symptomNames.has(displayName(item).toLowerCase()))
      .map(item => item.id),
  }
}

function clearPetPrefill(current: FormState): FormState {
  const initial = createInitialState()
  return {
    ...current,
    petId: null,
    weight: initial.weight,
    breedId: initial.breedId,
    ageMonths: initial.ageMonths,
    gender: initial.gender,
    activityId: initial.activityId,
    reproductiveStatusId: initial.reproductiveStatusId,
    pregnancyPeriod: initial.pregnancyPeriod,
    lactationWeek: initial.lactationWeek,
    puppyCount: initial.puppyCount,
    healthConditionId: initial.healthConditionId,
    targetDisorder: initial.targetDisorder,
    symptomIds: initial.symptomIds,
  }
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function normalizeLabel(value: string) {
  return value
    .toLocaleLowerCase('ru-RU')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function isContraindicatedIngredient(ingredient: Ingredient, excludedIngredients: string[]) {
  const names = [ingredientDisplayName(ingredient), ingredient.name].map(normalizeLabel)
  return excludedIngredients.some(excluded => names.includes(normalizeLabel(excluded)))
}

const RECOMMENDER_MAXIMIZE_KEYS: Record<string, string> = {
  moisture_per: 'moisture',
  protein_per: 'protein',
  carbohydrate_per: 'carbs',
  fats_per: 'fat',
}

function normalizeRecommendedRange(range?: Range): Range | null {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) return null
  const min = Math.max(0, Math.min(100, range.min))
  const max = Math.max(0, Math.min(100, range.max))
  return min <= max ? { min, max } : null
}

function activityLevel(activity?: ActivityType): RecommenderActivityLevel {
  const value = `${activity?.code ?? ''} ${displayName(activity ?? { id: 0 })}`.toLowerCase()
  if (value.includes('пассив') || value.includes('passive')) return 'passive'
  if (value.includes('средний1') || value.includes(' low')) return 'low'
  if (value.includes('средний2') || value.includes('moderate')) return 'moderate'
  if (value.includes('экстрем') || value.includes('extreme')) return 'extreme'
  if (value.includes('ожир') || value.includes('obesity')) return 'obesity_prone'
  if (value.includes('актив') || value.includes('active')) return 'active'
  return 'moderate'
}

function reproductiveStatus(status?: ReproductiveStatus) {
  const value = `${status?.code ?? ''} ${displayName(status ?? { id: 0 })}`.toLowerCase()
  if (value.includes('щенн') || value.includes('pregnan')) return 'pregnancy' as const
  if (value.includes('лактац') || value.includes('lactat')) return 'lactation' as const
  return 'none' as const
}

function buildDogInfo(form: FormState, references: References): RecommenderDogInfo {
  const weight = Number(form.weight)
  const ageMonths = Number(form.ageMonths)
  const breed = references.breeds.find(item => String(item.id) === form.breedId)
  if (!Number.isFinite(weight) || weight <= 0) throw new Error('Укажите корректный вес питомца')
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || !form.ageMonths) {
    throw new Error('Укажите возраст питомца')
  }
  if (!breed) throw new Error('Укажите породу питомца')

  const status = reproductiveStatus(
    references.reproductiveStatuses.find(item => String(item.id) === form.reproductiveStatusId),
  )
  const useMonths = ageMonths < 12
  const request: RecommenderDogInfo = {
    weight,
    age: useMonths ? Math.max(0, Math.floor(ageMonths)) : Math.max(1, Math.floor(ageMonths / 12)),
    age_metric: useMonths ? 'months' : 'years',
    gender: form.gender,
    breed: (breed.nameEn ?? breed.name ?? displayName(breed)).toLowerCase().trim(),
    activity_level: activityLevel(
      references.activities.find(item => String(item.id) === form.activityId),
    ),
  }

  if (form.gender === 'female') {
    request.reproductive_status = status
    if (status === 'pregnancy') {
      request.pregnancy_period = form.pregnancyPeriod
    }
    if (status === 'lactation') {
      request.lactation_week = form.lactationWeek
      request.num_puppies = Math.max(1, Math.floor(Number(form.puppyCount) || 1))
    }
  }
  return request
}

const MINERAL_NAMES = new Set([
  'Кальций',
  'Фосфор',
  'Магний',
  'Натрий',
  'Калий',
  'Железо',
  'Медь',
  'Цинк',
  'Марганец',
  'Селен',
  'Йод',
])

function isVitamin(label: string) {
  return label.startsWith('Витамин ')
    || label === 'Пантотеновая кислота'
    || label === 'Фолиевая кислота'
}

function toCalculationResult(
  optimized: RecipeOptimizationResult,
  norms: Record<string, number>,
  ingredients: Ingredient[],
  targetKcal: number,
): RecipeCalculationResult {
  const ingredientsByName = new Map(
    ingredients.map(item => [normalizeLabel(toRecommenderIngredientName(item)), item]),
  )
  const composition = optimized.composition.map((item, index) => {
    const ingredient = ingredientsByName.get(normalizeLabel(item.ingredient))
    return {
      ingredientId: ingredient?.id,
      label: item.ingredient,
      percent: round(item.grams_per_100g),
      grams: round(optimized.ingredients_required[item.ingredient] ?? 0),
      color: RESULT_COLORS[index % RESULT_COLORS.length],
    }
  })
  const per100 = new Map(
    optimized.nutritional_value_per_100g.map(item => [item.nutrient, item.value_per_100g]),
  )
  const nutritionKeys = [
    ['Влага', 'moisture'],
    ['Белки', 'protein'],
    ['Углеводы', 'carbs'],
    ['Жиры', 'fat'],
  ] as const
  const nutrition = nutritionKeys.map(([label, key], index) => ({
    key,
    label,
    value: round(per100.get(label) ?? 0),
    unit: 'г',
    color: RESULT_COLORS[index % RESULT_COLORS.length],
  }))

  const nutrients: NonNullable<RecipeCalculationResult['nutrients']> = []
  const minerals: NonNullable<RecipeCalculationResult['minerals']> = []
  const vitamins: NonNullable<RecipeCalculationResult['vitamins']> = []
  optimized.nutritional_value_total.forEach(item => {
    if (nutritionKeys.some(([label]) => label === item.nutrient)) return
    const value = round(item.value_per_100g)
    const norm = norms[item.nutrient]
    const percent = norm > 0 ? round((value / norm) * 100) : 0
    if (MINERAL_NAMES.has(item.nutrient)) {
      minerals.push({
        label: item.nutrient,
        current: value,
        norm: round(norm ?? 0),
        unit: item.unit,
        percent,
      })
    } else if (isVitamin(item.nutrient)) {
      vitamins.push({
        label: item.nutrient,
        current: value,
        norm: round(norm ?? 0),
        unit: item.unit,
        percent,
      })
    } else {
      nutrients.push({ label: item.nutrient, value, unit: item.unit })
    }
  })

  return {
    calories: round(optimized.energy_per_100g),
    dailyNorm: round(optimized.total_feed_grams),
    dailyCaloriesNorm: round(targetKcal),
    composition,
    nutrition,
    nutritionPer100: {
      calories: round(optimized.energy_per_100g),
      moisture: round(per100.get('Влага') ?? 0),
      protein: round(per100.get('Белки') ?? 0),
      fat: round(per100.get('Жиры') ?? 0),
      carbs: round(per100.get('Углеводы') ?? 0),
    },
    nutrients,
    minerals,
    vitamins,
    optimizationMethod: optimized.method,
    digestion: optimized.digestion,
  }
}

function ingredientDefaultRange(category: string): Range {
  const value = category.toLowerCase()
  if (value.includes('мясо') || value.includes('яйца') || value.includes('молоч')) {
    return { min: 40, max: 90 }
  }
  if (value.includes('масло') || value.includes('жир')) return { min: 1, max: 10 }
  if (value.includes('круп')) return { min: 5, max: 35 }
  if (value.includes('овощ') || value.includes('фрукт')) return { min: 5, max: 25 }
  if (value.includes('вода')) return { min: 0, max: 30 }
  return { min: 1, max: 3 }
}

function calculationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const normalized = message.toLowerCase()
  if (
    normalized.includes('could not find valid recipe composition')
    || normalized.includes('не смог подобрать состав')
  ) {
    return 'Не удалось подобрать состав с текущими ограничениями. Расширьте диапазоны ингредиентов или нутриентов и повторите расчёт.'
  }
  if (normalized.includes('выберите хотя бы один ингредиент')) {
    return 'Выберите хотя бы один ингредиент для расчёта.'
  }
  if (normalized.includes('request failed with status 500') || normalized.includes('internal server error')) {
    return 'Алгоритм не смог рассчитать выбранное сочетание ингредиентов. Проверьте ингредиенты и их допустимые диапазоны.'
  }
  return message || 'Не удалось рассчитать состав. Проверьте выбранные параметры.'
}

function toPayload(
  state: FormState,
  calculationResult: RecipeCalculationResult | null = null,
  calculationVersion: string | null = null,
): RecipePayload {
  return {
    petId: state.petId,
    name: state.name.trim(),
    description: state.description.trim() || null,
    ageCategory: state.ageCategory,
    breedSize: state.breedSize,
    targetWeightKg: toOptionalNumber(state.weight),
    targetBreedId: toOptionalNumber(state.breedId),
    targetAgeMonths: toOptionalNumber(state.ageMonths),
    targetGender: state.gender,
    targetActivityTypeId: toOptionalNumber(state.activityId),
    targetReproductiveStatusId: toOptionalNumber(state.reproductiveStatusId),
    targetHealthConditionId: toOptionalNumber(state.healthConditionId),
    targetDisorder: state.targetDisorder.trim() || null,
    symptomIds: state.symptomIds,
    targetEnergyKcal: toOptionalNumber(state.energy),
    maximizeNutrients: state.maximizeNutrients,
    ingredients: state.ingredientIds.map(ingredientId => {
      const resultItem = calculationResult?.composition?.find(
        item => item.ingredientId === ingredientId,
      )
      return {
        ingredientId,
        minPercent: state.ingredientRanges[ingredientId]?.min ?? 0,
        maxPercent: state.ingredientRanges[ingredientId]?.max ?? 100,
        resultPercent: resultItem?.percent ?? null,
        resultGrams: resultItem?.grams ?? null,
      }
    }),
    nutrientConstraints: Object.entries(state.nutrientRanges).map(([nutrientKey, range]) => ({
      nutrientKey,
      minValue: range.min,
      maxValue: range.max,
    })),
    calculationResult,
    calculationVersion,
  }
}

const RESULT_COLORS = RECIPE_CHART_COLORS
type MainNutrientKey = 'protein' | 'fat' | 'carbs'

type IngredientContribution = {
  ingredientId: number
  name: string
  servingGrams: number
  values: Array<{ key: MainNutrientKey; label: string; amount: number; percent: number; unit: string }>
}
function buildIngredientContributions(
  result: RecipeCalculationResult,
  ingredients: Ingredient[],
): IngredientContribution[] {
  const ingredientsById = new Map(ingredients.map(item => [item.id, item]))
  const dailyNorm = Number(result.dailyNorm ?? 0)
  const totals = {
    protein: Number(result.nutritionPer100?.protein ?? 0) * dailyNorm / 100,
    fat: Number(result.nutritionPer100?.fat ?? 0) * dailyNorm / 100,
    carbs: Number(result.nutritionPer100?.carbs ?? 0) * dailyNorm / 100,
  }
  const definitions: Array<{ key: MainNutrientKey; label: string; field: 'protein' | 'fat' | 'carbs' }> = [
    { key: 'protein', label: 'Белки', field: 'protein' },
    { key: 'fat', label: 'Жиры', field: 'fat' },
    { key: 'carbs', label: 'Углеводы', field: 'carbs' },
  ]

  return (result.composition ?? []).flatMap(item => {
    if (item.ingredientId == null) return []
    const ingredient = ingredientsById.get(item.ingredientId)
    if (!ingredient) return []
    const servingGrams = Number(item.grams ?? 0)
    return [{
      ingredientId: ingredient.id,
      name: ingredient.subtype ? `${ingredient.name}, ${ingredient.subtype}` : ingredient.name,
      servingGrams,
      values: definitions.map(definition => {
        const amount = servingGrams * Number(ingredient[definition.field] ?? 0) / 100
        const total = totals[definition.key]
        return {
          key: definition.key,
          label: definition.label,
          amount,
          percent: total > 0 ? amount / total * 100 : 0,
          unit: 'г',
        }
      }),
    }]
  })
}
function LineChart({
  data,
  lower,
  upper,
}: {
  data: { time: number; remaining: number }[]
  lower?: { time: number; remaining: number }[]
  upper?: { time: number; remaining: number }[]
}) {
  const width = 350
  const height = 210
  const padLeft = 50
  const padBottom = 45
  const padTop = 16
  const padRight = 16

  if (data.length === 0) return null

  const bandValues = [...(lower ?? []), ...(upper ?? [])]
  const maxY = Math.max(1, ...data.map(item => item.remaining), ...bandValues.map(item => item.remaining))
  const maxX = Math.max(1, ...data.map(item => item.time), ...bandValues.map(item => item.time))
  const toX = (time: number) => padLeft + (time / maxX) * (width - padLeft - padRight)
  const toY = (value: number) => padTop + (1 - value / maxY) * (height - padTop - padBottom)
  const points = data.map(item => `${toX(item.time)},${toY(item.remaining)}`).join(' ')
  const bandPoints = lower && upper
    ? [...upper.map(item => `${toX(item.time)},${toY(item.remaining)}`), ...[...lower].reverse().map(item => `${toX(item.time)},${toY(item.remaining)}`)].join(' ')
    : ''
  const middle = data[Math.floor(data.length / 2)]
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
      {yTicks.map((value, index) => 
       <g key={index}><line x1={padLeft} y1={toY(value)} x2={width - padRight} y2={toY(value)} stroke="var(--color-border)" strokeWidth="1" />
       <text x={padLeft - 4} y={toY(value) + 3} fontSize="12" fill="var(--color-text-muted)" textAnchor="end">{value.toFixed(2)}
        </text></g>)}
      {data.map(item => <text key={item.time} x={toX(item.time)} y={height - 25} fontSize="12" fill="var(--color-text-muted)" textAnchor="middle">
        {item.time}</text>)}
      {bandPoints && <polygon points={bandPoints} fill="var(--color-accent-alt)" fillOpacity="0.25" stroke="none" />}
      <polyline points={points} fill="none" stroke="var(--color-accent-alt)" strokeWidth="2" />
      <circle cx={toX(middle.time)} cy={toY(middle.remaining)} r={5} fill="var(--color-accent-alt)" />
      <text x={-3} y={height / 2 -10} fontSize="12" fill="var(--color-text-muted)" textAnchor="middle" transform={`rotate(-90, ${-3}, ${height / 2 -10})`}>
      Остаток (г)</text>
      <text x={(width + padLeft) / 2} y={height -8} fontSize="12" fill="var(--color-text-muted)" textAnchor="middle">
      Время (часы)</text>
    </svg>
  )
}
function descendingCurve(curve: { time: number; remaining: number }[]) {
  if (curve.length < 2 || curve[curve.length - 1].remaining <= curve[0].remaining) return curve
  const first = curve[0].remaining
  const last = curve[curve.length - 1].remaining
  return curve.map(point => ({ ...point, remaining: Math.max(0, first + last - point.remaining) }))
}

function forecastPercentClass(percent: number) {
  return percent === 0 ? '' : percent < 50 ? styles.forecastPercentLow : styles.forecastPercentMid
}

function EditCalculationResult({
  result,
  activeDigestionTab = 'protein',
  onDigestionTabChange,
  ingredients,
}: {
  result: RecipeCalculationResult
  activeDigestionTab?: 'protein' | 'fat' | 'carbs'
  onDigestionTabChange?: (tab: 'protein' | 'fat' | 'carbs') => void
  ingredients: Ingredient[]
}) {
  const { t } = useTranslation()
  const composition = result.composition ?? []
  const nutrition = result.nutrition ?? []
  const nutrients = result.nutrients ?? []
  const minerals = result.minerals ?? []
  const vitamins = result.vitamins ?? []
  const digestion = result.digestion
  const ingredientContributions = buildIngredientContributions(result, ingredients)
  const sortedIngredientContributions = ingredientContributions
  .map(item => {
    const value = item.values.find(
      nutrient => nutrient.key === activeDigestionTab
    )

    if (!value || Math.round(value.amount) <= 1) {
      return null
    }

    return {
      item,
      value,
    }
  })
  .filter(entry => entry !== null)
  .sort((a, b) => b.value.amount - a.value.amount)

  const tabData = digestion ? {
    protein: {
      curve: digestion.protein ?? [],
      curve_min: digestion.protein_min ?? [],
      curve_max: digestion.protein_max ?? [],
      absorption: digestion.proteinAbsorption,
      forecast: digestion.proteinForecast ?? [],
    },
    fat: {
      curve: descendingCurve(digestion.fat ?? []),
      curve_min: digestion.fat_min ?? [],
      curve_max: digestion.fat_max ?? [],
      absorption: digestion.fatAbsorption,
      forecast: digestion.fatForecast ?? [],
    },
    carbs: {
      curve: descendingCurve(digestion.carbs ?? []),
      curve_min: digestion.carbs_min ?? [],
      curve_max: digestion.carbs_max ?? [],
      absorption: digestion.carbsAbsorption,
      forecast: digestion.carbsForecast ?? [],
    },
  } : null
  const current = tabData
    ? (tabData[activeDigestionTab].curve.length > 0
      ? tabData[activeDigestionTab]
      : Object.values(tabData).find(item => item.curve.length > 0))
    : undefined

  return (
    <div id="recipe-result" className={styles.editResult}>
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>
            {t('recipes.energyPer100Value', { value: result.calories ?? '—' })}
          </p>
          <p className={styles.metricLabel}>{t('recipes.energyValueLabel')}</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{result.dailyNorm ?? '—'} г</p>
          <p className={styles.metricLabel}>{t('recipes.dailyPortion')}</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{result.dailyCaloriesNorm ?? '—'} ккал</p>
          <p className={styles.metricLabel}>Суточная норма калорий</p>
        </div>
      </div>

      {(composition.length > 0 || nutrition.length > 0) && (
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>Состав рациона</p>
            <div className={styles.donutWrapper}>
              <RecipeDonutChart data={composition.map((item, index) => ({
                name: item.label,
                value: item.percent,
                color: item.color ?? RESULT_COLORS[index % RESULT_COLORS.length],
                label: `${item.percent}%`,
              }))} />
            </div>
            <table className={styles.compositionTable}>
              <thead>
                <tr><th>Ингредиенты</th><th>%</th><th>грамм</th></tr>
              </thead>
              <tbody>
                {composition.map((item, index) => (
                  <tr key={`${item.ingredientId ?? item.label}-${index}`}>
                    <td>{item.label}</td>
                    <td>{item.percent}%</td>
                    <td>{item.grams} г</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>Питательная ценность</p>
            <div className={styles.donutWrapper}>
              <RecipeDonutChart data={nutrition.map((item, index) => ({
                name: item.label,
                value: item.value,
                color: item.color ?? RESULT_COLORS[index % RESULT_COLORS.length],
                label: `${item.value} ${t('recipes.unitPer100', { unit: item.unit })}`,
              }))} />
            </div>
            <div className={styles.donutLegend}>
              {nutrition.map((item, index) => (
                <div key={`${item.key ?? item.label}-${index}`} className={styles.donutLegendRow}>
                  <span
                    className={styles.legendDot}
                    style={{ background: item.color ?? RESULT_COLORS[index % RESULT_COLORS.length] }}
                  />
                  <span>
                    {item.label} — {item.value} {t('recipes.unitPer100', { unit: item.unit })}
                  </span>
                </div>
              ))}
            </div>
            {result.nutritionPer100 && (
              <p className={styles.resultEnergy}>
                {t('recipes.energyPer100Summary', { value: result.nutritionPer100.calories })}
              </p>
            )}
          </div>
        </div>
      )}

      {(nutrients.length > 0 || minerals.length > 0 || vitamins.length > 0) && (
        <div className={`${styles.card} ${styles.resultDetailsCard}`}>
          {nutrients.length > 0 && (
            <>
              <p className={styles.sectionTitle}>Содержание нутриентов</p>
              <div className={styles.nutrientsGrid}>
                {nutrients.map((item, index) => (
                  <div key={`${item.key ?? item.label}-${index}`} className={styles.nutrientRow}>
                    <span>{item.label}</span>
                    <span>{item.value} {t('recipes.unitPer100', { unit: item.unit })}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {(minerals.length > 0 || vitamins.length > 0) && (
            <div className={styles.barChartsRow}>
              {minerals.length > 0 && (
                <NutrientBalanceChart title="Минералы" items={minerals} />
              )}
              {vitamins.length > 0 && (
                <NutrientBalanceChart title="Витамины" items={vitamins} />
              )}
            </div>
          )}
        </div>
      )}


      {tabData && (tabData.protein.curve.length > 0 || tabData.fat.curve.length > 0 || tabData.carbs.curve.length > 0) && (
              <div className={styles.digestionCard}>
                <p className={styles.digestionTitle}>Анализ переваривания</p>
                <p className={styles.digestionSubtitle}>Модель Михаэлиса-Ментен</p>
                <div className={styles.tabs}>
                  {(['protein', 'fat', 'carbs'] as const).map(tab => (
                    <button
                      key={tab}
                      className={`${styles.tab} ${activeDigestionTab === tab ? styles.tabActive : ''}`}
                      onClick={() => onDigestionTabChange?.(tab)}
                    >
                      {tab === 'protein' ? 'Белки' : tab === 'fat' ? 'Жиры' : 'Углеводы'}
                    </button>
                  ))}
                </div>
                <div className={styles.digestionContent}>
                  <div>
                    <p className={styles.chartLabel}>
                      Кривая переваривания S(t) — остаток во времени
                    </p>
                {current && current.curve.length > 0 && <LineChart data={current.curve} lower={current.curve_min} upper={current.curve_max} />}
                  </div>
                  <div>
                    <p className={styles.absorptionLabel}>Усвояемость D(t)</p>
                    <div className={styles.absorptionBarTrack}>
                      <div
                        className={styles.absorptionBarFill}
                        style={{ width: `${Math.min(Math.max(current.absorption ?? 0, 0), 100)}%` }}
                      >
                        {current.absorption ?? 0}%
                      </div>
                    </div>
                    <p className={styles.forecastTitle}>Прогноз переваривания</p>
                    <table className={styles.forecastTable}>
                      <tbody>
                        {current.forecast.map(item => (
                          <tr key={item.hour}>
                            <td>{item.hour} ч:</td>
                            <td>
                              <span className={`${styles.forecastPercent} ${forecastPercentClass(item.percent)}`}>
                                {item.percent.toFixed(1)}%
                              </span>
                            </td>
                            <td>{item.grams} г</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {ingredientContributions.length > 0 && (
        <div className={styles.ingredientContributions}>
          <p className={styles.chartLabel} style={{ fontSize: '18px', color: 'var(--color-accent-alt)' }}>
            Вклад ингредиентов в{' '}
            {activeDigestionTab === 'protein'
              ? 'белок'
              : activeDigestionTab === 'fat'
                ? 'жиры'
                : 'углеводы'}
          </p>

          <div className={styles.ingredientContributionGrid}>

            {sortedIngredientContributions.map(({ item, value }) => (
              <div
                key={item.ingredientId}
                className={styles.ingredientContributionCard}
              >
                <p className={styles.ingredientContributionName}>
                  {item.name}
                </p>

                <p className={styles.ingredientContributionAmount}>
                  {value.amount.toFixed(2)} {value.unit}
                </p>

                <p className={styles.ingredientContributionPercent}>
                  {value.percent.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
              </div>
            )}    
    </div>
  )
}

export function RecipeFormWizard({ recipeId }: { recipeId?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const locationState = location.state as {
    from?: string
    petId?: string
    fromTab?: string
    autosavedDraft?: boolean
  } | null
  const origin = locationState?.from
  const originPetId = locationState?.petId
  const [form, setForm] = useState<FormState>(createInitialState)
  const [references, setReferences] = useState<References>(EMPTY_REFERENCES)
  const [pets, setPets] = useState<PetListItem[]>([])
  const [loadingPets, setLoadingPets] = useState(true)
  const [selectingPet, setSelectingPet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updatingRecommendations, setUpdatingRecommendations] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('pristine')
  const [autosaveError, setAutosaveError] = useState('')
  const [persistedStatus, setPersistedStatus] = useState<RecipeStatus | null>(null)
  const [dirtyRevision, setDirtyRevision] = useState(0)
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [calculationResult, setCalculationResult] = useState<RecipeCalculationResult | null>(null)
  const [calculationVersion, setCalculationVersion] = useState<string | null>(null)
  const [nutrientNorms, setNutrientNorms] = useState<Record<string, number>>({})
  const [recommendedEnergy, setRecommendedEnergy] = useState<number | null>(null)
  const [calorieCalculation, setCalorieCalculation] = useState<CalorieCalculation | null>(null)
  const [availableDisorders, setAvailableDisorders] = useState<string[]>([])
  const [loadingDisorders, setLoadingDisorders] = useState(false)
  const [activeDigestionTab, setActiveDigestionTab] = useState<'protein' | 'fat' | 'carbs'>('protein')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([])

  const calculationInputRevision = useRef(0)
  const revisionRef = useRef(0)
  const persistedRevisionRef = useRef(0)
  const activeRecipeIdRef = useRef<number | undefined>(recipeId)
  const latestPayloadRef = useRef<RecipePayload>(toPayload(createInitialState()))
  const autosaveTimerRef = useRef<number | null>(null)
  const autosavePromiseRef = useRef<Promise<boolean> | null>(null)
  const autosaveRef = useRef<() => Promise<boolean>>(async () => true)
  const saveImmediatelyRef = useRef(false)
  const pendingRouteIdRef = useRef<number | null>(null)
  const suppressRouteReplacementRef = useRef(false)
  const discardingRef = useRef(false)
  const mountedRef = useRef(true)
  const petSelectionRevisionRef = useRef(0)

  const isEdit = recipeId != null
  activeRecipeIdRef.current = recipeId ?? activeRecipeIdRef.current
  latestPayloadRef.current = toPayload(
    form,
    calculationResult,
    calculationVersion,
  )

  useEffect(() => {
    let cancelled = false
    setLoadingPets(true)
    petSearchService.search('', EMPTY_PET_DASHBOARD_FILTERS, 0, 100)
      .then(page => {
        if (!cancelled) setPets(page.content ?? [])
      })
      .catch(() => {
        if (!cancelled) setPets([])
      })
      .finally(() => {
        if (!cancelled) setLoadingPets(false)
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const safe = <T,>(request: Promise<T[]>) => request.catch(() => [] as T[])

    const load = async () => {
      setLoading(true)
      setError('')
      ingredientService.list().then(setIngredients).catch(() => setIngredients([]))
    
      try {
        const species = await safe(referenceService.fetchSpecies())
        const dogSpecies = species.find(item => {
          const value = `${item.code ?? ''} ${displayName(item)}`.toLowerCase()
          return value.includes('dog') || value.includes('собак')
        }) ?? species[0]

        const [
          ingredients,
          breeds,
          activities,
          femaleStatuses,
          maleStatuses,
          healthConditions,
          symptoms,
          recipe,
          pet,
          records,
          contraindications,
        ] = await Promise.all([
          safe(ingredientService.list()),
          dogSpecies ? safe(referenceService.fetchBreedsBySpeciesId(dogSpecies.id)) : Promise.resolve([]),
          safe(referenceService.fetchActivityTypes()),
          safe(referenceService.fetchReproductiveStatuses('female')),
          safe(referenceService.fetchReproductiveStatuses('male')),
          safe(referenceService.fetchHealthConditions()),
          safe(referenceService.fetchSymptoms()),
          recipeId == null ? Promise.resolve(null) : recipeService.get(recipeId),
          originPetId == null ? Promise.resolve(null) : petService.getPet(originPetId).catch(() => null),
          originPetId == null
            ? Promise.resolve([])
            : petService.getHealthRecords(originPetId).catch(() => []),
          originPetId == null
            ? Promise.resolve({ ingredients: [] as string[] })
            : petService.getContraindications(originPetId).catch(() => ({ ingredients: [] as string[] })),
        ])

        if (cancelled) return
        const loadedReferences: References = {
          ingredients,
          breeds,
          activities,
          reproductiveStatuses: [...femaleStatuses, ...maleStatuses].filter(
            (item, index, items) => items.findIndex(other => other.id === item.id) === index,
          ),
          healthConditions,
          symptoms,
        }
        setReferences(loadedReferences)
        setExcludedIngredients(contraindications.ingredients ?? [])

        let next = recipe ? stateFromRecipe(recipe) : createInitialState()
        if (!recipe && pet) next = prefillFromPet(next, pet, records, loadedReferences)
        setForm(next)
        setRecommendedEnergy(recipe?.targetEnergyKcal ?? null)
        setCalculationResult(recipe?.calculationResult ?? null)
        setCalculationVersion(recipe?.calculationVersion ?? null)
        if (recipe) {
          setPersistedStatus(recipe.status)
          setAutosaveStatus('saved')
        }
      } catch (errorValue) {
        if (!cancelled) {
          setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить форму')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [originPetId, recipeId])

  useEffect(() => {
    if (!isEdit || loading || calorieCalculation) return

    let cancelled = false
    const loadCalorieFormula = async () => {
      try {
        const result = await recommenderService.calculateCalories(buildDogInfo(form, references))
        if (cancelled) return
        setCalorieCalculation(result)
        setRecommendedEnergy(round(result.daily_kcal))
      } catch {
        // Formula details are supplemental; the saved recipe remains usable without them.
      }
    }

    void loadCalorieFormula()
    return () => { cancelled = true }
  }, [calorieCalculation, form, isEdit, loading, references])

  const ingredientGroups = useMemo(() => {
    const groups = new Map<string, Ingredient[]>()
    references.ingredients
      .filter(ingredient => ingredient.recommenderSupported)
      .forEach(ingredient => {
        const group = groups.get(ingredient.category) ?? []
        group.push(ingredient)
        groups.set(ingredient.category, group)
      })
    return Array.from(groups, ([category, ingredients]) => ({ category, ingredients }))
  }, [references.ingredients])

  const compatibleStatuses = references.reproductiveStatuses.filter(status => {
    if (!status.gender) return true
    return status.gender.toLowerCase() === form.gender
  })
  const selectedReproductiveStatus = reproductiveStatus(
    references.reproductiveStatuses.find(
      status => String(status.id) === form.reproductiveStatusId,
    ),
  )

  useEffect(() => {
    const breed = references.breeds.find(item => String(item.id) === form.breedId)
    if (!breed) {
      setAvailableDisorders([])
      return
    }

    let cancelled = false
    const modelBreed = (breed.nameEn ?? breed.name ?? displayName(breed)).toLowerCase().trim()
    setLoadingDisorders(true)
    recommenderService.getBreedDetails(modelBreed)
      .then(result => {
        if (!cancelled) setAvailableDisorders(result.breed_info.diseases)
      })
      .catch(() => {
        if (!cancelled) setAvailableDisorders([])
      })
      .finally(() => {
        if (!cancelled) setLoadingDisorders(false)
      })

    return () => { cancelled = true }
  }, [form.breedId, references.breeds])

  const markDirty = (immediate = false) => {
    revisionRef.current += 1
    if (immediate) saveImmediatelyRef.current = true
    setDirtyRevision(revisionRef.current)
  }

  const runAutosave = async (): Promise<boolean> => {
    if (discardingRef.current || revisionRef.current <= persistedRevisionRef.current) {
      return true
    }
    if (autosavePromiseRef.current) return autosavePromiseRef.current

    const savingRevision = revisionRef.current
    const payload = latestPayloadRef.current
    const existingId = activeRecipeIdRef.current
    if (mountedRef.current) {
      setAutosaveStatus('saving')
      setAutosaveError('')
    }

    const request = existingId == null
      ? recipeService.create(payload)
      : recipeService.update(existingId, payload)

    const pending = request.then(saved => {
      if (existingId == null) {
        activeRecipeIdRef.current = saved.id
        pendingRouteIdRef.current = saved.id
      }
      persistedRevisionRef.current = Math.max(persistedRevisionRef.current, savingRevision)
      if (mountedRef.current) {
        setPersistedStatus(saved.status)
        setAutosaveStatus('saved')
      }
      return true
    }).catch(() => {
      if (mountedRef.current) {
        setAutosaveStatus('failed')
        setAutosaveError(t('recipes.autosaveFailed'))
      }
      return false
    }).finally(() => {
      if (autosavePromiseRef.current === pending) autosavePromiseRef.current = null
    })

    autosavePromiseRef.current = pending
    const success = await pending
    if (!success || discardingRef.current) return success

    if (revisionRef.current > persistedRevisionRef.current) {
      return autosaveRef.current()
    }

    const routeId = pendingRouteIdRef.current
    if (routeId != null && !suppressRouteReplacementRef.current && mountedRef.current) {
      pendingRouteIdRef.current = null
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
      const historyState = window.history.state ?? {}
      window.history.replaceState(
        {
          ...historyState,
          usr: { ...(locationState ?? {}), autosavedDraft: true },
        },
        '',
        `${basePath}/recipes/${routeId}/edit`,
      )
    }
    return true
  }
  autosaveRef.current = runAutosave

  const flushAutosave = async (): Promise<boolean> => {
    if (autosaveTimerRef.current != null) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    while (revisionRef.current > persistedRevisionRef.current) {
      const success = autosavePromiseRef.current == null
        ? await autosaveRef.current()
        : await autosavePromiseRef.current
      if (!success) return false
    }
    return true
  }

  useEffect(() => {
    if (loading || dirtyRevision <= persistedRevisionRef.current) return
    if (autosaveTimerRef.current != null) window.clearTimeout(autosaveTimerRef.current)

    setAutosaveStatus('saving')
    const delay = saveImmediatelyRef.current ? 0 : AUTOSAVE_DELAY_MS
    saveImmediatelyRef.current = false
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null
      void autosaveRef.current()
    }, delay)

    return () => {
      if (autosaveTimerRef.current != null) {
        window.clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
    }
  }, [dirtyRevision, loading])

  useEffect(() => {
    const warnAboutUnsavedChanges = (event: BeforeUnloadEvent) => {
      if (
        revisionRef.current > persistedRevisionRef.current
        || autosavePromiseRef.current != null
        || autosaveStatus === 'failed'
      ) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warnAboutUnsavedChanges)
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges)
  }, [autosaveStatus])

  useEffect(() => {
    mountedRef.current = true
    suppressRouteReplacementRef.current = false
    return () => {
      mountedRef.current = false
      suppressRouteReplacementRef.current = true
      if (autosaveTimerRef.current != null) {
        window.clearTimeout(autosaveTimerRef.current)
        autosaveTimerRef.current = null
      }
      if (revisionRef.current > persistedRevisionRef.current) {
        void autosaveRef.current()
      }
    }
  }, [])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    markDirty()
  }

  const invalidateCalculation = () => {
    calculationInputRevision.current += 1
    setCalculationResult(null)
    setCalculationVersion(null)
    setNutrientNorms({})
  }

  const setCalculationField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    invalidateCalculation()
    setField(key, value)
  }

  const toggleSymptom = (symptomId: number) => {
    setCalculationField(
      'symptomIds',
      form.symptomIds.includes(symptomId)
        ? form.symptomIds.filter(id => id !== symptomId)
        : [...form.symptomIds, symptomId],
    )
  }

  const toggleIngredient = (ingredientId: number) => {
    if (form.ingredientIds.includes(ingredientId)) {
      setCalculationField('ingredientIds', form.ingredientIds.filter(id => id !== ingredientId))
      return
    }
    const ingredient = references.ingredients.find(item => item.id === ingredientId)
    if (!ingredient) return
    invalidateCalculation()
    setForm(current => ({
      ...current,
      ingredientIds: [...current.ingredientIds, ingredientId],
      ingredientRanges: {
        ...current.ingredientRanges,
        [ingredientId]: current.ingredientRanges[ingredientId]
          ?? ingredientDefaultRange(ingredient.category),
      },
    }))
    markDirty()
  }

  const updateIngredientRange = (ingredientId: number, range: Range) => {
    setCalculationField('ingredientRanges', { ...form.ingredientRanges, [ingredientId]: range })
  }

  const updateNutrientRange = (key: string, range: Range) => {
    setCalculationField('nutrientRanges', { ...form.nutrientRanges, [key]: range })
  }

  const handlePetChange = async (petId: string | null) => {
    if (petId === form.petId) return
    const selectionRevision = petSelectionRevisionRef.current + 1
    petSelectionRevisionRef.current = selectionRevision

    if (petId == null) {
      invalidateCalculation()
      setForm(clearPetPrefill)
      setRecommendedEnergy(null)
      setCalorieCalculation(null)
      markDirty(true)
      return
    }

    setSelectingPet(true)
    setError('')
    try {
      const [pet, records] = await Promise.all([
        petService.getPet(petId),
        petService.getHealthRecords(petId).catch(() => []),
      ])
      if (selectionRevision !== petSelectionRevisionRef.current) return

      invalidateCalculation()
      setForm(current => prefillFromPet(current, pet, records, references))
      markDirty(true)
    } catch {
      if (selectionRevision === petSelectionRevisionRef.current) {
        setError(t('recipes.petSelectionError'))
      }
    } finally {
      if (selectionRevision === petSelectionRevisionRef.current) setSelectingPet(false)
    }
  }

  const navigateBack = () => {
    if (origin === 'pet-profile' && originPetId) {
      navigate(`/pet-profile/${originPetId}`, { state: { tab: locationState?.fromTab ?? 'food' } })
    } else if (isEdit && !locationState?.autosavedDraft) {
      navigate(`/recipes/${recipeId}`)
    } else {
      navigate('/recipes')
    }
  }

  const goBack = async () => {
    suppressRouteReplacementRef.current = true
    const saved = await flushAutosave()
    if (!saved) {
      suppressRouteReplacementRef.current = false
      return
    }
    navigateBack()
  }

  const handleDelete = async () => {
    const persistedId = activeRecipeIdRef.current
    if (persistedId != null && !window.confirm(t('recipes.deleteDraftConfirm'))) return

    discardingRef.current = true
    suppressRouteReplacementRef.current = true
    if (autosaveTimerRef.current != null) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    persistedRevisionRef.current = revisionRef.current
    try {
      if (autosavePromiseRef.current) await autosavePromiseRef.current
      const draftId = activeRecipeIdRef.current
      if (draftId != null) await recipeService.delete(draftId)
      if (origin === 'pet-profile' && originPetId) {
        navigate(`/pet-profile/${originPetId}`, {
          state: { tab: locationState?.fromTab ?? 'food' },
        })
      } else {
        navigate('/recipes')
      }
    } catch {
      discardingRef.current = false
      suppressRouteReplacementRef.current = false
      setError(t('recipes.deleteDraftFailed'))
    }
  }

  const showOptimization = () => {
    document.getElementById('recipe-optimization')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleUpdateRecommendations = async (disorderOverride?: string) => {
    if (updatingRecommendations || calculating) return
    invalidateCalculation()
    setUpdatingRecommendations(true)
    setError('')
    setNotice('')
    try {
      const dog = buildDogInfo(form, references)
      const calorieResult = await recommenderService.calculateCalories(dog)
      const targetKcal = round(calorieResult.daily_kcal)
      setRecommendedEnergy(targetKcal)
      setCalorieCalculation(calorieResult)
      const nutrientResult = await recommenderService.calculateNutrients(dog, targetKcal)
      setNutrientNorms(nutrientResult.norms)

      let recommendedIngredients: Ingredient[] = []
      const recommendedIngredientRanges = new Map<number, Range>()
      let recommendedMaximizeNutrients: string[] = []
      let recommendationWarning = ''
      const disorder = disorderOverride ?? form.targetDisorder
      const healthyCondition = normalizeLabel(disorder) === normalizeLabel('Здоровый')
      if (disorder && !healthyCondition) {
        try {
          const recommendation = await recommenderService.recommendForDisorder({
            breed: dog.breed,
            disorder,
            age: dog.age,
            age_metric: dog.age_metric,
            weight: dog.weight,
            target_kcal: targetKcal,
            reproductive_status: dog.reproductive_status ?? 'none',
            excluded_ingredients: excludedIngredients,
          })
          const rangesByName = new Map(
            Object.entries(recommendation.ingr_ranges).map(([name, range]) => [
              normalizeLabel(name),
              range,
            ]),
          )
          recommendedIngredients = references.ingredients.filter(item =>
            item.recommenderSupported
            && rangesByName.has(normalizeLabel(toRecommenderIngredientName(item)))
          )
          recommendedIngredients.forEach(item => {
            const recommendedRange = rangesByName.get(
              normalizeLabel(toRecommenderIngredientName(item)),
            )
            const normalizedRange = normalizeRecommendedRange(recommendedRange)
            if (normalizedRange) recommendedIngredientRanges.set(item.id, normalizedRange)
          })
          recommendedMaximizeNutrients = recommendation.maxim_main_nutr
            .map(key => RECOMMENDER_MAXIMIZE_KEYS[key] ?? key)
            .filter(key => RECIPE_MAXIMIZE_OPTIONS.some(option => option.key === key))
          const predicted = recommendation.nutrients_ranges
          setForm(current => ({
            ...current,
            nutrientRanges: {
              ...current.nutrientRanges,
              moisture: predicted.moisture_per == null
                ? current.nutrientRanges.moisture
                : predicted.moisture_per,
              protein: predicted.protein_per == null
                ? current.nutrientRanges.protein
                : predicted.protein_per,
              carbs: predicted.carbohydrate_per == null
                ? current.nutrientRanges.carbs
                : predicted.carbohydrate_per,
              fat: predicted.fats_per == null
                ? current.nutrientRanges.fat
                : predicted.fats_per,
            },
          }))
          if (recommendedIngredients.length === 0) {
            recommendationWarning = 'Калорийность рассчитана. Подходящие рекомендованные ингредиенты не найдены в каталоге, поэтому текущий состав не изменён.'
          }
        } catch (recommendationError) {
          recommendationWarning = recommendationError instanceof Error
            ? `Калорийность рассчитана. ${recommendationError.message}`
            : 'Калорийность рассчитана. Для выбранного состояния нет персональных рекомендаций.'
        }
      }

      setForm(current => {
        const ingredientIds = recommendedIngredients.length > 0
          ? recommendedIngredients.map(item => item.id)
          : current.ingredientIds
        const ranges = { ...current.ingredientRanges }
        recommendedIngredients.forEach(item => {
          ranges[item.id] = recommendedIngredientRanges.get(item.id)
            ?? ingredientDefaultRange(item.category)
        })
        return {
          ...current,
          energy: String(targetKcal),
          ageCategory: calorieResult.age_category === 'puppy'
            ? 'puppies'
            : calorieResult.age_category === 'senior' ? 'senior' : 'adults',
          breedSize: calorieResult.size_category === 'small'
            ? 'small'
            : calorieResult.size_category === 'medium' ? 'medium' : 'large',
          ingredientIds,
          ingredientRanges: ranges,
          maximizeNutrients: recommendedMaximizeNutrients.length > 0
            ? recommendedMaximizeNutrients
            : current.maximizeNutrients,
        }
      })
      setNotice(recommendationWarning)
      markDirty(true)
      requestAnimationFrame(showOptimization)
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Не удалось обновить рекомендации')
    } finally {
      setUpdatingRecommendations(false)
    }
  }

  const handleCalculate = async () => {
    if (calculating || updatingRecommendations) return
    if (!form.name.trim()) {
      setError(t('recipes.nameRequired'))
      return
    }
    const inputRevision = calculationInputRevision.current
    setCalculating(true)
    setError('')
    try {
      const dog = buildDogInfo(form, references)
      const targetKcal = Number(form.energy)
      if (!Number.isFinite(targetKcal) || targetKcal <= 0) {
        throw new Error('Укажите целевую энергию')
      }
      const selectedIngredients = form.ingredientIds.map(ingredientId => {
        const ingredient = references.ingredients.find(item => item.id === ingredientId)
        if (!ingredient) throw new Error(`Ингредиент ${ingredientId} не найден`)
        return ingredient
      })
      if (selectedIngredients.length === 0) {
        throw new Error('Выберите хотя бы один ингредиент')
      }
      const unsupportedIngredients = selectedIngredients.filter(
        ingredient => !ingredient.recommenderSupported,
      )
      if (unsupportedIngredients.length > 0) {
        const names = unsupportedIngredients
          .slice(0, 3)
          .map(toRecommenderIngredientName)
          .join('», «')
        const remaining = unsupportedIngredients.length - 3
        throw new Error(
          `Алгоритм пока не поддерживает ${unsupportedIngredients.length === 1 ? 'ингредиент' : 'ингредиенты'} «${names}»`
          + (remaining > 0 ? ` и ещё ${remaining}` : '')
          + `. Уберите ${unsupportedIngredients.length === 1 ? 'его' : 'их'} из состава или выберите ингредиенты из штатного каталога.`,
        )
      }

      const norms = Object.keys(nutrientNorms).length > 0
        ? nutrientNorms
        : (await recommenderService.calculateNutrients(dog, targetKcal)).norms
      setNutrientNorms(norms)

      const optimized = await recommenderService.optimizeRecipe({
        weight: dog.weight,
        age: dog.age,
        age_metric: dog.age_metric,
        breed: dog.breed,
        reproductive_status: dog.reproductive_status,
        excluded_ingredients: excludedIngredients,
        ingredients: selectedIngredients.map(toRecommenderIngredientName),
        ingredient_ranges: selectedIngredients.map(ingredient => {
          const range = form.ingredientRanges[ingredient.id] ?? { min: 0, max: 100 }
          return {
            ingredient: toRecommenderIngredientName(ingredient),
            min_percent: range.min,
            max_percent: range.max,
          }
        }),
        nutrient_ranges: Object.entries(form.nutrientRanges).map(([key, range]) => ({
          nutrient: RECOMMENDER_NUTRIENT_NAMES[key] ?? key,
          min_value: range.min,
          max_value: range.max,
        })),
        maximize_nutrients: form.maximizeNutrients
          .map(key => RECOMMENDER_NUTRIENT_NAMES[key])
          .filter((value): value is string => Boolean(value)),
        target_kcal: targetKcal,
        ingredient_profiles: selectedIngredients
          .filter(ingredient => !ingredient.system)
          .map(toRecommenderIngredientProfile),
      })
      if (!optimized.success) throw new Error('Алгоритм не смог подобрать состав')
      if (inputRevision !== calculationInputRevision.current) {
        setError(t('recipes.calculationInputsChanged'))
        return
      }

      setCalculationResult(
        toCalculationResult(optimized, norms, references.ingredients, targetKcal),
      )
      setCalculationVersion('recommender-1.0.0')
      markDirty(true)
      requestAnimationFrame(() => {
        document.getElementById('recipe-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    } catch (errorValue) {
      setError(calculationErrorMessage(errorValue))
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.card}>{t('common.loading')}</div></div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => void goBack()}>
          ‹ {t('common.back')}
        </button>
        <h1 className={styles.headerTitle}>
          {isEdit && !locationState?.autosavedDraft
            ? t('recipes.editTitle')
            : t('recipes.createTitle')}
        </h1>
        <div className={styles.headerActions}>
          <div
            className={`${styles.autosaveStatus} ${
              autosaveStatus === 'failed' ? styles.autosaveStatusFailed : ''
            }`}
            role="status"
            aria-live="polite"
          >
            {autosaveStatus === 'saving' && t('recipes.autosaveSaving')}
            {autosaveStatus === 'saved' && (
              calculationResult
                ? t('recipes.autosaveRecipeSaved')
                : t('recipes.autosaveDraftSaved')
            )}
            {autosaveStatus === 'pristine' && t('recipes.autosaveHint')}
            {autosaveStatus === 'failed' && (
              <>
                <span>{autosaveError}</span>
                <button
                  type="button"
                  className={styles.autosaveRetry}
                  onClick={() => {
                    suppressRouteReplacementRef.current = false
                    void flushAutosave()
                  }}
                >
                  {t('recipes.autosaveRetry')}
                </button>
              </>
            )}
          </div>
          {(!isEdit || locationState?.autosavedDraft || persistedStatus === 'draft') && (
            <button className={styles.deleteBtn} onClick={() => void handleDelete()}>
              <DeleteIcon width="14" height="14" className="no-filter" />
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorToast} role="alert" aria-live="assertive">
          <div>
            <p className={styles.errorToastTitle}>Не удалось выполнить действие</p>
            <p className={styles.errorToastMessage}>{error}</p>
          </div>
          <button
            type="button"
            className={styles.errorToastClose}
            aria-label="Закрыть уведомление"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className={`${styles.errorToast} ${styles.noticeToast}`} role="status" aria-live="polite">
          <div>
            <p className={styles.errorToastTitle}>Рекомендации обновлены</p>
            <p className={styles.errorToastMessage}>{notice}</p>
          </div>
          <button
            type="button"
            className={styles.errorToastClose}
            aria-label="Закрыть уведомление"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}

      <>
          <div className={styles.card}>
            <p className={styles.sectionTitle}>{t('recipes.parameters')}</p>
            <div className={styles.petSelectorPanel}>
              <div className={styles.petSelectorCopy}>
                <label className={styles.fieldLabel}>{t('recipes.petSelectorLabel')}</label>
              </div>
              <SearchablePetSelect
                options={pets.map(pet => ({
                  id: pet.id,
                  name: pet.name,
                  breedName: pet.breedName,
                }))}
                value={form.petId}
                loading={loadingPets}
                selecting={selectingPet}
                placeholder={t('recipes.petSelectorPlaceholder')}
                searchPlaceholder={t('recipes.petSearchPlaceholder')}
                noSelectionLabel={t('recipes.petNoSelection')}
                emptyLabel={t('recipes.petSearchEmpty')}
                loadingLabel={t('recipes.petLoading')}
                selectingLabel={t('recipes.petApplying')}
                onChange={petId => void handlePetChange(petId)}
              />
            </div>
            <div className={styles.formGrid2}>
              <div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{t('recipes.name')}</label>
                  <input
                    className={styles.fieldInput}
                    placeholder={t('recipes.namePlaceholder')}
                    value={form.name}
                    onChange={event => setField('name', event.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
                  <label className={styles.fieldLabel}>{t('recipes.description')}</label>
                  <textarea
                    className={styles.fieldTextarea}
                    placeholder={t('recipes.descriptionPlaceholder')}
                    value={form.description}
                    onChange={event => setField('description', event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formColumn}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Возраст</label>
                  <select
                    className={styles.fieldSelect}
                    value={form.ageCategory}
                    onChange={event => setField('ageCategory', event.target.value as RecipeAgeCategory)}
                  >
                    {Object.entries(RECIPE_AGE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Размер породы</label>
                  <select
                    className={styles.fieldSelect}
                    value={form.breedSize}
                    onChange={event => setField('breedSize', event.target.value as RecipeBreedSize)}
                  >
                    {Object.entries(RECIPE_BREED_SIZE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.sectionTitle}>Параметры собаки</p>
            <div className={styles.formGrid2}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Вес (кг)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className={styles.fieldInput}
                  value={form.weight}
                  onChange={event => setCalculationField('weight', event.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Порода</label>
                <select
                  className={styles.fieldSelect}
                  value={form.breedId}
                  onChange={event => setCalculationField('breedId', event.target.value)}
                >
                  <option value="">Не указана</option>
                  {references.breeds.map(item => (
                    <option key={item.id} value={item.id}>{displayName(item)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Возраст (месяцев)</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  step="1"
                  className={styles.fieldInput}
                  value={form.ageMonths}
                  onChange={event => setCalculationField('ageMonths', event.target.value)}
                  placeholder="Например, 18"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Уровень активности</label>
                <select
                  className={styles.fieldSelect}
                  value={form.activityId}
                  onChange={event => setCalculationField('activityId', event.target.value)}
                >
                  <option value="">Не указан</option>
                  {references.activities.map(item => (
                    <option key={item.id} value={item.id}>{displayName(item)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Пол</label>
                <select
                  className={styles.fieldSelect}
                  value={form.gender}
                  onChange={event => {
                    invalidateCalculation()
                    setForm(current => ({
                      ...current,
                      gender: event.target.value as RecipeGender,
                      reproductiveStatusId: '',
                    }))
                    markDirty()
                  }}
                >
                  <option value="male">Самец</option>
                  <option value="female">Самка</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{t('recipes.reproductiveStatus')}</label>
                <select
                  className={styles.fieldSelect}
                  value={form.reproductiveStatusId}
                  onChange={event => setCalculationField('reproductiveStatusId', event.target.value)}
                >
                  <option value="">Не указан</option>
                  {compatibleStatuses.map(item => (
                    <option key={item.id} value={item.id}>{displayName(item)}</option>
                  ))}
                </select>
              </div>
              {selectedReproductiveStatus === 'pregnancy' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>{t('recipes.pregnancyPeriod')}</label>
                  <select
                    className={styles.fieldSelect}
                    value={form.pregnancyPeriod}
                    onChange={event => setCalculationField(
                      'pregnancyPeriod',
                      event.target.value as PregnancyPeriod,
                    )}
                  >
                    <option value="early_4_weeks">{t('recipes.pregnancyEarly')}</option>
                    <option value="last_5_weeks">{t('recipes.pregnancyLate')}</option>
                  </select>
                </div>
              )}
              {selectedReproductiveStatus === 'lactation' && (
                <>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>{t('recipes.lactationWeek')}</label>
                    <select
                      className={styles.fieldSelect}
                      value={form.lactationWeek}
                      onChange={event => setCalculationField(
                        'lactationWeek',
                        event.target.value as LactationWeek,
                      )}
                    >
                      {([1, 2, 3, 4] as const).map(week => (
                        <option key={week} value={`week_${week}`}>
                          {t('recipes.lactationWeekNumber', { week })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>{t('recipes.puppyCount')}</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={styles.fieldInput}
                      value={form.puppyCount}
                      onChange={event => {
                        const value = event.target.value
                        setCalculationField(
                          'puppyCount',
                          value === '' ? '' : String(Math.max(1, Math.floor(Number(value) || 1))),
                        )
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <p className={styles.sectionTitle}>Состояние здоровья</p>
            <div className={styles.symptomsRow}>
              <div className={styles.symptomsLeft}>
                <div className={styles.fieldGroup} style={{ marginBottom: 16 }}>
                  <label className={styles.fieldLabel}>Наличие заболевания</label>
                  <select
                    className={styles.fieldSelect}
                    value={form.targetDisorder}
                    disabled={loadingDisorders || !form.breedId}
                    onChange={event => {
                      const disorder = event.target.value
                      const matchingCondition = references.healthConditions.find(
                        item => normalizeLabel(displayName(item)) === normalizeLabel(disorder),
                      )
                      invalidateCalculation()
                      setForm(current => ({
                        ...current,
                        targetDisorder: disorder,
                        healthConditionId: matchingCondition == null ? '' : String(matchingCondition.id),
                      }))
                      markDirty()
                      if (disorder) void handleUpdateRecommendations(disorder)
                    }}
                  >
                    <option value="">
                      {loadingDisorders ? 'Загрузка заболеваний...' : 'Не указано'}
                    </option>
                    {form.targetDisorder && !availableDisorders.includes(form.targetDisorder) && (
                      <option value={form.targetDisorder}>{form.targetDisorder}</option>
                    )}
                    {availableDisorders.map(disorder => (
                      <option key={disorder} value={disorder}>{disorder}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Симптомы заболевания</label>
                  <select
                    className={styles.fieldSelect}
                    value=""
                    onChange={event => {
                      if (event.target.value) toggleSymptom(Number(event.target.value))
                    }}
                  >
                    <option value="">Найдите симптомы</option>
                    {references.symptoms
                      .filter(item => !form.symptomIds.includes(item.id))
                      .map(item => (
                        <option key={item.id} value={item.id}>{displayName(item)}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className={styles.symptomsRight}>
                <p className={styles.symptomsLabel}>Выбранные симптомы</p>
                <div className={styles.chipsRow}>
                  {form.symptomIds.map(symptomId => {
                    const symptom = references.symptoms.find(item => item.id === symptomId)
                    return (
                      <span key={symptomId} className={styles.chip}>
                        {symptom ? displayName(symptom) : `ID ${symptomId}`}
                        <button className={styles.chipRemove} onClick={() => toggleSymptom(symptomId)}>×</button>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <button
            className={styles.updateRecommendationsBtn}
            disabled={updatingRecommendations || calculating}
            onClick={() => void handleUpdateRecommendations()}
          >
            {updatingRecommendations
              ? t('recipes.recommendationsUpdating')
              : t('recipes.updateRecommendations')}
          </button>
      </>

      <div id="recipe-optimization" className={styles.card}>
          <div className={styles.energyRow}>
            <div className={styles.energyControls}>
              <p className={styles.energyTitle}>Целевая энергия (ккал)</p>
              <input
                className={styles.energyInput}
                type="number"
                min="0.1"
                value={form.energy}
                onChange={event => setCalculationField('energy', event.target.value)}
              />
              <span className={styles.energyHint}>
                Рекомендуемая: {recommendedEnergy ?? '—'} ккал
              </span>
            </div>
            <CalorieFormula calculation={calorieCalculation} />
          </div>

          <p className={styles.sectionTitle}>Выбор ингредиентов</p>
          <div className={styles.twoPanel}>
            <div className={styles.accordionList}>
              {ingredientGroups.map(group => (
                <div key={group.category} className={styles.accordionItem}>
                  <button
                    className={styles.accordionHeader}
                    onClick={() => {
                      setOpenCategories(current => {
                        const next = new Set(current)
                        if (next.has(group.category)) {
                          next.delete(group.category)
                        } else {
                          next.add(group.category)
                        }
                        return next
                      })
                    }}
                  >
                    <span className={styles.accordionChevron}>
                      {openCategories.has(group.category) ? '▼' : '›'}
                    </span>
                    {group.category}
                  </button>
                  {openCategories.has(group.category) && (
                    <div className={styles.accordionBody}>
                      {group.ingredients.map(ingredient => (
                        <button
                          key={ingredient.id}
                          
                          className={`${styles.ingredientTag} ${
                            isContraindicatedIngredient(ingredient, excludedIngredients)
                              ? styles.ingredientTagContraindicated
                              : ''
                          } ${
                            form.ingredientIds.includes(ingredient.id) ||
                                isContraindicatedIngredient(ingredient, excludedIngredients)
                                ? styles.ingredientTagActive : ''
                          }`}
                          onClick={() => toggleIngredient(ingredient.id)}
                        >
                          {ingredientDisplayName(ingredient)}
                          {form.ingredientIds.includes(ingredient.id) && ' ×'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.selectedBox}>
              <p className={styles.selectedTitle}>Выбранные ингредиенты</p>
              <div className={styles.selectedItems}>
                {form.ingredientIds.map(ingredientId => {
                  const ingredient = references.ingredients.find(item => item.id === ingredientId)
                  return (
                    <span
                      key={ingredientId}
                      className={`${styles.selectedChip} ${ingredient && isContraindicatedIngredient(ingredient, excludedIngredients) ? styles.selectedChipContraindicated : ''}`}
                    >
                      {ingredient ? ingredientDisplayName(ingredient) : `ID ${ingredientId}`}
                      <button className={styles.selectedChipRemove} onClick={() => toggleIngredient(ingredientId)}>×</button>
                    </span>
                  )
                })}
              </div>
              {form.ingredientIds.length > 0 && (
                <button className={styles.clearAllBtn} onClick={() => setCalculationField('ingredientIds', [])}>
                  Очистить все
                </button>
              )}
              {form.ingredientIds.some(ingredientId => {
                const ingredient = references.ingredients.find(item => item.id === ingredientId)
                return ingredient != null && isContraindicatedIngredient(ingredient, excludedIngredients)
              }) && (
                <p className={styles.contraindicatedIngredientWarning}>В списке есть противопоказанный ингредиент. Пожалуйста, будьте осторожны.</p>
              )}

            </div>
          </div>

          {form.ingredientIds.length > 0 && (
            <>
              <p className={styles.sectionTitle}>Ограничения по количеству ингредиентов (в % от 100 г):</p>
              {form.ingredientIds.map(ingredientId => {
                const ingredient = references.ingredients.find(item => item.id === ingredientId)
                const range = form.ingredientRanges[ingredientId] ?? { min: 0, max: 100 }
                return (
                  <DualRangeSlider
                    key={ingredientId}
                    label={`${ingredient ? ingredientDisplayName(ingredient) : `ID ${ingredientId}`}:`}
                    minValue={range.min}
                    maxValue={range.max}
                    onChange={value => updateIngredientRange(ingredientId, value)}
                  />
                )
              })}
            </>
          )}

          <p className={styles.sectionTitle} style={{ marginTop: 20 }}>
            {t('recipes.nutrientConstraintsPer100')}
          </p>
          {RECIPE_NUTRIENT_LIMITS.map(item => {
            const range = form.nutrientRanges[item.key]
            return (
              <DualRangeSlider
                key={item.key}
                label={`${item.label}:`}
                minValue={range.min}
                maxValue={range.max}
                lowerBound={item.min}
                upperBound={item.max}
                onChange={value => updateNutrientRange(item.key, value)}
              />
            )
          })}

          <p className={styles.sectionTitle} style={{ marginTop: 20 }}>Максимизация</p>
          <p className={styles.fieldHint}>Выберите нутриенты для максимизации:</p>
          <SearchableNutrientSelect
            options={RECIPE_MAXIMIZE_OPTIONS}
            value={form.maximizeNutrients}
            onChange={value => setCalculationField('maximizeNutrients', value)}
          />

          <div className={styles.recipeActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={calculating || updatingRecommendations}
              onClick={() => void handleCalculate()}
            >
              {calculating ? t('recipes.calculating') : t('recipes.calculateComposition')}
            </button>
          </div>
      </div>

      {calculationResult && (
        <EditCalculationResult 
          result={calculationResult}
          activeDigestionTab={activeDigestionTab}
          onDigestionTabChange={setActiveDigestionTab}
          ingredients={ingredients}
        />
      )}
    </div>
  )
}
