import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ingredientService, type Ingredient } from '../../../services/ingredientService'
import { petService, type HealthRecord, type PetProfileData } from '../../../services/petService'
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
  type RecipeFormat,
  type RecipeGender,
  type RecipePayload,
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
  RECIPE_FORMAT_LABELS,
  RECIPE_MAXIMIZE_OPTIONS,
  RECIPE_NUTRIENT_LIMITS,
} from '../../data/recipeOptions'
import DeleteIcon from '../../assets/icons/delete.svg?react'
import { CalorieFormula } from './CalorieFormula'
import { NutrientBalanceChart } from './NutrientBalanceChart'
import { RecipeDonutChart, RECIPE_CHART_COLORS } from './RecipeDonutChart'
import { DualRangeSlider } from './DualRangeSlider'
import styles from '../../styles/CreateRecipe.module.css'

type Range = { min: number; max: number }

type FormState = {
  petId: string | null
  name: string
  description: string
  format: RecipeFormat
  ageCategory: RecipeAgeCategory
  breedSize: RecipeBreedSize
  weight: string
  breedId: string
  ageMonths: string
  gender: RecipeGender
  activityId: string
  reproductiveStatusId: string
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
    format: 'wet',
    ageCategory: 'adults',
    breedSize: 'all',
    weight: '',
    breedId: '',
    ageMonths: '',
    gender: 'male',
    activityId: '',
    reproductiveStatusId: '',
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
    maximizeNutrients: [],
  }
}

function displayName(item: RefItem) {
  return item.nameRu ?? item.name ?? item.nameEn ?? `ID ${item.id}`
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
    format: recipe.format,
    ageCategory: recipe.ageCategory,
    breedSize: recipe.breedSize,
    weight: recipe.targetWeightKg == null ? '' : String(recipe.targetWeightKg),
    breedId: recipe.targetBreedId == null ? '' : String(recipe.targetBreedId),
    ageMonths: recipe.targetAgeMonths == null ? '' : String(recipe.targetAgeMonths),
    gender: recipe.targetGender ?? 'male',
    activityId: recipe.targetActivityTypeId == null ? '' : String(recipe.targetActivityTypeId),
    reproductiveStatusId:
      recipe.targetReproductiveStatusId == null ? '' : String(recipe.targetReproductiveStatusId),
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
    healthConditionId:
      healthCondition == null ? current.healthConditionId : String(healthCondition.id),
    targetDisorder: record?.conditionName ?? current.targetDisorder,
    symptomIds: references.symptoms
      .filter(item => symptomNames.has(displayName(item).toLowerCase()))
      .map(item => item.id),
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
    request.pregnancy_period = status === 'pregnancy' ? 'none' : undefined
    request.lactation_week = status === 'lactation' ? 'none' : undefined
    request.num_puppies = 0
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
  }
}

function ingredientDefaultRange(category: string): Range {
  const value = category.toLowerCase()
  if (value.includes('мясо') || value.includes('яйца') || value.includes('молоч')) {
    return { min: 40, max: 60 }
  }
  if (value.includes('масло') || value.includes('жир')) return { min: 1, max: 10 }
  if (value.includes('круп')) return { min: 5, max: 35 }
  if (value.includes('овощ') || value.includes('фрукт')) return { min: 5, max: 25 }
  if (value.includes('вода')) return { min: 0, max: 30 }
  return { min: 1, max: 100 }
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
  petId?: string,
  calculationResult: RecipeCalculationResult | null = null,
  calculationVersion: string | null = null,
): RecipePayload {
  return {
    petId: petId ?? state.petId,
    name: state.name.trim(),
    description: state.description.trim() || null,
    format: state.format,
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

function EditCalculationResult({ result }: { result: RecipeCalculationResult }) {
  const composition = result.composition ?? []
  const nutrition = result.nutrition ?? []
  const nutrients = result.nutrients ?? []
  const minerals = result.minerals ?? []
  const vitamins = result.vitamins ?? []

  return (
    <div id="recipe-result" className={styles.editResult}>
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{result.calories ?? '—'} ккал</p>
          <p className={styles.metricLabel}>Энергетическая ценность</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{result.dailyNorm ?? '—'} г</p>
          <p className={styles.metricLabel}>Суточная норма корма</p>
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
                label: `${item.value} ${item.unit}`,
              }))} />
            </div>
            <div className={styles.donutLegend}>
              {nutrition.map((item, index) => (
                <div key={`${item.key ?? item.label}-${index}`} className={styles.donutLegendRow}>
                  <span
                    className={styles.legendDot}
                    style={{ background: item.color ?? RESULT_COLORS[index % RESULT_COLORS.length] }}
                  />
                  <span>{item.label} — {item.value} {item.unit}</span>
                </div>
              ))}
            </div>
            {result.nutritionPer100 && (
              <p className={styles.resultEnergy}>
                Энергетическая ценность: {result.nutritionPer100.calories} ккал
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
                    <span>{item.value} {item.unit}</span>
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
    </div>
  )
}

