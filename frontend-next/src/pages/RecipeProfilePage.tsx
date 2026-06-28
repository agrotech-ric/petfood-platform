import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { MOCK_RECIPE_PROFILE } from '../data/recipeProfileMock'
import styles from '../styles/RecipeProfile.module.css'
import DeleteIcon from '../assets/icons/delete.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'

// ── Simple SVG Donut ────────────────────────────────────────────
function DonutChart({ data }: { data: { percent: number; color: string }[] }) {
  const r = 60
  const cx = 80
  const cy = 80
  const circumference = 2 * Math.PI * r
  let offset = 0

  const slices = data.map(d => {
    const dash = (d.percent / 100) * circumference
    const gap = circumference - dash
    const slice = { dash, gap, offset, color: d.color }
    offset += dash
    return slice
  })

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="28"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circumference * 0.25}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
        />
      ))}
    </svg>
  )
}

// ── Simple SVG Line Chart ───────────────────────────────────────
function LineChart({ data }: { data: { time: number; remaining: number }[] }) {
  const W = 300
  const H = 160
  const padL = 40
  const padB = 30
  const padT = 16
  const padR = 16

  const maxY = Math.max(...data.map(d => d.remaining))
  const maxX = Math.max(...data.map(d => d.time))

  const toX = (t: number) => padL + (t / maxX) * (W - padL - padR)
  const toY = (v: number) => padT + (1 - v / maxY) * (H - padT - padB)

  const points = data.map(d => `${toX(d.time)},${toY(d.remaining)}`).join(' ')

  const dotIdx = Math.floor(data.length / 2)
  const dotX = toX(data[dotIdx].time)
  const dotY = toY(data[dotIdx].remaining)

  // Y axis ticks
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svgChart}>
      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={padL} y1={toY(v)}
            x2={W - padR} y2={toY(v)}
            stroke="#eee" strokeWidth="1"
          />
          <text x={padL - 4} y={toY(v) + 3} fontSize="9" fill="#aaa" textAnchor="end">
            {v.toFixed(2)}
          </text>
        </g>
      ))}

      {/* X axis labels */}
      {data.map(d => (
        <text key={d.time} x={toX(d.time)} y={H - 6} fontSize="9" fill="#aaa" textAnchor="middle">
          {d.time}
        </text>
      ))}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#e53e3e"
        strokeWidth="2"
      />

      {/* Middle dot */}
      <circle cx={dotX} cy={dotY} r={5} fill="#e53e3e" />

      {/* Axis labels */}
      <text x={padL - 28} y={H / 2} fontSize="9" fill="#888" textAnchor="middle"
        transform={`rotate(-90, ${padL - 28}, ${H / 2})`}>
        Белок (г)
      </text>
      <text x={(W + padL) / 2} y={H - 1} fontSize="9" fill="#888" textAnchor="middle">
        Время (часы)
      </text>
    </svg>
  )
}

