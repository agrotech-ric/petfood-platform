import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ingredientService, type Ingredient } from '../../../services/ingredientService'
import { petService, type HealthRecord, type PetProfileData } from '../../../services/petService'
import {
  recipeService,
  type Recipe,
  type RecipeAgeCategory,
  type RecipeBreedSize,
  type RecipeCalculationResult,
  type RecipeFormat,
  type RecipeGender,
  type RecipePayload,
  type RecipeType,
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
  RECIPE_TYPE_LABELS,
} from '../../data/recipeOptions'
import DeleteIcon from '../../assets/icons/delete.svg?react'
import styles from '../../styles/CreateRecipe.module.css'

type Range = { min: number; max: number }

type FormState = {
  petId: string | null
  name: string
  description: string
  type: RecipeType
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
  symptomIds: number[]
  energy: string
  ingredientIds: number[]
  ingredientRanges: Record<number, Range>
  nutrientRanges: Record<string, Range>
  maximizeNutrient: string
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
    type: 'domestic',
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
    maximizeNutrient: '',
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
    type: recipe.type,
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
    maximizeNutrient: recipe.maximizeNutrient ?? '',
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
    type: state.type,
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
    symptomIds: state.symptomIds,
    targetEnergyKcal: toOptionalNumber(state.energy),
    maximizeNutrient: state.maximizeNutrient || null,
    ingredients: state.ingredientIds.map(ingredientId => ({
      ingredientId,
      minPercent: state.ingredientRanges[ingredientId]?.min ?? 0,
      maxPercent: state.ingredientRanges[ingredientId]?.max ?? 100,
    })),
    nutrientConstraints: Object.entries(state.nutrientRanges).map(([nutrientKey, range]) => ({
      nutrientKey,
      minValue: range.min,
      maxValue: range.max,
    })),
    calculationResult,
    calculationVersion,
  }
}

function formatRangeBackground(min: number, max: number, lower: number, upper: number) {
  const start = ((min - lower) / (upper - lower)) * 100
  const end = ((max - lower) / (upper - lower)) * 100
  return `linear-gradient(90deg, var(--color-border) 0%, var(--color-border) ${start}%, var(--color-accent-alt) ${start}%, var(--color-accent-alt) ${end}%, var(--color-border) ${end}%, var(--color-border) 100%)`
}

const RESULT_COLORS = ['#4a90d9', '#70d35b', '#ef4d3c', '#f4c44e', '#8b6fc0']

function ResultDonut({ data }: { data: Array<{ value: number; color: string }> }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0)
  let offset = 0

  if (total <= 0) return null

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
      {data.map((item, index) => {
        const dash = (Math.max(item.value, 0) / total) * circumference
        const currentOffset = offset
        offset += dash
        return (
          <circle
            key={index}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth="28"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-currentOffset + circumference * 0.25}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
          />
        )
      })}
    </svg>
  )
}

