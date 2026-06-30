import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  MOCK_PET, MOCK_PET_FOODS, MOCK_CURRENT_CONDITION,
  MOCK_DISEASE_HISTORY, MOCK_CONTRAINDICATIONS,
  MOCK_WEIGHT_HISTORY, MOCK_ACTIVITY_HISTORY,
  type WeightEntry, type ActivityEntry, type PetDiseaseHistory,
} from '../data/petProfileMock'
import styles from '../styles/PetProfile.module.css'
import DateIcon from '../assets/icons/date.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import EditIcon1 from '../assets/icons/edit1.svg?react'
import DeleteIcon from '../assets/icons/delete.svg?react'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'
import heartOrange from '../assets/figma/pets-list/heart-orange.svg'
import heartWhite from '../assets/figma/pets-list/heart-white.svg'
import ReloadIcon from '../assets/icons/reload.svg?react'


type Tab = 'food' | 'condition' | 'history' | 'contra' | 'weight' | 'activity'

// ── SVG Line Chart ──────────────────────────────────────────────
function LineChart({
  data, yLabel, color = '#4a90d9',
}: {
  data: { date: string; value: number }[]
  yLabel: string
  color?: string
}) {
  const W = 320, H = 180, padL = 36, padB = 32, padT = 20, padR = 16
  const values = data.map(d => d.value)
  const maxY = Math.max(...values) * 1.2
  const minY = 0

  const toX = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR)
  const toY = (v: number) => padT + (1 - (v - minY) / (maxY - minY)) * (H - padT - padB)

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')

  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  // X axis: show first/mid/last labels
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1]

  // Y ticks
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), Math.round(maxY)]

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svgChart}>
        {/* Grid */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)} stroke="#eee" strokeWidth="1" />
            <text x={padL - 4} y={toY(v) + 3} fontSize="9" fill="#aaa" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map(i => (
          <text key={i} x={toX(i)} y={H - 4} fontSize="8" fill="#aaa" textAnchor="middle">
            {data[i]?.date.slice(3)}
          </text>
        ))}

        {/* Y label */}
        <text x={10} y={H / 2} fontSize="9" fill="#888" textAnchor="middle"
          transform={`rotate(-90, 10, ${H / 2})`}>{yLabel}</text>

        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" />

        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={i} cx={toX(i)} cy={toY(d.value)} r={4} fill={color}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x: toX(i), y: toY(d.value) - 10, text: `${d.value} • ${d.date}` })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      {tooltip && (
        <div className={styles.tooltipBox}
          style={{ left: tooltip.x, top: tooltip.y, position: 'absolute', transform: 'translateX(-50%)' }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// ── Tab: Питание ────────────────────────────────────────────────
function TabFood() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Корм</th>
              <th>Тип</th>
              <th>Формат</th>
              <th>Калорийность</th>
              <th>Последнее изменения</th>
              <th>Изменить</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PET_FOODS.map(f => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.type}</td>
                <td>{f.format}</td>
                <td>{f.calories}</td>
                <td>{f.lastModified}</td>
                <td>
                  <button
                  className={styles.iconActionBtn} title="Изменить"
                  onClick={() => navigate(`/recipes/${f.id}`, { state: { from: 'pet-profile', petId: id, fromTab: 'food' } })}
                  >
                    <EditIcon1 width={14} height={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button 
        className={styles.primaryBtn}
        onClick={() => navigate(`/recipes/create`, { state: { from: 'pet-profile', petId: id, fromTab: 'food' } })}
        >
        + Рассчитать рецепт
      </button>
    </div>
  )
}

// ── Tab: Текущее состояние ──────────────────────────────────────
function TabCondition() {
  const { id } = useParams()
  const navigate = useNavigate()
  const c = MOCK_CURRENT_CONDITION
  return (
    <div>
      <p className={styles.conditionDate}>{c.date}</p>
      <p className={styles.conditionLabel}>Заболевание</p>
      <p className={styles.conditionValue}>{c.disease}</p>
      <p className={styles.conditionLabel}>Описание</p>
      <p className={styles.conditionValue}>{c.description}</p>
      <p className={styles.conditionLabel}>Симптомы</p>
      <div className={styles.chipsRow}>
        {c.symptoms.map(s => <span key={s} className={styles.chip}>{s}</span>)}
      </div>
      <div className={styles.conditionActions}>
        <button
          className={styles.conditionActionBtn}
          onClick={() => navigate(`/pet-profile/${id}/edit-current-condition`, { state: { fromTab: 'condition' } })}
        >
          <EditIcon1 width={14} height={14} />
          Изменить
        </button>
        <button className={styles.conditionActionBtn}>
          <ReloadIcon width={20} height={20} />
          Переместить в историю болезней
        </button>
        <button className={styles.dangerBtn}>
          <DeleteIcon width={14} height={14} />
          Удалить
        </button>
      </div>
    </div>
  )
}

// ── Tab: История болезней ───────────────────────────────────────
function TabHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [history, setHistory] = useState<PetDiseaseHistory[]>(MOCK_DISEASE_HISTORY)
  const removeEntry = (id: number) => setHistory(prev => prev.filter(h => h.id !== id))

  return (
    <div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Заболевание</th>
              <th>Симптомы</th>
              <th>Описание</th>
              <th>Изменить</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id}>
                <td>{h.date}</td>
                <td>{h.disease}</td>
                <td>{h.symptoms}</td>
                <td>{h.description}</td>
                <td>
              <button
                className={styles.iconActionBtn}
                title="Изменить"
                onClick={() => navigate(`/pet-profile/${id}/history/${h.id}`, { state: { fromTab: 'history' } })}
              >
                <EditIcon1 width={20} height={20} />
              </button>
              <button className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                title="Удалить" onClick={() => removeEntry(h.id)}>
                    <DeleteIcon width={20} height={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className={styles.actionCardBtn}
        onClick={() => navigate(`/pet-profile/${id}/history/new`, { state: { fromTab: 'history' } })}
      >+ Добавить запись</button>
    </div>
  )
}

// ── Tab: Противопоказания ───────────────────────────────────────
function TabContra() {
  const { id } = useParams()
  const navigate = useNavigate()
  const c = MOCK_CONTRAINDICATIONS
  return (
    <div>
      <p className={styles.sectionLabel}>Нежелательные ингредиенты</p>
      <div className={styles.chipsRow}>
        {c.ingredients.map(i => <span key={i} className={styles.chip}>{i}</span>)}
      </div>
      <p className={styles.conditionLabel}>Описание</p>
      <p className={styles.conditionValue}>{c.description}</p>
      <button
        className={styles.actionCardBtn}
        onClick={() => navigate(`/pet-profile/${id}/edit-contraindications`, { state: { fromTab: 'contra' } })}
      >
        <EditIcon1 width={20} height={20} />
        Изменить
      </button>
    </div>
  )
}

// ── Tab: График веса ────────────────────────────────────────────
function TabWeight() {
  const [entries, setEntries] = useState<WeightEntry[]>(MOCK_WEIGHT_HISTORY)
  const [newDate, setNewDate] = useState('')
  const [newWeight, setNewWeight] = useState('')

  const addEntry = () => {
    if (!newDate || !newWeight) return
    setEntries(prev => [...prev, {
      id: Date.now(), date: newDate, weight: Number(newWeight)
    }])
    setNewDate('')
    setNewWeight('')
  }

  const removeEntry = (id: number) => setEntries(prev => prev.filter(e => e.id !== id))

  const chartData = entries.map(e => ({ date: e.date, value: e.weight }))

  return (
    <div>
      <p className={styles.chartSectionTitle}>Изменение веса</p>
      <div className={styles.chartLayout}>
        <LineChart data={chartData} yLabel="Вес (кг)" color="#4a90d9" />
        <div className={styles.chartTableScroll}>
          <div className={styles.chartTableInner}>
            <div className={styles.chartTableHeader}>
              <input className={styles.chartTableInput} type="date"
                value={newDate} onChange={e => setNewDate(e.target.value)}
                placeholder="Дата" />
              <input className={styles.chartTableInput} type="number"
                value={newWeight} onChange={e => setNewWeight(e.target.value)}
                placeholder="Вес, кг" />
              <button className={styles.addRowBtn} onClick={addEntry}>+</button>
            </div>
            <div className={`${styles.chartTableHead} ${styles.weightHead}`}>
              <span>Дата</span>
              <span>Вес, кг</span>
              <span>Удалить</span>
            </div>
            {entries.map(e => (
              <div key={e.id} className={`${styles.chartTableRow} ${styles.weightHead}`}>
                <span>{e.date}</span>
                <span>{e.weight}</span>
                <button className={styles.removeBtn} onClick={() => removeEntry(e.id)}>X</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Активность ─────────────────────────────────────────────
function TabActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>(MOCK_ACTIVITY_HISTORY)
  const [newDate, setNewDate] = useState('')
  const [newHours, setNewHours] = useState('')

  const addEntry = () => {
    if (!newDate || !newHours) return
    setEntries(prev => [...prev, {
      id: Date.now(), date: newDate, hours: Number(newHours)
    }])
    setNewDate('')
    setNewHours('')
  }

  const removeEntry = (id: number) => setEntries(prev => prev.filter(e => e.id !== id))

  const chartData = entries.map(e => ({ date: e.date, value: e.hours }))

  return (
    <div>
      <p className={styles.chartSectionTitle}>Прогулки</p>
      <div className={styles.chartLayout}>
        <LineChart data={chartData} yLabel="Время, ч" color="#4a90d9" />
        <div className={styles.chartTableScroll}>
          <div className={styles.chartTableInner}>
            <div className={styles.chartTableHeader}>
              <input className={styles.chartTableInput} type="date"
                value={newDate} onChange={e => setNewDate(e.target.value)}
                placeholder="Дата" />
              <input className={styles.chartTableInput} type="number"
                value={newHours} onChange={e => setNewHours(e.target.value)}
                placeholder="Время, ч" />
              <button className={styles.addRowBtn} onClick={addEntry}>+</button>
            </div>
            <div className={`${styles.chartTableHead} ${styles.activityHead}`}>
              <span>Дата</span>
              <span>Время, ч</span>
              <span>Удалить</span>
            </div>
            {entries.map(e => (
              <div key={e.id} className={`${styles.chartTableRow} ${styles.activityHead}`}>
                <span>{e.date}</span>
                <span>{e.hours}</span>
                <button className={styles.removeBtn} onClick={() => removeEntry(e.id)}>X</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export function PetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialTab = ((location.state as any)?.tab as Tab) ?? 'food'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [liked, setLiked] = useState(false)
  const pet = MOCK_PET
  const onToggleLike = () => setLiked(prev => !prev)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'food', label: 'Питание' },
    { key: 'condition', label: 'Текущее состояние' },
    { key: 'history', label: 'История болезней' },
    { key: 'contra', label: 'Противопоказания' },
    { key: 'weight', label: 'График веса' },
    { key: 'activity', label: 'Активность' },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Профиль питомца</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/pet-profile/${id}/edit-profile`, { state: { fromTab: activeTab } })}
          >
            <EditIcon width={14} height={14} />
            Изменить
          </button>
          <button className={styles.deleteBtn}>
            <DeleteIcon width={14} height={14} />
            Удалить
          </button>
        </div>
      </div>

      {/* Pet info card */}
      <div className={styles.petCard}>
        {pet.photoUrl ? (
          <img src={pet.photoUrl} alt={pet.name} className={styles.petPhoto} />
        ) : (
          <div className={styles.petPhotoPlaceholder}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/>
              <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>
              <path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75z"/>
              <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>
            </svg>
          </div>
        )}

        <div className={styles.petInfoMain}>
          <div className={styles.petInfoLeft}>
            <h2 className={styles.petName}>{pet.name}</h2>
            <p className={styles.petAgeLine}>Возраст: {pet.age}<br />ID: {pet.id}</p>
            <div className={styles.petFields}>
              {[
                { label: 'Порода', value: pet.breed },
                { label: 'Пол', value: pet.gender },
                { label: 'Дата рождения', value: pet.birthDate },
                { label: 'Вес', value: `${pet.weight} кг` },
                { label: 'Уровень активности', value: pet.activityLevel },
                { label: 'Репродуктивный статус', value: pet.reproductiveStatus },
              ].map(f => (
                <div key={f.label} className={styles.petFieldRow}>
                  <span className={styles.petFieldLabel}>{f.label}</span>
                  <span className={styles.petFieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.petInfoRight}>
            <div className={styles.petActions}>
              <button
                className={styles.heartBtn}
                type="button"
                aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLike()
                }}
              >
                <img alt="" src={liked ? heartOrange : heartWhite} className={styles.heartIcon} />
              </button>
              <button className={styles.iconBtn} title="Поделиться">
                <ShareIcon width={30} height={30} />
              </button>
              <button className={styles.iconBtn} title="Скачать">
                <DownloadIcon width={30} height={30} />
              </button>
            </div>
            <p className={styles.descriptionLabel}>Описание</p>
            <p className={styles.descriptionText}>{pet.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsCard}>
        <div className={styles.tabsRow}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'food' && <TabFood />}
          {activeTab === 'condition' && <TabCondition />}
          {activeTab === 'history' && <TabHistory />}
          {activeTab === 'contra' && <TabContra />}
          {activeTab === 'weight' && <TabWeight />}
          {activeTab === 'activity' && <TabActivity />}
        </div>
      </div>
    </div>
  )
}
