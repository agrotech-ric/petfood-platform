import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  INGREDIENT_CATEGORIES, DOG_BREEDS, AGE_OPTIONS, ACTIVITY_OPTIONS,
  REPRODUCTIVE_OPTIONS, GENDER_OPTIONS, AGE_CATEGORY_OPTIONS,
  BREED_SIZE_OPTIONS, HEALTH_CONDITIONS, SYMPTOMS_OPTIONS,
  NUTRIENT_LIMITS, MAXIMIZE_OPTIONS, MOCK_RECIPE_RESULT,
} from '../data/createRecipeMock'
import { MOCK_RECIPE_PROFILE } from '../data/recipeProfileMock'
import styles from '../styles/CreateRecipe.module.css'

// ── Donut chart ─────────────────────────────────────────────────
function DonutChart({ data }: { data: { percent: number; color: string }[] }) {
  const r = 60, cx = 80, cy = 80
  const circumference = 2 * Math.PI * r
  let offset = 0
  const slices = data.map(d => {
    const dash = (d.percent / 100) * circumference
    const s = { dash, gap: circumference - dash, offset, color: d.color }
    offset += dash
    return s
  })
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="28"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circumference * 0.25}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
        />
      ))}
    </svg>
  )
}

// ── Bar item ────────────────────────────────────────────────────
function BarItem({ label, percent, isBlue }: { label: string; percent: number; isBlue?: boolean }) {
  return (
    <div className={styles.barItem}>
      <div className={styles.barLabel}>{label}</div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${isBlue ? styles.barFillBlue : styles.barFillOrange}`}
          style={{ width: `${Math.min((percent / 150) * 100, 100)}%` }}
        />
        <div className={styles.normLine} />
      </div>
      <div className={styles.barPercent}>{percent}%</div>
    </div>
  )
}

// ── Step 1 (edit) ───────────────────────────────────────────────
function EditStep1({ onNext }: { onNext: () => void }) {
  const profile = MOCK_RECIPE_PROFILE

  const [foodName, setFoodName] = useState(profile.name)
  const [foodDesc, setFoodDesc] = useState(profile.description)
  const [foodType, setFoodType] = useState<'domestic' | 'commercial'>(
    profile.type === 'домашний' ? 'domestic' : 'commercial'
  )
  const [ageCategory, setAgeCategory] = useState(profile.ageCategory)
  const [breedSize, setBreedSize] = useState(profile.breedSize)
  const [weight, setWeight] = useState(String(profile.pet.weight))
  const [breed, setBreed] = useState(profile.pet.breed)
  const [age, setAge] = useState(profile.pet.age)
  const [gender, setGender] = useState(profile.pet.gender)
  const [activity, setActivity] = useState(profile.pet.activityLevel)
  const [reproductive, setReproductive] = useState(profile.pet.reproductiveStatus)
  const [healthCondition, setHealthCondition] = useState(profile.pet.healthCondition)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([...profile.pet.symptoms])

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  return (
    <>
      {/* Food params */}
      <div className={styles.card}>
        <p className={styles.sectionTitle}>Параметры корма</p>
        <div className={styles.formGrid2}>
          <div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Название корма</label>
              <input className={styles.fieldInput}
                value={foodName} onChange={e => setFoodName(e.target.value)} />
            </div>
            <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
              <label className={styles.fieldLabel}>Описание корма</label>
              <textarea className={styles.fieldTextarea}
                value={foodDesc} onChange={e => setFoodDesc(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Тип корма</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input type="radio" className={styles.radioInput} name="foodType"
                    checked={foodType === 'domestic'} onChange={() => setFoodType('domestic')} />
                  домашний
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" className={styles.radioInput} name="foodType"
                    checked={foodType === 'commercial'} onChange={() => setFoodType('commercial')} />
                  коммерческий
                </label>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Возраст</label>
              <select className={styles.fieldSelect} value={ageCategory}
                onChange={e => setAgeCategory(e.target.value)}>
                {AGE_CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Размер проды</label>
              <select className={styles.fieldSelect} value={breedSize}
                onChange={e => setBreedSize(e.target.value)}>
                {BREED_SIZE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dog params */}
      <div className={styles.card}>
        <p className={styles.sectionTitle}>Параметры собаки</p>
        <div className={styles.formGrid2}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Вес (кг)</label>
            <select className={styles.fieldSelect} value={weight}
              onChange={e => setWeight(e.target.value)}>
              {['5', '8', '10', '12', '15', '20', '25', '30', '40'].map(v => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Порода</label>
            <select className={styles.fieldSelect} value={breed}
              onChange={e => setBreed(e.target.value)}>
              {DOG_BREEDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Возраст</label>
            <select className={styles.fieldSelect} value={age}
              onChange={e => setAge(e.target.value)}>
              {AGE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Уровень активности</label>
            <select className={styles.fieldSelect} value={activity}
              onChange={e => setActivity(e.target.value)}>
              {ACTIVITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Пол</label>
            <select className={styles.fieldSelect} value={gender}
              onChange={e => setGender(e.target.value)}>
              {GENDER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Репродуктивный статус</label>
            <select className={styles.fieldSelect} value={reproductive}
              onChange={e => setReproductive(e.target.value)}>
              {REPRODUCTIVE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Health */}
      <div className={styles.card}>
        <p className={styles.sectionTitle}>Состояние здоровья</p>
        <div className={styles.symptomsRow}>
          <div className={styles.symptomsLeft}>
            <div className={styles.fieldGroup} style={{ marginBottom: 16 }}>
              <label className={styles.fieldLabel}>Наличие заболевания</label>
              <select className={styles.fieldSelect} value={healthCondition}
                onChange={e => setHealthCondition(e.target.value)}>
                {HEALTH_CONDITIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Симптомы заболевания</label>
              <select className={styles.fieldSelect}
                onChange={e => { if (e.target.value) toggleSymptom(e.target.value) }}>
                <option value="">Найдите симптомы</option>
                {SYMPTOMS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.symptomsRight}>
            <p className={styles.symptomsLabel}>Выбранные симптомы</p>
            <div className={styles.chipsRow}>
              {selectedSymptoms.map(s => (
                <span key={s} className={styles.chip}>
                  {s}
                  <button className={styles.chipRemove} onClick={() => toggleSymptom(s)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className={styles.primaryBtn} onClick={onNext}>
          Обновить рекомендации
        </button>
      </div>
    </>
  )
}

// ── Step 2 (edit) ───────────────────────────────────────────────
function EditStep2({ onNext }: { onNext: () => void }) {
  const [energy, setEnergy] = useState('375')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([
    'Кукуруза — Обыкновенный', 'Животный Жир — Говяжий',
    'Вода — Обыкновенный', 'Курица — Мясо', 'Горох — Зелёный Горошек',
  ])
  const allIngredients = INGREDIENT_CATEGORIES.flatMap(cat => cat.items)
  const [ingredientLimits, setIngredientLimits] = useState<Record<string, { min: number; max: number }>>(
    Object.fromEntries(allIngredients.map(item => [item, { min: 0, max: 100 }]))
  )
  const [nutrientRanges, setNutrientRanges] = useState<Record<string, { min: number; max: number }>>(
    Object.fromEntries(NUTRIENT_LIMITS.map(n => [n.key, { min: n.defaultMin, max: n.defaultMax }]))
  )
  const [maximize, setMaximize] = useState('')
  const [nutrientValues, setNutrientValues] = useState<Record<string, number>>(
    Object.fromEntries(NUTRIENT_LIMITS.map(n => [n.key, Math.round((n.defaultMin + n.defaultMax) / 2)]))
  )

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }

  const getIngLimit = (name: string) => ingredientLimits[name]?.min ?? 0
  const getIngLimitMax = (name: string) => ingredientLimits[name]?.max ?? 100
  const getNutrientValue = (key: string, defaultValue: number) =>
    nutrientRanges[key]?.min ?? defaultValue
  const getNutrientValueMax = (key: string) =>
    nutrientRanges[key]?.max ?? 0
  const formatRangeBackground = (minValue: number, maxValue: number, lower: number, upper: number) => {
    const total = upper - lower
    const start = ((minValue - lower) / total) * 100
    const end = ((maxValue - lower) / total) * 100
    return `linear-gradient(90deg, #E7E7E7 0%, #E7E7E7 ${start}%, #F3703E ${start}%, #F3703E ${end}%, #E7E7E7 ${end}%, #E7E7E7 100%)`
  }

  return (
    <div className={styles.card}>
      <p className={styles.sectionTitle}>Целевая энергия (ккал)</p>
      <div className={styles.energyRow}>
        <input className={styles.energyInput} type="number"
          value={energy} onChange={e => setEnergy(e.target.value)} />
        <span className={styles.energyHint}>Рекомендуемая: 375 ккал</span>
      </div>

      <p className={styles.sectionTitle}>Выбор ингредиентов</p>
      <div className={styles.twoPanel}>
        <div className={styles.accordionList}>
          {INGREDIENT_CATEGORIES.map(cat => (
            <div key={cat.key} className={styles.accordionItem}>
              <button className={styles.accordionHeader}
                onClick={() => toggleCategory(cat.key)}>
                <span className={styles.accordionChevron}>
                  {openCategories.has(cat.key) ? '▼' : '›'}
                </span>
                {cat.label}
              </button>
              {openCategories.has(cat.key) && (
                <div className={styles.accordionBody}>
                  {cat.items.map(item => (
                    <span key={item}
                      className={`${styles.ingredientTag} ${selectedIngredients.includes(item) ? styles.ingredientTagActive : ''}`}
                      onClick={() => toggleIngredient(item)}>
                      {item}{selectedIngredients.includes(item) && ' ×'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.selectedBox}>
          <p className={styles.selectedTitle}>Выбранные ингредиенты</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedIngredients.map(ing => (
              <span key={ing} className={styles.selectedChip}>
                {ing}
                <button
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 14 }}
                  onClick={() => toggleIngredient(ing)}>×</button>
              </span>
            ))}
          </div>
          {selectedIngredients.length > 0 && (
            <button className={styles.clearAllBtn}
              onClick={() => setSelectedIngredients([])}>
              Очистить все
            </button>
          )}
        </div>
      </div>

      {selectedIngredients.length > 0 && (
        <>
          <p className={styles.sectionTitle}>
            Ограничения по количеству ингредиентов (в % от 100 г):
          </p>
          {selectedIngredients.map(ing => (
            <div key={ing} className={styles.sliderRow}>
              <span className={styles.sliderLabel}>{ing}:</span>
              <span className={styles.sliderMinVal}>{getIngLimit(ing)}</span>
              <div className={styles.dualRangeTrack}
                style={{ background: formatRangeBackground(getIngLimit(ing), getIngLimitMax(ing), 0, 100) }}>
                <input type="range" className={`${styles.dualRangeInput} ${styles.dualRangeMin}`}
                  min={0} max={100} value={getIngLimit(ing)}
                  onChange={e => {
                    const value = Math.min(Number(e.target.value), getIngLimitMax(ing))
                    setIngredientLimits(prev => ({
                      ...prev,
                      [ing]: { ...prev[ing], min: value }
                    }))
                  }} />
                <input type="range" className={`${styles.dualRangeInput} ${styles.dualRangeMax}`}
                  min={0} max={100} value={getIngLimitMax(ing)}
                  onChange={e => {
                    const value = Math.max(Number(e.target.value), getIngLimit(ing))
                    setIngredientLimits(prev => ({
                      ...prev,
                      [ing]: { ...prev[ing], max: value }
                    }))
                  }} />
              </div>
              <span className={styles.sliderMaxVal}>{getIngLimitMax(ing)}</span>
            </div>
          ))}
        </>
      )}

      <p className={styles.sectionTitle} style={{ marginTop: 20 }}>
        Ограничения по нутриентам:
      </p>
      {NUTRIENT_LIMITS.map(n => {
        const lowerValue = nutrientRanges[n.key]?.min ?? n.defaultMin
        const upperValue = nutrientRanges[n.key]?.max ?? n.defaultMax
        return (
          <div key={n.key} className={styles.sliderRow}>
            <span className={styles.sliderLabel}>{n.label}:</span>
            <span className={styles.sliderMinVal}>{lowerValue}</span>
            <div className={styles.dualRangeTrack}
              style={{ background: formatRangeBackground(lowerValue, upperValue, n.min, n.max) }}>
              <input type="range" className={`${styles.dualRangeInput} ${styles.dualRangeMin}`}
                min={n.min} max={n.max} step={0.01} value={lowerValue}
                onChange={e => {
                  const value = Math.min(Number(e.target.value), upperValue)
                  setNutrientRanges(prev => ({
                    ...prev,
                    [n.key]: { ...prev[n.key], min: value }
                  }))
                }} />
              <input type="range" className={`${styles.dualRangeInput} ${styles.dualRangeMax}`}
                min={n.min} max={n.max} step={0.01} value={upperValue}
                onChange={e => {
                  const value = Math.max(Number(e.target.value), lowerValue)
                  setNutrientRanges(prev => ({
                    ...prev,
                    [n.key]: { ...prev[n.key], max: value }
                  }))
                }} />
            </div>
            <span className={styles.sliderMaxVal}>{upperValue}</span>
          </div>
        )
      })}

      <p className={styles.sectionTitle} style={{ marginTop: 20 }}>Максимизация</p>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
        Выберите нутриенты для максимизации:
      </p>
      <select className={styles.fieldSelect} value={maximize}
        onChange={e => setMaximize(e.target.value)}>
        <option value="">Выберите нутриенты</option>
        {MAXIMIZE_OPTIONS.map(o => <option key={o}>{o}</option>)}
      </select>

      <div>
        <button className={styles.primaryBtn} style={{ marginTop: 24 }} onClick={onNext}>
          Рассчитать оптимальный состав
        </button>
      </div>
    </div>
  )
}

// ── Step 3 (edit) ───────────────────────────────────────────────
function EditStep3({ onSave }: { onSave: () => void }) {
  const r = MOCK_RECIPE_RESULT
  return (
    <>
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{r.calories} ккал</p>
          <p className={styles.metricLabel}>Энергетическая ценность</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{r.dailyNorm} г</p>
          <p className={styles.metricLabel}>Суточная норма корма</p>
        </div>
        <div className={styles.metricCard}>
          <p className={styles.metricValue}>{r.dailyCaloriesNorm} ккал</p>
          <p className={styles.metricLabel}>Суточная норма каллорие</p>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Состав рациона</p>
          <div className={styles.donutWrapper}>
            <DonutChart data={r.composition.map(c => ({ percent: c.percent, color: c.color }))} />
          </div>
          <table className={styles.compositionTable}>
            <thead>
              <tr><th>Ингредиенты</th><th>%</th><th>грамм</th></tr>
            </thead>
            <tbody>
              {r.composition.map(c => (
                <tr key={c.label}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
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

        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Питательная ценность</p>
          <div className={styles.donutWrapper}>
            <DonutChart data={r.nutrition.map(n => ({ percent: n.value, color: n.color }))} />
          </div>
          <div className={styles.donutLegend}>
            {r.nutrition.map(n => (
              <div key={n.label} className={styles.donutLegendRow}>
                <div className={styles.legendDot} style={{ background: n.color }} />
                <span>{n.label} — {n.value} {n.unit}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Питательная ценность на 100 г:<br />
            Энергетическая ценность: {r.nutritionCalories} ккал
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.sectionTitle}>Содержание нутриентов</p>
        <div className={styles.nutrientsGrid}>
          {r.nutrients.map(n => (
            <div key={n.label} className={styles.nutrientRow}>
              <span style={{ color: 'var(--color-text)' }}>{n.label}</span>
              <span style={{ fontWeight: 500 }}>{n.value} {n.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.barChartsRow}>
        <div className={styles.chartCard}>
          <p className={styles.barChartTitle}>Минералы</p>
          <div className={styles.normHeader}>Норма</div>
          {r.minerals.map(m => <BarItem key={m.label} label={m.label} percent={m.percent} />)}
          <div className={styles.barAxisLabel}>Процентное соотношение с нормой (%)</div>
        </div>
        <div className={styles.chartCard}>
          <p className={styles.barChartTitle}>Витамины</p>
          <div className={styles.normHeader}>Норма</div>
          {r.vitamins.map(v => <BarItem key={v.label} label={v.label} percent={v.percent} isBlue />)}
          <div className={styles.barAxisLabel}>Процентное соотношение с нормой (%)</div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 1176 }}>
        <button className={styles.primaryBtn} onClick={onSave}>
          Сохранить изменения
        </button>
      </div>
    </>
  )
}

// ── Main page ───────────────────────────────────────────────────
export function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const origin = (location.state as any)?.from as string | undefined
  const originPetId = (location.state as any)?.petId as string | undefined
  const [step, setStep] = useState<1 | 2 | 3>(1)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn}
          onClick={() => {
            if (step > 1) setStep(s => (s - 1) as 1 | 2 | 3)
            else if (origin === 'pet-profile' && originPetId) navigate(`/pet-profile/${originPetId}`, { state: { tab: (location.state as any)?.fromTab ?? 'food' } })
            else navigate(`/recipes/${id}`)
          }}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Редактирование корма</h1>
        <div style={{ width: 90 }} />
      </div>

      {step === 1 && <EditStep1 onNext={() => setStep(2)} />}
      {step === 2 && <EditStep2 onNext={() => setStep(3)} />}
      {step === 3 && <EditStep3 onSave={() => { if (origin === 'pet-profile' && originPetId) navigate(`/pet-profile/${originPetId}`, { state: { tab: (location.state as any)?.fromTab ?? 'food' } }); else navigate(`/recipes/${id}`) }} />}
    </div>
  )
}
