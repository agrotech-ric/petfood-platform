import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  INGREDIENT_CATEGORIES, DOG_BREEDS, AGE_OPTIONS, ACTIVITY_OPTIONS,
  REPRODUCTIVE_OPTIONS, GENDER_OPTIONS, AGE_CATEGORY_OPTIONS,
  BREED_SIZE_OPTIONS, HEALTH_CONDITIONS, SYMPTOMS_OPTIONS,
  NUTRIENT_LIMITS, MAXIMIZE_OPTIONS, MOCK_RECIPE_RESULT,
} from '../data/createRecipeMock'
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

// ── Step 1 ──────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  const [foodName, setFoodName] = useState('')
  const [foodDesc, setFoodDesc] = useState('')
  const [foodType, setFoodType] = useState<'domestic' | 'commercial'>('domestic')
  const [ageCategory, setAgeCategory] = useState('Для щенков')
  const [breedSize, setBreedSize] = useState('Для всех')
  const [weight, setWeight] = useState('12')
  const [breed, setBreed] = useState('Золотистый ретривер')
  const [age, setAge] = useState('1 год')
  const [gender, setGender] = useState('Самец')
  const [activity, setActivity] = useState('Пасивный')
  const [reproductive, setReproductive] = useState('Нет')
  const [healthCondition, setHealthCondition] = useState('Аллергия')
  const [symptomSearch, setSymptomSearch] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Кашель', 'Вялость', 'Отсутствие аппетита', 'Затрудненное дыхание'])

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const filteredSymptoms = SYMPTOMS_OPTIONS.filter(s =>
    s.toLowerCase().includes(symptomSearch.toLowerCase())
  )

  return (
    <>
      {/* Food params */}
      <div className={styles.card}>
        <p className={styles.sectionTitle}>Параметры корма</p>
        <div className={styles.formGrid2}>
          <div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Название корма</label>
              <input className={styles.fieldInput} placeholder="Введите название корма"
                value={foodName} onChange={e => setFoodName(e.target.value)} />
            </div>
            <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
              <label className={styles.fieldLabel}>Описание корма</label>
              <textarea className={styles.fieldTextarea}
                placeholder="Введите описание продукта, его назначение"
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
                {filteredSymptoms.map(s => <option key={s}>{s}</option>)}
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
          Создать рекомендации
        </button>
      </div>
    </>
  )
}

