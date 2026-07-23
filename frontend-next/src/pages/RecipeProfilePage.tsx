import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  recipeService,
  type Recipe,
  type RecipeCalculationResult,
} from '../../services/recipeService'
import {
  RECIPE_AGE_LABELS,
  RECIPE_BREED_SIZE_LABELS,
  RECIPE_FORMAT_LABELS,
  RECIPE_TYPE_LABELS,
} from '../data/recipeOptions'
import styles from '../styles/RecipeProfile.module.css'
import DeleteIcon from '../assets/icons/delete.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'

const CHART_COLORS = ['#4a90d9', '#5cb85c', '#f47f4b', '#e8c84a', '#8b6fc0', '#38a3a5']

function DonutChart({ data }: { data: { value: number; color: string; label?: string }[] }) {
  const r = 60
  const circumference = 2 * Math.PI * r
  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  let offset = 0

  if (total <= 0) return null

  const slices = data.map(item => {
    const dash = (Math.max(0, item.value) / total) * circumference
    const slice = {
      dash,
      gap: circumference - dash,
      offset,
      color: item.color,
      value: item.value,
      label: item.label,
    }
    offset += dash
    return slice
  })

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
      {slices.map((slice, index) => (
        <circle
          key={index}
          cx={80}
          cy={80}
          r={r}
          fill="none"
          stroke={slice.color}
          strokeWidth="28"
          strokeDasharray={`${slice.dash} ${slice.gap}`}
          strokeDashoffset={-slice.offset + circumference * 0.25}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
        />
      ))}
      {slices.map((slice, index) => {
        const previous = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0)
        const angle = -90 + ((previous + slice.value / 2) / total) * 360
        const radians = (angle * Math.PI) / 180
        const x = 80 + Math.cos(radians) * 75
        const y = 80 + Math.sin(radians) * 75
        return (
          <text
            key={`label-${index}`}
            x={x}
            y={y}
            fontSize="7"
            fontWeight="600"
            fill={slice.color}
            textAnchor={x < 76 ? 'end' : x > 84 ? 'start' : 'middle'}
            dominantBaseline="middle"
          >
            {slice.label ?? `${slice.value}%`}
          </text>
        )
      })}
    </svg>
  )
}