// ── Bar chart item ──────────────────────────────────────────────
function BarItem({ label, percent, isBlue }: { label: string; percent: number; isBlue?: boolean }) {
  const normPct = Math.min(percent, 150)
  const fillW = (normPct / 150) * 100
  return (
    <div className={styles.barItem}>
      <div className={styles.barLabel}>{label}</div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${isBlue ? styles.barFillBlue : styles.barFillOrange}`}
          style={{ width: `${Math.min(fillW, 100)}%` }}
        />
        {/* norm line at 100/150 = 66.67% */}
        <div className={styles.normLine} style={{ left: '66.67%' }} />
      </div>
      <div className={styles.barPercent}>{percent}%</div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export function RecipeProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const origin = (location.state as any)?.from as string | undefined
  const originPetId = (location.state as any)?.petId as string | undefined
  const [activeTab, setActiveTab] = useState<'protein' | 'fat' | 'carbs'>('protein')

  const recipe = MOCK_RECIPE_PROFILE

  const tabData = {
    protein: {
      curve: recipe.digestion.protein,
      absorption: recipe.digestion.proteinAbsorption,
      forecast: recipe.digestion.proteinForecast,
    },
    fat: {
      curve: recipe.digestion.fat,
      absorption: recipe.digestion.fatAbsorption,
      forecast: recipe.digestion.fatForecast,
    },
    carbs: {
      curve: recipe.digestion.carbs,
      absorption: recipe.digestion.carbsAbsorption,
      forecast: recipe.digestion.carbsForecast,
    },
  }

  const current = tabData[activeTab]

  const forecastPercentClass = (pct: number) =>
    pct === 0 ? '' : pct < 50 ? styles.forecastPercentLow : styles.forecastPercentMid

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => {
          if (origin === 'pet-profile' && originPetId) navigate(`/pet-profile/${originPetId}`, { state: { tab: (location.state as any)?.fromTab ?? 'food' } })
          else navigate('/recipes')
        }}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Профиль корма</h1>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/recipes/${recipe.id}/edit`, { state: { from: origin, petId: originPetId, fromTab: (location.state as any)?.fromTab } })}>
            <EditIcon width="14" height="14" />
            Изменить
          </button>
          <button className={styles.deleteBtn}>
            <DeleteIcon width="14" height="14" />
            Удалить
          </button>
        </div>
      </div>

      {/* Recipe info */}
      <div className={styles.card}>
        <div className={styles.recipeTopRow}>
          <h2 className={styles.recipeName}>{recipe.name}</h2>
          <div className={styles.shareActions}>
            <button className={styles.iconBtn}>
              <ShareIcon width="30" height="30" />
            </button>
            <button className={styles.iconBtn}>
              <DownloadIcon width="30" height="30" />
            </button>
          </div>
        </div>

        <div className={styles.recipeMeta}>
          {[
            { label: 'Тип', value: recipe.type },
            { label: 'Формат', value: recipe.format },
            { label: 'Возраст', value: recipe.ageCategory },
            { label: 'Размер проды', value: recipe.breedSize },
          ].map(m => (
            <div key={m.label} className={styles.recipeMetaGroup}>
              <span className={styles.metaLabel}>{m.label}</span>
              <span className={styles.metaValue}>{m.value}</span>
            </div>
          ))}
        </div>

        <p className={styles.descriptionLabel}>Описание</p>
        <p className={styles.descriptionText}>{recipe.description}</p>
      </div>

      {/* Pet params */}
      <div className={styles.card}>
        <p className={styles.sectionTitle}>Параметры питомца</p>

        <div className={styles.petGrid}>
          <div className={styles.petField}>
            <span className={styles.petLabel}>{recipe.pet.name}</span>
            <span className={styles.petValue}>ID: {recipe.pet.id}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Вес, кг</span>
            <span className={styles.petValue}>{recipe.pet.weight}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Возраст</span>
            <span className={styles.petValue}>{recipe.pet.age}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Пол</span>
            <span className={styles.petValue}>{recipe.pet.gender}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Порода</span>
            <span className={styles.petValue}>{recipe.pet.breed}</span>
          </div>
        </div>

        <div className={styles.petRow2}>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Уровень активности</span>
            <span className={styles.petValue}>{recipe.pet.activityLevel}</span>
          </div>
          <div className={styles.petField}>
            <span className={styles.petLabel}>Репродуктивный статус</span>
            <span className={styles.petValue}>{recipe.pet.reproductiveStatus}</span>
          </div>
        </div>

        <p className={styles.healthTitle}>Состояние здоровья</p>
        <p className={styles.healthValue}>{recipe.pet.healthCondition}</p>
        <p className={styles.symptomsLabel}>Симптомы заболевания</p>
        <div className={styles.chipsRow}>
          {recipe.pet.symptoms.map(s => (
            <span key={s} className={styles.chip}>{s}</span>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{recipe.calories} ккал</p>
          <p className={styles.metricLabel}>Энергетическая ценность</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{recipe.dailyNorm} г</p>
          <p className={styles.metricLabel}>Суточная норма корма</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{recipe.dailyCaloriesNorm} ккал</p>
          <p className={styles.metricLabel}>Суточная норма каллорие</p>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsRow}>
        {/* Composition donut */}
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Состав рациона</p>
          <div className={styles.donutWrapper}>
            <DonutChart data={recipe.composition.map(c => ({ percent: c.percent, color: c.color }))} />
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
              {recipe.composition.map(c => (
                <tr key={c.label}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                      {c.label}
                    </span>
                  </td>
                  <td>{c.percent}%</td>
                  <td>{c.grams} г</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nutrition donut */}
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Питательная ценность</p>
          <div className={styles.donutWrapper}>
            <DonutChart data={recipe.nutrition.map(n => ({ percent: n.value, color: n.color }))} />
          </div>
          <div className={styles.donutLegend}>
            {recipe.nutrition.map(n => (
              <div key={n.label} className={styles.donutLegendRow}>
                <div className={styles.legendDot} style={{ background: n.color }} />
                <span>{n.label} — {n.value} {n.unit}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Питательная ценность на 100 г:
            <div>Энергетическая ценность: {recipe.nutritionPer100.calories} ккал</div>
          </div>
        </div>
      </div>

      {/* Nutrients */}
      <div className={styles.card}>
        <p className={styles.sectionTitle}>Содержание нутриентов</p>
        <div className={styles.nutrientsGrid}>
          {recipe.nutrients.map(n => (
            <div key={n.label} className={styles.nutrientRow}>
              <span className={styles.nutrientName}>{n.label}</span>
              <span className={styles.nutrientVal}>{n.value} {n.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar charts */}
      <div className={styles.barChartsRow}>
        {/* Minerals */}
        <div className={styles.chartCard}>
          <p className={styles.barChartTitle}>Минералы</p>
          <div className={styles.normHeader}>Норма</div>
          {recipe.minerals.map(m => (
            <BarItem key={m.label} label={m.label} percent={m.percent} />
          ))}
          <div className={styles.barAxisLabel}>Процентное соотношение с нормой (%)</div>
        </div>

        {/* Vitamins */}
        <div className={styles.chartCard}>
          <p className={styles.barChartTitle}>Витамины</p>
          <div className={styles.normHeader}>Норма</div>
          {recipe.vitamins.map(v => (
            <BarItem key={v.label} label={v.label} percent={v.percent} isBlue />
          ))}
          <div className={styles.barAxisLabel}>Процентное соотношение с нормой (%)</div>
        </div>
      </div>

      {/* Digestion analysis */}
      <div className={styles.digestionCard}>
        <p className={styles.digestionTitle}>Анализ переваривания</p>
        <p className={styles.digestionSubtitle}>Модаль Михааписа-Менган</p>

        <div className={styles.tabs}>
          {(['protein', 'fat', 'carbs'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'protein' ? 'Белки' : tab === 'fat' ? 'Жиры' : 'Углеводы'}
            </button>
          ))}
        </div>

        <div className={styles.digestionContent}>
          {/* Line chart */}
          <div>
            <p className={styles.chartLabel}>
              Кривая переваривания S(t) - остаток {activeTab === 'protein' ? 'белка' : activeTab === 'fat' ? 'жира' : 'углеводов'} во времени
            </p>
            <LineChart data={current.curve} />
          </div>

          {/* Right side */}
          <div>
            <p className={styles.absorptionLabel}>Усвояемость D(t)</p>
            <div className={styles.absorptionBarTrack}>
              <div
                className={styles.absorptionBarFill}
                style={{ width: `${current.absorption}%` }}
              >
                {current.absorption}%
              </div>
            </div>

            <p className={styles.forecastTitle}>Прогноз переваривания</p>
            <table className={styles.forecastTable}>
              <tbody>
                {current.forecast.map(f => (
                  <tr key={f.hour}>
                    <td>{f.hour} час{f.hour === 0 ? '' : f.hour === 1 ? '' : 'а'}:</td>
                    <td>
                      <span className={`${styles.forecastPercent} ${forecastPercentClass(f.percent)}`}>
                        {f.percent.toFixed(1)}%
                      </span>
                    </td>
                    <td>{f.grams} г</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}