// ── Step 2 ──────────────────────────────────────────────────────
function Step2({ onNext }: { onNext: () => void }) {
  const [energy, setEnergy] = useState('375')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([
    'Кукуруза — Обыкновенный', 'Животный Жир — Говяжий',
    'Вода — Обыкновенный', 'Курица — Мясо', 'Горох — Зелёный Горошек',
  ])
  const [ingredientLimits, setIngredientLimits] = useState<Record<string, number>>({})
  const [nutrientLimits] = useState(NUTRIENT_LIMITS)
  const [maximize, setMaximize] = useState('')

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

  const getIngLimit = (name: string) => ingredientLimits[name] ?? 0

  return (
    <>
      <div className={styles.card}>
        {/* Energy */}
        <p className={styles.sectionTitle}>Целевая энергия (ккал)</p>
        <div className={styles.energyRow}>
          <input className={styles.energyInput} type="number"
            value={energy} onChange={e => setEnergy(e.target.value)} />
          <span className={styles.energyHint}>Рекомендуемая: 375 ккал</span>
          <div className={styles.energyFormula}>
            Было рассчитано по формуле{' '}
            <span className={styles.formulaLink}>Подробнее</span>
            <span className={styles.formulaText}>
              kcal = 95 · вес<sup>0.75</sup>
            </span>
          </div>
        </div>

        {/* Ingredient selection */}
        <p className={styles.sectionTitle}>Выбор ингредиентов</p>
        <div className={styles.twoPanel}>
          <div className={styles.accordionList}>
            {INGREDIENT_CATEGORIES.map(cat => (
              <div key={cat.key} className={styles.accordionItem}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggleCategory(cat.key)}
                >
                  <span className={styles.accordionChevron}>
                    {openCategories.has(cat.key) ? '▼' : '›'}
                  </span>
                  {cat.label}
                </button>
                {openCategories.has(cat.key) && (
                  <div className={styles.accordionBody}>
                    {cat.items.map(item => (
                      <span
                        key={item}
                        className={`${styles.ingredientTag} ${selectedIngredients.includes(item) ? styles.ingredientTagActive : ''}`}
                        onClick={() => toggleIngredient(item)}
                      >
                        {item}
                        {selectedIngredients.includes(item) && ' ×'}
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
                    onClick={() => toggleIngredient(ing)}
                  >×</button>
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

        {/* Ingredient limits (sliders) */}
        {selectedIngredients.length > 0 && (
          <>
            <p className={styles.sectionTitle}>
              Ограничения по количеству ингредиентов (в % от 100 г):
            </p>
            {selectedIngredients.map(ing => (
              <div key={ing} className={styles.sliderRow}>
                <span className={styles.sliderLabel}>{ing}:</span>
                <span className={styles.sliderMinVal}>{getIngLimit(ing)}</span>
                <div className={styles.sliderTrack}>
                  <input type="range" className={styles.sliderRange}
                    min={0} max={100} value={getIngLimit(ing)}
                    onChange={e => setIngredientLimits(prev => ({
                      ...prev, [ing]: Number(e.target.value)
                    }))}
                  />
                </div>
                <span className={styles.sliderMaxVal}>100</span>
              </div>
            ))}
          </>
        )}

        {/* Nutrient limits */}
        <p className={styles.sectionTitle} style={{ marginTop: 20 }}>
          Ограничения по нутриентам:
        </p>
        {nutrientLimits.map(n => (
          <div key={n.key} className={styles.sliderRow}>
            <span className={styles.sliderLabel}>{n.label}:</span>
            <span className={styles.sliderMinVal}>{n.defaultMin}</span>
            <div className={styles.sliderTrack}>
              <input type="range" className={styles.sliderRange}
                min={n.min} max={n.max} step={0.01}
                defaultValue={(n.defaultMin + n.defaultMax) / 2}
              />
            </div>
            <span className={styles.sliderMaxVal}>{n.defaultMax}</span>
          </div>
        ))}

        {/* Maximize */}
        <p className={styles.sectionTitle} style={{ marginTop: 20 }}>Максимизация</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
          Выберите нутриенты для максимизации:
        </p>
        <select className={styles.fieldSelect} value={maximize}
          onChange={e => setMaximize(e.target.value)}
          style={{ maxWidth: 400 }}>
          <option value="">Выберите нутриенты</option>
          {MAXIMIZE_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>

        <div>
          <button className={styles.primaryBtn} style={{ marginTop: 24 }} onClick={onNext}>
            Рассчитать оптимальный состав
          </button>
        </div>
      </div>
    </>
  )
}

// ── Step 3 ──────────────────────────────────────────────────────
function Step3({ onSave }: { onSave: () => void }) {
  const r = MOCK_RECIPE_RESULT
  return (
    <>
      {/* Metrics */}
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

      {/* Charts */}
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

      {/* Nutrients */}
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

      {/* Bar charts */}
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
          Сохранить
        </button>
      </div>
    </>
  )
}

// ── Main wizard ─────────────────────────────────────────────────
export function CreateRecipePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const stepTitles = {
    1: 'Создание корма',
    2: 'Создание корма',
    3: 'Создание корма',
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn}
          onClick={() => step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : navigate('/recipes')}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>{stepTitles[step]}</h1>
        <button className={styles.deleteBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Удалить
        </button>
      </div>

      {step === 1 && <Step1 onNext={() => setStep(2)} />}
      {step === 2 && <Step2 onNext={() => setStep(3)} />}
      {step === 3 && <Step3 onSave={() => navigate('/recipes')} />}
    </div>
  )
}