function LineChart({ data }: { data: { time: number; remaining: number }[] }) {
  const width = 300
  const height = 160
  const padLeft = 40
  const padBottom = 30
  const padTop = 16
  const padRight = 16

  if (data.length === 0) return null

  const maxY = Math.max(1, ...data.map(item => item.remaining))
  const maxX = Math.max(1, ...data.map(item => item.time))
  const toX = (time: number) => padLeft + (time / maxX) * (width - padLeft - padRight)
  const toY = (value: number) =>
    padTop + (1 - value / maxY) * (height - padTop - padBottom)
  const points = data.map(item => `${toX(item.time)},${toY(item.remaining)}`).join(' ')
  const middle = data[Math.floor(data.length / 2)]
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
      {yTicks.map((value, index) => (
        <g key={index}>
          <line
            x1={padLeft}
            y1={toY(value)}
            x2={width - padRight}
            y2={toY(value)}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          <text
            x={padLeft - 4}
            y={toY(value) + 3}
            fontSize="9"
            fill="var(--color-text-muted)"
            textAnchor="end"
          >
            {value.toFixed(2)}
          </text>
        </g>
      ))}
      {data.map(item => (
        <text
          key={item.time}
          x={toX(item.time)}
          y={height - 6}
          fontSize="9"
          fill="var(--color-text-muted)"
          textAnchor="middle"
        >
          {item.time}
        </text>
      ))}
      <polyline points={points} fill="none" stroke="#e53e3e" strokeWidth="2" />
      <circle cx={toX(middle.time)} cy={toY(middle.remaining)} r={5} fill="#e53e3e" />
      <text
        x={padLeft - 28}
        y={height / 2}
        fontSize="9"
        fill="var(--color-text-muted)"
        textAnchor="middle"
        transform={`rotate(-90, ${padLeft - 28}, ${height / 2})`}
      >
        Остаток (г)
      </text>
      <text
        x={(width + padLeft) / 2}
        y={height - 1}
        fontSize="9"
        fill="var(--color-text-muted)"
        textAnchor="middle"
      >
        Время (часы)
      </text>
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
}: {
  result: RecipeCalculationResult
  activeTab: 'protein' | 'fat' | 'carbs'
  onTabChange: (tab: 'protein' | 'fat' | 'carbs') => void
}) {
  const composition = result.composition ?? []
  const nutrition = result.nutrition ?? []
  const nutrients = result.nutrients ?? []
  const digestion = result.digestion
  const tabData = digestion ? {
    protein: {
      curve: digestion.protein ?? [],
      absorption: digestion.proteinAbsorption,
      forecast: digestion.proteinForecast ?? [],
    },
    fat: {
      curve: digestion.fat ?? [],
      absorption: digestion.fatAbsorption,
      forecast: digestion.fatForecast ?? [],
    },
    carbs: {
      curve: digestion.carbs ?? [],
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
          {composition.length > 0 && (
            <div className={`${styles.chartCard} ${styles.compositionChartCard}`}>
              <p className={styles.chartTitle}>Состав рациона</p>
              <div className={styles.donutWrapper}>
                <DonutChart data={composition.map((item, index) => ({
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
                <DonutChart data={nutrition.map((item, index) => ({
                  value: item.value,
                  color: item.color ?? CHART_COLORS[index % CHART_COLORS.length],
                  label: `${item.value} ${item.unit}`,
                }))} />
              </div>
              <p className={styles.nutritionLegendTitle}>Питательная ценность на 100 г:</p>
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
                    <span>{item.value} {item.unit}</span>
                  </div>
                ))}
              </div>
              {result.nutritionPer100 && (
                <div className={styles.nutritionSummary}>
                  Энергетическая ценность: {result.nutritionPer100.calories} ккал
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {nutrients.length > 0 && (
        <div className={`${styles.card} ${styles.nutrientsCard}`}>
          <p className={styles.sectionTitle}>Содержание нутриентов</p>
          <div className={styles.nutrientsGrid}>
            {nutrients.map((item, index) => (
              <div key={`${item.key ?? item.label}-${index}`} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{item.label}</span>
                <span className={styles.nutrientVal}>{item.value} {item.unit}</span>
              </div>
            ))}
          </div>
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
              <LineChart data={current.curve} />
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
  const recipeId = Number(id)
  const origin = (location.state as { from?: string } | null)?.from
  const originPetId = (location.state as { petId?: string } | null)?.petId
  const fromTab = (location.state as { fromTab?: string } | null)?.fromTab
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'protein' | 'fat' | 'carbs'>('protein')

  useEffect(() => {
    let cancelled = false
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      setError('Некорректный идентификатор рецепта')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
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

  const handleShare = async () => {
    if (!recipe) return
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.name, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch (errorValue) {
      if (errorValue instanceof DOMException && errorValue.name === 'AbortError') return
      window.alert('Не удалось поделиться ссылкой')
    }
  }

  const handleDownload = () => {
    if (!recipe) return
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `recipe-${recipe.id}.json`
    link.click()
    URL.revokeObjectURL(url)
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

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={goBack}>‹ Назад</button>
        <h1 className={styles.headerTitle}>Профиль корма</h1>
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
          <h2 className={styles.recipeName}>{recipe.name}</h2>
          <div className={styles.shareActions}>
            <button className={styles.iconBtn} title="Поделиться" onClick={handleShare}>
              <ShareIcon width="30" height="30" />
            </button>
            <button className={styles.iconBtn} title="Скачать" onClick={handleDownload}>
              <DownloadIcon width="30" height="30" />
            </button>
          </div>
        </div>
        <div className={styles.recipeMeta}>
          {[
            { label: 'Тип', value: RECIPE_TYPE_LABELS[recipe.type] },
            { label: 'Формат', value: RECIPE_FORMAT_LABELS[recipe.format] },
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
        <p className={styles.healthValue}>{recipe.targetHealthConditionName || 'Не указано'}</p>
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
          onTabChange={setActiveTab}
        />
      ) : (
        <DraftComposition recipe={recipe} />
      )}
    </div>
  )
}
