import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from '../../context/LanguageContext'
import { ingredientService, type Ingredient } from '../../services/ingredientService'
import {
  recipeService,
  type Recipe,
  type RecipeCalculationResult,
} from '../../services/recipeService'
import {
  RECIPE_AGE_LABELS,
  RECIPE_BREED_SIZE_LABELS,
} from '../data/recipeOptions'
import styles from '../styles/RecipeProfile.module.css'
import DeleteIcon from '../assets/icons/delete.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'
import { NutrientBalanceChart } from '../components/recipes/NutrientBalanceChart'
import { ShareDialog } from '../components/sharing/ShareDialog'
import {
  RecipeDonutChart,
  RECIPE_CHART_COLORS,
} from '../components/recipes/RecipeDonutChart'

const CHART_COLORS = RECIPE_CHART_COLORS
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
                 <g key={index}>
                  <line x1={padLeft} y1={toY(value)} x2={width - padRight} y2={toY(value)} stroke="var(--color-border)" strokeWidth="1" />
                  <text x={padLeft - 4} y={toY(value) + 3} fontSize="12" fill="var(--color-text-muted)" textAnchor="end">{value.toFixed(2)}
                    </text></g>)}
      {data.map(item => 
           <text key={item.time} x={toX(item.time)} y={height - 25} fontSize="12" fill="var(--color-text-muted)" textAnchor="middle">
            {item.time}</text>)}
      {bandPoints && <polygon points={bandPoints} fill="var(--color-accent-alt)" fillOpacity="0.25" stroke="none" />}
      <polyline points={points} fill="none" stroke="var(--color-accent-alt)" strokeWidth="2" />
      <circle cx={toX(middle.time)} cy={toY(middle.remaining)} r={5} fill="var(--color-accent-alt)" />
      <text x={-3} y={height / 2 -10} fontSize="12" fill="var(--color-text-muted)" textAnchor="middle" transform={`rotate(-90, ${-3}, ${height / 2 - 10})`}>
      Остаток (г)</text>
      <text x={(width + padLeft) / 2} y={height - 8} fontSize="12" fill="var(--color-text-muted)" textAnchor="middle">
      Время (часы)</text>
    </svg>
  )
}
function formatAge(months?: number | null) {
  if (months == null) return 'Не указан'
  if (months < 12) return `${months} мес.`
  const years = Math.floor(months / 12)
  const remainder = months % 12
  return remainder ? `${years} г. ${remainder} мес.` : `${years} г.`
}

function formatPetId(petId: string) {
  return petId.split('-')[0].toUpperCase()
}

function compactReferenceName(value?: string | null) {
  return value?.replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Не указан'
}