function ResultBar({
  label,
  percent,
  blue,
}: {
  label: string
  percent: number
  blue?: boolean
}) {
  return (
    <div className={styles.barItem}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${blue ? styles.barFillBlue : styles.barFillOrange}`}
          style={{ width: `${Math.min(Math.max(percent, 0), 150) / 1.5}%` }}
        />
        <span className={styles.normLine} />
      </div>
      <span className={styles.barPercent}>{percent}%</span>
    </div>
  )
}

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
              <ResultDonut data={composition.map((item, index) => ({
                value: item.percent,
                color: item.color ?? RESULT_COLORS[index % RESULT_COLORS.length],
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
              <ResultDonut data={nutrition.map((item, index) => ({
                value: item.value,
                color: item.color ?? RESULT_COLORS[index % RESULT_COLORS.length],
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
                <div>
                  <p className={styles.barChartTitle}>Минералы</p>
                  <div className={styles.normHeader}>Норма</div>
                  {minerals.map((item, index) => (
                    <ResultBar
                      key={`${item.key ?? item.label}-${index}`}
                      label={item.label}
                      percent={item.percent}
                    />
                  ))}
                  <p className={styles.barAxisLabel}>Процентное соотношение с нормой (%)</p>
                </div>
              )}
              {vitamins.length > 0 && (
                <div>
                  <p className={styles.barChartTitle}>Витамины</p>
                  <div className={styles.normHeader}>Норма</div>
                  {vitamins.map((item, index) => (
                    <ResultBar
                      key={`${item.key ?? item.label}-${index}`}
                      label={item.label}
                      percent={item.percent}
                      blue
                    />
                  ))}
                  <p className={styles.barAxisLabel}>Процентное соотношение с нормой (%)</p>
                </div>
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
  const [error, setError] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [calculationResult, setCalculationResult] = useState<RecipeCalculationResult | null>(null)
  const [calculationVersion, setCalculationVersion] = useState<string | null>(null)

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

  const ingredientGroups = useMemo(() => {
    const groups = new Map<string, Ingredient[]>()
    references.ingredients.forEach(ingredient => {
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
  }

  const showOptimization = () => {
    document.getElementById('recipe-optimization')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const showSavedResult = () => {
    if (!calculationResult) {
      setError('Сохранённый результат расчёта отсутствует')
      return
    }
    setError('')
    document.getElementById('recipe-result')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
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

      {error && <div className={styles.formError}>{error}</div>}

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
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Тип корма</label>
                  <div className={styles.radioGroup}>
                    {(Object.entries(RECIPE_TYPE_LABELS) as [RecipeType, string][]).map(([value, label]) => (
                      <label key={value} className={styles.radioLabel}>
                        <input
                          type="radio"
                          className={styles.radioInput}
                          name="recipeType"
                          checked={form.type === value}
                          onChange={() => setField('type', value)}
                        />
                        {label.toLowerCase()}
                      </label>
                    ))}
                  </div>
                </div>
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
                <label className={styles.fieldLabel}>Возраст</label>
                <select
                  className={styles.fieldSelect}
                  value={form.ageMonths}
                  onChange={event => setField('ageMonths', event.target.value)}
                >
                  <option value="">Не указан</option>
                  <option value="3">3 месяца</option>
                  <option value="6">6 месяцев</option>
                  <option value="12">1 год</option>
                  <option value="24">2 года</option>
                  <option value="36">3 года</option>
                  <option value="60">5 лет</option>
                  <option value="84">7 лет</option>
                  <option value="120">10 лет</option>
                </select>
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
                    value={form.healthConditionId}
                    onChange={event => setField('healthConditionId', event.target.value)}
                  >
                    <option value="">Не указано</option>
                    {references.healthConditions.map(item => (
                      <option key={item.id} value={item.id}>{displayName(item)}</option>
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
              <button className={styles.primaryBtn} onClick={handleContinue}>
                Продолжить
              </button>
            )}
          </div>
          {isEdit && (
            <button className={styles.updateRecommendationsBtn} onClick={showOptimization}>
              Обновить рекомендации
            </button>
          )}
        </>
      )}

      {(isEdit || step === 2) && (
        <div id="recipe-optimization" className={styles.card}>
          <p className={styles.sectionTitle}>Целевая энергия (ккал)</p>
          <div className={styles.energyRow}>
            <input
              className={styles.energyInput}
              type="number"
              min="0.1"
              value={form.energy}
              onChange={event => setField('energy', event.target.value)}
            />
            <span className={styles.energyHint}>
              Рекомендуемая: {form.energy || '—'} ккал
            </span>
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
                  <div key={ingredientId} className={styles.sliderRow}>
                    <span className={styles.sliderLabel}>{ingredient?.name ?? `ID ${ingredientId}`}:</span>
                    <span className={styles.sliderMinVal}>{range.min}</span>
                    <div
                      className={styles.dualRangeTrack}
                      style={{ background: formatRangeBackground(range.min, range.max, 0, 100) }}
                    >
                      <input
                        type="range"
                        className={`${styles.dualRangeInput} ${styles.dualRangeMin}`}
                        min={0}
                        max={100}
                        value={range.min}
                        onChange={event => updateIngredientRange(ingredientId, {
                          min: Math.min(Number(event.target.value), range.max),
                          max: range.max,
                        })}
                      />
                      <input
                        type="range"
                        className={`${styles.dualRangeInput} ${styles.dualRangeMax}`}
                        min={0}
                        max={100}
                        value={range.max}
                        onChange={event => updateIngredientRange(ingredientId, {
                          min: range.min,
                          max: Math.max(Number(event.target.value), range.min),
                        })}
                      />
                    </div>
                    <span className={styles.sliderMaxVal}>{range.max}</span>
                  </div>
                )
              })}
            </>
          )}

          <p className={styles.sectionTitle} style={{ marginTop: 20 }}>Ограничения по нутриентам:</p>
          {RECIPE_NUTRIENT_LIMITS.map(item => {
            const range = form.nutrientRanges[item.key]
            return (
              <div key={item.key} className={styles.sliderRow}>
                <span className={styles.sliderLabel}>{item.label}:</span>
                <span className={styles.sliderMinVal}>{range.min}</span>
                <div
                  className={styles.dualRangeTrack}
                  style={{ background: formatRangeBackground(range.min, range.max, item.min, item.max) }}
                >
                  <input
                    type="range"
                    className={`${styles.dualRangeInput} ${styles.dualRangeMin}`}
                    min={item.min}
                    max={item.max}
                    step={0.01}
                    value={range.min}
                    onChange={event => updateNutrientRange(item.key, {
                      min: Math.min(Number(event.target.value), range.max),
                      max: range.max,
                    })}
                  />
                  <input
                    type="range"
                    className={`${styles.dualRangeInput} ${styles.dualRangeMax}`}
                    min={item.min}
                    max={item.max}
                    step={0.01}
                    value={range.max}
                    onChange={event => updateNutrientRange(item.key, {
                      min: range.min,
                      max: Math.max(Number(event.target.value), range.min),
                    })}
                  />
                </div>
                <span className={styles.sliderMaxVal}>{range.max}</span>
              </div>
            )
          })}

          <p className={styles.sectionTitle} style={{ marginTop: 20 }}>Максимизация</p>
          <p className={styles.fieldHint}>Выберите нутриент для максимизации:</p>
          <select
            className={styles.fieldSelect}
            value={form.maximizeNutrient}
            onChange={event => setField('maximizeNutrient', event.target.value)}
          >
            <option value="">Не выбрано</option>
            {RECIPE_MAXIMIZE_OPTIONS.map(item => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>

          <button
            className={styles.primaryBtn}
            style={{ marginTop: 24 }}
            disabled={saving}
            onClick={isEdit ? showSavedResult : () => void handleSave()}
          >
            {isEdit ? 'Рассчитать оптимальный состав' : saving ? 'Сохранение...' : 'Сохранить черновик'}
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