export function RecipeFormWizard({ recipeId }: { recipeId?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { from?: string; petId?: string; fromTab?: string } | null
  const origin = locationState?.from
  const originPetId = locationState?.petId
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<FormState>(createInitialState)
  const [references, setReferences] = useState<References>(EMPTY_REFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingRecommendations, setUpdatingRecommendations] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [calculationResult, setCalculationResult] = useState<RecipeCalculationResult | null>(null)
  const [calculationVersion, setCalculationVersion] = useState<string | null>(null)
  const [nutrientNorms, setNutrientNorms] = useState<Record<string, number>>({})
  const [recommendedEnergy, setRecommendedEnergy] = useState<number | null>(null)
  const [calorieCalculation, setCalorieCalculation] = useState<CalorieCalculation | null>(null)
  const [availableDisorders, setAvailableDisorders] = useState<string[]>([])
  const [loadingDisorders, setLoadingDisorders] = useState(false)

  const isEdit = recipeId != null

  useEffect(() => {
    let cancelled = false
    const safe = <T,>(request: Promise<T[]>) => request.catch(() => [] as T[])

    const load = async () => {
      setLoading(true)
      setError('')
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

        let next = recipe ? stateFromRecipe(recipe) : createInitialState()
        if (!recipe && pet) next = prefillFromPet(next, pet, records, loadedReferences)
        setForm(next)
        setRecommendedEnergy(recipe?.targetEnergyKcal ?? null)
        setCalculationResult(recipe?.calculationResult ?? null)
        setCalculationVersion(recipe?.calculationVersion ?? null)
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

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const toggleSymptom = (symptomId: number) => {
    setField(
      'symptomIds',
      form.symptomIds.includes(symptomId)
        ? form.symptomIds.filter(id => id !== symptomId)
        : [...form.symptomIds, symptomId],
    )
  }

  const toggleIngredient = (ingredientId: number) => {
    if (form.ingredientIds.includes(ingredientId)) {
      setField('ingredientIds', form.ingredientIds.filter(id => id !== ingredientId))
      return
    }
    setForm(current => ({
      ...current,
      ingredientIds: [...current.ingredientIds, ingredientId],
      ingredientRanges: {
        ...current.ingredientRanges,
        [ingredientId]: current.ingredientRanges[ingredientId] ?? { min: 0, max: 100 },
      },
    }))
  }

  const updateIngredientRange = (ingredientId: number, range: Range) => {
    setField('ingredientRanges', { ...form.ingredientRanges, [ingredientId]: range })
  }

  const updateNutrientRange = (key: string, range: Range) => {
    setField('nutrientRanges', { ...form.nutrientRanges, [key]: range })
  }

  const goBack = () => {
    if (!isEdit && step === 2) {
      setStep(1)
      return
    }
    if (origin === 'pet-profile' && originPetId) {
      navigate(`/pet-profile/${originPetId}`, { state: { tab: locationState?.fromTab ?? 'food' } })
    } else if (isEdit) {
      navigate(`/recipes/${recipeId}`)
    } else {
      navigate('/recipes')
    }
  }

  const handleContinue = () => {
    if (!form.name.trim()) {
      setError('Укажите название корма')
      return
    }
    setError('')
    setStep(2)
    void handleUpdateRecommendations()
  }

  const showOptimization = () => {
    document.getElementById('recipe-optimization')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleUpdateRecommendations = async (disorderOverride?: string) => {
    if (updatingRecommendations || calculating) return
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
          })
          const recommendations = new Set(
            recommendation.recommended_ingredients.map(normalizeLabel),
          )
          recommendedIngredients = references.ingredients.filter(item =>
            item.recommenderSupported
            && recommendations.has(normalizeLabel(toRecommenderIngredientName(item)))
          )
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
          ranges[item.id] = ranges[item.id] ?? ingredientDefaultRange(item.category)
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
        }
      })
      setNotice(recommendationWarning)
      requestAnimationFrame(showOptimization)
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Не удалось обновить рекомендации')
    } finally {
      setUpdatingRecommendations(false)
    }
  }

  const handleCalculate = async () => {
    if (calculating || updatingRecommendations) return
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

      setCalculationResult(
        toCalculationResult(optimized, norms, references.ingredients, targetKcal),
      )
      setCalculationVersion('recommender-1.0.0')
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

  const handleSave = async () => {
    if (saving) return
    if (!form.name.trim()) {
      setError('Укажите название корма')
      setStep(1)
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = isEdit
        ? await recipeService.update(
            recipeId,
            toPayload(form, originPetId, calculationResult, calculationVersion),
          )
        : await recipeService.create(toPayload(form, originPetId))
      navigate(`/recipes/${saved.id}`, {
        state: origin === 'pet-profile'
          ? { from: origin, petId: originPetId, fromTab: locationState?.fromTab ?? 'food' }
          : undefined,
      })
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Не удалось сохранить рецепт')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.card}>Загрузка...</div></div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={goBack}>‹ Назад</button>
        <h1 className={styles.headerTitle}>
          {isEdit ? 'Редактирование корма' : 'Создание корма'}
        </h1>
        {isEdit ? (
          <div className={styles.headerActionPlaceholder} />
        ) : (
          <button className={styles.deleteBtn} onClick={goBack}>
            <DeleteIcon width="14" height="14" className="no-filter" />
            Удалить
          </button>
        )}
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

      {(isEdit || step === 1) && (
        <>
          <div className={styles.card}>
            <p className={styles.sectionTitle}>Параметры корма</p>
            <div className={styles.formGrid2}>
              <div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Название корма</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Введите название корма"
                    value={form.name}
                    onChange={event => setField('name', event.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
                  <label className={styles.fieldLabel}>Описание корма</label>
                  <textarea
                    className={styles.fieldTextarea}
                    placeholder="Введите описание продукта, его назначение"
                    value={form.description}
                    onChange={event => setField('description', event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formColumn}>
                {!isEdit && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Формат</label>
                    <select
                      className={styles.fieldSelect}
                      value={form.format}
                      onChange={event => setField('format', event.target.value as RecipeFormat)}
                    >
                      {Object.entries(RECIPE_FORMAT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                  onChange={event => setField('weight', event.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Порода</label>
                <select
                  className={styles.fieldSelect}
                  value={form.breedId}
                  onChange={event => setField('breedId', event.target.value)}
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
                  onChange={event => setField('ageMonths', event.target.value)}
                  placeholder="Например, 18"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Уровень активности</label>
                <select
                  className={styles.fieldSelect}
                  value={form.activityId}
                  onChange={event => setField('activityId', event.target.value)}
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
                    setForm(current => ({
                      ...current,
                      gender: event.target.value as RecipeGender,
                      reproductiveStatusId: '',
                    }))
                  }}
                >
                  <option value="male">Самец</option>
                  <option value="female">Самка</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Репродуктивный статус</label>
                <select
                  className={styles.fieldSelect}
                  value={form.reproductiveStatusId}
                  onChange={event => setField('reproductiveStatusId', event.target.value)}
                >
                  <option value="">Не указан</option>
                  {compatibleStatuses.map(item => (
                    <option key={item.id} value={item.id}>{displayName(item)}</option>
                  ))}
                </select>
              </div>
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
                      setForm(current => ({
                        ...current,
                        targetDisorder: disorder,
                        healthConditionId: matchingCondition == null ? '' : String(matchingCondition.id),
                      }))
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
            {!isEdit && (
              <button
                className={styles.primaryBtn}
                disabled={updatingRecommendations}
                onClick={handleContinue}
              >
                {updatingRecommendations ? 'Расчёт...' : 'Продолжить'}
              </button>
            )}
          </div>
          {isEdit && (
            <button
              className={styles.updateRecommendationsBtn}
              disabled={updatingRecommendations || calculating}
              onClick={() => void handleUpdateRecommendations()}
            >
              {updatingRecommendations ? 'Обновление...' : 'Обновить рекомендации'}
            </button>
          )}
        </>
      )}

      {(isEdit || step === 2) && (
        <div id="recipe-optimization" className={styles.card}>
          <div className={styles.energyRow}>
            <div className={styles.energyControls}>
              <p className={styles.energyTitle}>Целевая энергия (ккал)</p>
              <input
                className={styles.energyInput}
                type="number"
                min="0.1"
                value={form.energy}
                onChange={event => setField('energy', event.target.value)}
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
                        next.has(group.category) ? next.delete(group.category) : next.add(group.category)
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
                            form.ingredientIds.includes(ingredient.id) ? styles.ingredientTagActive : ''
                          }`}
                          onClick={() => toggleIngredient(ingredient.id)}
                        >
                          {ingredient.subtype
                            ? `${ingredient.name} — ${ingredient.subtype}`
                            : ingredient.name}
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
                    <span key={ingredientId} className={styles.selectedChip}>
                      {ingredient?.name ?? `ID ${ingredientId}`}
                      <button className={styles.selectedChipRemove} onClick={() => toggleIngredient(ingredientId)}>×</button>
                    </span>
                  )
                })}
              </div>
              {form.ingredientIds.length > 0 && (
                <button className={styles.clearAllBtn} onClick={() => setField('ingredientIds', [])}>
                  Очистить все
                </button>
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
                    label={`${ingredient?.name ?? `ID ${ingredientId}`}:`}
                    minValue={range.min}
                    maxValue={range.max}
                    onChange={value => updateIngredientRange(ingredientId, value)}
                  />
                )
              })}
            </>
          )}

          <p className={styles.sectionTitle} style={{ marginTop: 20 }}>Ограничения по нутриентам:</p>
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
          <div className={styles.maximizeOptions}>
            {RECIPE_MAXIMIZE_OPTIONS.map(item => (
              <label key={item.key} className={styles.maximizeOption}>
                <input
                  type="checkbox"
                  checked={form.maximizeNutrients.includes(item.key)}
                  onChange={() => setField(
                    'maximizeNutrients',
                    form.maximizeNutrients.includes(item.key)
                      ? form.maximizeNutrients.filter(key => key !== item.key)
                      : [...form.maximizeNutrients, item.key],
                  )}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <button
            className={styles.primaryBtn}
            style={{ marginTop: 24 }}
            disabled={saving || calculating || updatingRecommendations}
            onClick={isEdit ? () => void handleCalculate() : () => void handleSave()}
          >
            {isEdit
              ? calculating ? 'Расчёт...' : 'Рассчитать оптимальный состав'
              : saving ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
        </div>
      )}

      {isEdit && calculationResult && <EditCalculationResult result={calculationResult} />}

      {isEdit && (
        <button
          className={`${styles.primaryBtn} ${styles.finalSaveBtn}`}
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      )}
    </div>
  )
}