function DraftComposition({ recipe }: { recipe: Recipe }) {
  return (
    <div className={styles.card}>
      <p className={styles.sectionTitle}>Состав рациона</p>
      {recipe.ingredients.length === 0 ? (
        <p className={styles.descriptionText}>Ингредиенты пока не выбраны</p>
      ) : (
        <table className={styles.compositionTable}>
          <thead>
            <tr>
              <th>Ингредиенты</th>
              <th>Минимум, %</th>
              <th>Максимум, %</th>
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.map(ingredient => (
              <tr key={ingredient.ingredientId}>
                <td>{ingredient.subtype ? `${ingredient.name}, ${ingredient.subtype}` : ingredient.name}</td>
                <td>{ingredient.minPercent}</td>
                <td>{ingredient.maxPercent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className={styles.calculationPending}>Расчёт состава ещё не выполнен</p>
    </div>
  )
}

function CalculationSections({
  result,
  activeTab,
  onTabChange,
  ingredients,
}: {
  result: RecipeCalculationResult
  activeTab: 'protein' | 'fat' | 'carbs'
  onTabChange: (tab: 'protein' | 'fat' | 'carbs') => void
  ingredients: Ingredient[]
}) {
  const { t } = useTranslation()
  const composition = result.composition ?? []
  const nutrition = result.nutrition ?? []
  const nutrients = result.nutrients ?? []
  const minerals = result.minerals ?? []
  const vitamins = result.vitamins ?? []
  const ingredientContributions = buildIngredientContributions(result, ingredients)
  const digestion = result.digestion
  const tabData = digestion ? {
    protein: {
      curve: digestion.protein ?? [],
      curve_min: digestion.protein_min ?? [],
      curve_max: digestion.protein_max ?? [],
      absorption: digestion.proteinAbsorption,
      forecast: digestion.proteinForecast ?? [],
    },
    fat: {
      curve: digestion.fat ?? [],
      curve_min: digestion.fat_min ?? [],
      curve_max: digestion.fat_max ?? [],
      absorption: digestion.fatAbsorption,
      forecast: digestion.fatForecast ?? [],
    },
    carbs: {
      curve: digestion.carbs ?? [],
      curve_min: digestion.carbs_min ?? [],
      curve_max: digestion.carbs_max ?? [],
      absorption: digestion.carbsAbsorption,
      forecast: digestion.carbsForecast ?? [],
    },
  } : null
  const current = tabData?.[activeTab]
  const forecastPercentClass = (percent: number) =>
    percent === 0 ? '' : percent < 50 ? styles.forecastPercentLow : styles.forecastPercentMid

  return (
    <>
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
          {composition.length > 0 && (
            <div className={`${styles.chartCard} ${styles.compositionChartCard}`}>
              <p className={styles.chartTitle}>Состав рациона</p>
              <div className={styles.donutWrapper}>
                <RecipeDonutChart data={composition.map((item, index) => ({
                  name: item.label,
                  value: item.percent,
                  color: item.color ?? CHART_COLORS[index % CHART_COLORS.length],
                  label: `${item.percent}%`,
                }))} />
              </div>
              <table className={styles.compositionTable}>
                <thead>
                  <tr>
                    <th>Ингредиенты</th>
                    <th>%</th>
                    <th>грамм</th>
                  </tr>
                </thead>
                <tbody>
                  {composition.map((item, index) => {
                    const color = item.color ?? CHART_COLORS[index % CHART_COLORS.length]
                    return (
                      <tr key={`${item.ingredientId ?? item.label}-${index}`}>
                        <td>
                          <span className={styles.compositionName}>
                            <span className={styles.compositionDot} style={{ background: color }} />
                            {item.label}
                          </span>
                        </td>
                        <td>{item.percent}%</td>
                        <td>{item.grams} г</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {nutrition.length > 0 && (
            <div className={`${styles.chartCard} ${styles.nutritionChartCard}`}>
              <p className={styles.chartTitle}>Питательная ценность</p>
              <div className={styles.donutWrapper}>
                <RecipeDonutChart data={nutrition.map((item, index) => ({
                  name: item.label,
                  value: item.value,
                  color: item.color ?? CHART_COLORS[index % CHART_COLORS.length],
                  label: `${item.value} ${t('recipes.unitPer100', { unit: item.unit })}`,
                }))} />
              </div>
              <p className={styles.nutritionLegendTitle}>{t('recipes.nutritionPer100')}</p>
              <div className={styles.donutLegend}>
                {nutrition.map((item, index) => (
                  <div key={`${item.key ?? item.label}-${index}`} className={styles.donutLegendRow}>
                    <span className={styles.legendName}>
                      <span
                        className={styles.legendDot}
                        style={{ background: item.color ?? CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {item.label}
                    </span>
                    <span>{item.value} {t('recipes.unitPer100', { unit: item.unit })}</span>
                  </div>
                ))}
              </div>
              {result.nutritionPer100 && (
                <div className={styles.nutritionSummary}>
                  {t('recipes.energyPer100Summary', { value: result.nutritionPer100.calories })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(ingredientContributions.length > 0) && (
        <div className={styles.ingredientContributions}>
          <p className={styles.sectionTitle}>Вклад ингредиентов в нутриенты</p>
          {ingredientContributions.map(item => (
            <div key={item.ingredientId} className={styles.ingredientContributionBlock}>
              <p className={styles.ingredientContributionName}>{item.name}</p>
              <p className={styles.ingredientContributionServing}>
                Суточная порция: {item.servingGrams.toFixed(2)} г
              </p>
              <div className={styles.ingredientContributionValues}>
                {item.values.map(value => (
                  <div key={value.key} className={styles.ingredientContributionValue}>
                    <span>{value.label}</span>
                    <span>{value.amount.toFixed(2)} {value.unit}</span>
                    <span>{value.percent.toFixed(1)}% от общего количества</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}


        <div className={`${styles.card} ${styles.nutrientsCard}`}>
          <p className={styles.sectionTitle}>Содержание нутриентов</p>
          {nutrients.length > 0 && (
            <div className={styles.nutrientsGrid}>
              {nutrients.map((item, index) => (
                <div key={`${item.key ?? item.label}-${index}`} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{item.label}</span>
                  <span className={styles.nutrientVal}>
                    {item.value} {t('recipes.unitPer100', { unit: item.unit })}
                  </span>
                </div>
              ))}
            </div>
          )}
          {(minerals.length > 0 || vitamins.length > 0) && (
            <div className={styles.balanceCharts}>
              {minerals.length > 0 && <NutrientBalanceChart title="Минералы" items={minerals} />}
              {vitamins.length > 0 && <NutrientBalanceChart title="Витамины" items={vitamins} />}
            </div>
          )}
        </div>
      )}

      {current && current.curve.length > 0 && (
        <div className={styles.digestionCard}>
          <p className={styles.digestionTitle}>Анализ переваривания</p>
          <p className={styles.digestionSubtitle}>Модель Михаэлиса-Ментен</p>
          <div className={styles.tabs}>
            {(['protein', 'fat', 'carbs'] as const).map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => onTabChange(tab)}
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
              <LineChart data={current.curve} lower={current.curve_min} upper={current.curve_max} />
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
        </div>
      )}
    </>
  )
}

export function RecipeProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, locale } = useTranslation()
  const recipeId = Number(id)
  const origin = (location.state as { from?: string } | null)?.from
  const originPetId = (location.state as { petId?: string } | null)?.petId
  const fromTab = (location.state as { fromTab?: string } | null)?.fromTab
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'protein' | 'fat' | 'carbs'>('protein')
  const [shareOpen, setShareOpen] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      setError('Некорректный идентификатор рецепта')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    ingredientService.list().then(setIngredients).catch(() => setIngredients([]))
    recipeService.get(recipeId)
      .then(data => {
        if (!cancelled) setRecipe(data)
      })
      .catch(errorValue => {
        if (!cancelled) {
          setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить рецепт')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [recipeId])

  const goBack = () => {
    if (origin === 'pet-profile' && originPetId) {
      navigate(`/pet-profile/${originPetId}`, { state: { tab: fromTab ?? 'food' } })
      return
    }
    navigate('/recipes')
  }

  const handleDelete = async () => {
    if (!recipe || !window.confirm(`Удалить рецепт «${recipe.name}»?`)) return
    try {
      await recipeService.delete(recipe.id)
      goBack()
    } catch (errorValue) {
      window.alert(errorValue instanceof Error ? errorValue.message : 'Не удалось удалить рецепт')
    }
  }

  const loadShare = useCallback(() => recipeService.getShare(recipeId), [recipeId])
  const createShare = useCallback(() => recipeService.createShare(recipeId), [recipeId])
  const rotateShare = useCallback(() => recipeService.rotateShare(recipeId), [recipeId])
  const revokeShare = useCallback(() => recipeService.revokeShare(recipeId), [recipeId])
  const handleDownload = async () => {
    if (!recipe || downloadingPdf) return
    setDownloadingPdf(true)
    try {
      const file = await recipeService.downloadPdf(recipe.id, locale)
      const url = URL.createObjectURL(file.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename || `recipe-${recipe.id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (value) {
      window.alert(value instanceof Error ? value.message : t('export.error'))
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.card}>Загрузка...</div></div>
  }

  if (!recipe) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.sectionTitle}>Рецепт не найден</p>
          <p className={styles.descriptionText}>{error || 'Запись отсутствует или была удалена'}</p>
          <button className={styles.backBtn} onClick={goBack}>‹ Назад</button>
        </div>
      </div>
    )
  }

  const calculationResult = recipe.calculationResult
  const isFullyCalculated = recipe.status === 'calculated' && Boolean(calculationResult) && Boolean(recipe.calculatedAt)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={goBack}>‹ Назад</button>
        <h1 className={styles.headerTitle}>{t('recipes.profileTitle')}</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/recipes/${recipe.id}/edit`, {
              state: { from: origin, petId: originPetId, fromTab },
            })}
          >
            <EditIcon width="20" height="20" className="no-filter" />
            Изменить
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            <DeleteIcon width="20" height="20" className="no-filter" />
            Удалить
          </button>
        </div>
      </div>

      <div className={`${styles.card} ${styles.profileCard}`}>
        <div className={styles.recipeTopRow}>
          <h2 className={styles.recipeName}>{recipe.name.trim() || t('recipes.untitled')}</h2>
          {isFullyCalculated && <div className={styles.shareActions}>
            <button className={styles.iconBtn} title={t('export.share')} onClick={() => setShareOpen(true)}>
              <ShareIcon width="30" height="30" />
            </button>
            <button className={styles.iconBtn} title={downloadingPdf ? t('export.downloading') : t('export.download')} aria-busy={downloadingPdf} disabled={downloadingPdf} onClick={() => void handleDownload()}>
              {downloadingPdf ? <span aria-hidden="true">…</span> : <DownloadIcon width="30" height="30" />}
            </button>
          </div>}
        </div>
        <ShareDialog open={shareOpen} resourceName={recipe.name} onClose={() => setShareOpen(false)} load={loadShare} create={createShare} rotate={rotateShare} revoke={revokeShare} />
        <div className={styles.recipeMeta}>
          {[
            { label: 'Возраст', value: RECIPE_AGE_LABELS[recipe.ageCategory] },
            { label: 'Размер породы', value: RECIPE_BREED_SIZE_LABELS[recipe.breedSize] },
          ].map(item => (
            <div key={item.label} className={styles.recipeMetaGroup}>
              <span className={styles.metaLabel}>{item.label}</span>
              <span className={styles.metaValue}>{item.value}</span>
            </div>
          ))}
        </div>
        <p className={styles.descriptionLabel}>Описание</p>
        <p className={styles.descriptionText}>{recipe.description || 'Описание не указано'}</p>

        <p className={styles.sectionTitle}>Параметры питомца</p>
        <div className={styles.petGrid}>
          <div className={styles.petField}>
            {recipe.petId ? (
              <button
                type="button"
                className={styles.petProfileLink}
                title="Открыть профиль питомца"
                onClick={() => navigate(`/pet-profile/${recipe.petId}`, {
                  state: {
                    from: 'recipe-profile',
                    recipeId: recipe.id,
                    recipeReturnState: origin === 'pet-profile'
                      ? { from: origin, petId: originPetId, fromTab }
                      : undefined,
                  },
                })}
              >
                {recipe.petName || 'Открыть профиль питомца'}
                <span aria-hidden="true">›</span>
              </button>
            ) : (
              <span className={styles.petLabel}>Питомец не выбран</span>
            )}
            <span className={styles.petValue} title={recipe.petId ?? undefined}>
              {recipe.petId ? `ID: ${formatPetId(recipe.petId)}` : 'Без привязки'}
            </span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Вес, кг</span>
            <span className={styles.petValue}>{recipe.targetWeightKg ?? 'Не указан'}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Возраст</span>
            <span className={styles.petValue}>{formatAge(recipe.targetAgeMonths)}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Пол</span>
            <span className={styles.petValue}>
              {recipe.targetGender === 'male' ? 'Самец' : recipe.targetGender === 'female' ? 'Самка' : 'Не указан'}
            </span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Порода</span>
            <span className={styles.petValue}>{recipe.targetBreedName || 'Не указана'}</span>
          </div>
        </div>
        <div className={styles.petRow2}>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Уровень активности</span>
            <span className={styles.petValue} title={recipe.targetActivityTypeName ?? undefined}>
              {compactReferenceName(recipe.targetActivityTypeName)}
            </span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Репродуктивный статус</span>
            <span className={styles.petValue}>{recipe.targetReproductiveStatusName || 'Не указан'}</span>
          </div>
        </div>
        <p className={styles.healthTitle}>Состояние здоровья</p>
        <p className={styles.healthValue}>
          {recipe.targetDisorder || recipe.targetHealthConditionName || 'Не указано'}
        </p>
        <p className={styles.symptomsLabel}>Симптомы заболевания</p>
        <div className={styles.chipsRow}>
          {recipe.symptoms.length > 0
            ? recipe.symptoms.map(symptom => <span key={symptom.id} className={styles.chip}>{symptom.name}</span>)
            : <span className={styles.petValue}>Нет</span>}
        </div>
      </div>

      {calculationResult ? (
        <CalculationSections
          result={calculationResult}
          activeTab={activeTab}
          ingredients={ingredients}
          onTabChange={setActiveTab}
        />
      ) : (
        <DraftComposition recipe={recipe} />
      )}
    </div>
  )
}
