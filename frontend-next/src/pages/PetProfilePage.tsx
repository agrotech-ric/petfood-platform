import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { petService, type HealthRecord, type PetContraindications, type PetFood, type PetProfileData } from '../../services/petService'
import { referenceService, type ActivityType, type Symptom } from '../../services/referenceService'
import styles from '../styles/PetProfile.module.css'
import EditIcon from '../assets/icons/edit.svg?react'
import EditIcon1 from '../assets/icons/edit1.svg?react'
import DeleteIcon from '../assets/icons/delete.svg?react'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'
import heartOrange from '../assets/figma/pets-list/heart-orange.svg'
import heartWhite from '../assets/figma/pets-list/heart-white.svg'
import ReloadIcon from '../assets/icons/reload.svg?react'

type Tab = 'food' | 'condition' | 'history' | 'contra' | 'weight' | 'activity'

type PetProfileView = {
  id: string
  name: string
  age: string
  breed: string
  gender: string
  birthDate: string
  weight: string
  activityLevel: string
  reproductiveStatus: string
  description: string
  photoUrl?: string
}

type PetCurrentCondition = {
  id: string
  date: string
  disease: string
  description: string
  symptoms: string[]
}

type PetDiseaseHistory = {
  id: string
  date: string
  disease: string
  symptoms: string
  description: string
}

type WeightEntry = {
  id: string
  date: string
  weight: number
}

type ActivityEntry = {
  id: string
  date: string
  hours: number
  label: string
}

type PetFoodView = {
  id: string
  name: string
  type: string
  format: string
  calories: number
  lastModified: string
}

type RefDefaults = {
  activityTypeId: number
  symptomId: number
}

function formatDate(value?: string, fallback = 'Не указано') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(value?: string, fallback = 'Не указано') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU')
}

function mapPetFoods(foods: PetFood[]): PetFoodView[] {
  return foods.map((food) => ({
    id: food.id,
    name: food.name,
    type: food.type,
    format: food.format,
    calories: food.calories,
    lastModified: formatShortDate(food.updatedAt),
  }))
}

function calculateAge(birthDate?: string) {
  if (!birthDate) return 'Не указано'
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return 'Не указано'

  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years <= 0) {
    return `${Math.max(months, 0)} мес.`
  }

  const yearWord = years % 10 === 1 && years % 100 !== 11 ? 'год' : years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20) ? 'года' : 'лет'
  return months > 0 ? `${years} ${yearWord} ${months} мес.` : `${years} ${yearWord}`
}

function formatGender(gender?: string) {
  if (!gender) return 'Не указано'
  const normalized = gender.toLowerCase()
  if (normalized === 'male') return 'Самец'
  if (normalized === 'female') return 'Самка'
  return gender
}

function normalizeWeight(weight?: number) {
  if (weight == null || Number.isNaN(weight)) return 'Не указано'
  return Number.isInteger(weight) ? String(weight) : String(Number(weight.toFixed(1)))
}

function sortRecordsAsc(records: HealthRecord[]) {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()
    return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime)
  })
}

function sortRecordsDesc(records: HealthRecord[]) {
  return sortRecordsAsc(records).reverse()
}

function getRecordDescription(record?: HealthRecord) {
  return record?.comments?.trim() || 'Описание не указано'
}

function isConditionRecord(record: HealthRecord) {
  return Boolean(record.conditionName?.trim())
}

function isCurrentConditionRecord(record: HealthRecord) {
  return isConditionRecord(record) && record.conditionStatus !== 'history'
}

function isHistoryConditionRecord(record: HealthRecord) {
  return isConditionRecord(record) && record.conditionStatus === 'history'
}

function getConditionDisease(record: HealthRecord) {
  return record.conditionName?.trim() || 'Не указано'
}

function getRecordDate(record: HealthRecord) {
  return record.recordDate || record.createdAt
}

function mapPetToView(pet: PetProfileData, latestRecord?: HealthRecord, photoUrl?: string): PetProfileView {
  return {
    id: pet.id,
    name: pet.name || 'Без имени',
    age: calculateAge(pet.birthDate),
    breed: pet.breedName || 'Не указано',
    gender: formatGender(pet.gender),
    birthDate: formatDate(pet.birthDate),
    weight: normalizeWeight(pet.weightKg),
    activityLevel: latestRecord?.activityTypeName || 'Не указано',
    reproductiveStatus: pet.reproductiveSubStatusName || pet.reproductiveStatusName || 'Не указано',
    description: pet.comments?.trim() || 'Описание пока не добавлено',
    photoUrl,
  }
}

function mapCurrentCondition(record?: HealthRecord): PetCurrentCondition | null {
  if (!record) return null
  return {
    id: record.id,
    date: formatShortDate(getRecordDate(record)),
    disease: getConditionDisease(record),
    description: getRecordDescription(record),
    symptoms: record.symptoms?.length ? record.symptoms : ['Нет симптомов'],
  }
}

function mapDiseaseHistory(records: HealthRecord[]): PetDiseaseHistory[] {
  return sortRecordsDesc(records).filter(isHistoryConditionRecord).map((record) => ({
    id: record.id,
    date: formatShortDate(getRecordDate(record)),
    disease: getConditionDisease(record),
    symptoms: record.symptoms?.join(', ') || 'Нет симптомов',
    description: getRecordDescription(record),
  }))
}

function mapWeightHistory(records: HealthRecord[], pet?: PetProfileData): WeightEntry[] {
  const entries = sortRecordsAsc(records)
    .filter((record) => record.weightKg != null)
    .map((record) => ({
      id: record.id,
      date: formatShortDate(getRecordDate(record)),
      weight: Number(record.weightKg),
    }))

  if (entries.length === 0 && pet?.weightKg != null) {
    entries.push({
      id: pet.id,
      date: formatShortDate(pet.updatedAt || pet.createdAt || pet.birthDate),
      weight: pet.weightKg,
    })
  }

  return entries
}

function estimateActivityHours(activityName?: string) {
  const value = activityName?.toLowerCase() || ''
  if (value.includes('extreme') || value.includes('экстрем') || value.includes('очень')) return 5
  if (value.includes('active') || value.includes('актив') || value.includes('высок')) return 4
  if (value.includes('moderate') || value.includes('сред')) return 3
  if (value.includes('low') || value.includes('низ')) return 2
  if (value.includes('passive') || value.includes('пассив')) return 1
  return 1
}

function mapActivityHistory(records: HealthRecord[]): ActivityEntry[] {
  return sortRecordsAsc(records).filter((record) => record.activityHours != null).map((record) => ({
    id: record.id,
    date: formatShortDate(getRecordDate(record)),
    hours: Number(record.activityHours),
    label: record.activityTypeName || 'Не указано',
  }))
}

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
  const maxY = Math.max(1, ...values) * 1.2
  const minY = 0
  const stepCount = Math.max(data.length - 1, 1)

  const toX = (i: number) => padL + (i / stepCount) * (W - padL - padR)
  const toY = (v: number) => padT + (1 - (v - minY) / (maxY - minY)) * (H - padT - padB)

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')

  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  // X axis: show first/mid/last labels
  const xLabels = data.length
    ? Array.from(new Set([0, Math.floor(data.length / 2), data.length - 1]))
    : []

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
        {points && <polyline points={points} fill="none" stroke={color} strokeWidth="2" />}

        {/* Dots */}
        {data.map((d, i) => (
          <circle
            key={`${d.date}-${i}`} cx={toX(i)} cy={toY(d.value)} r={4} fill={color}
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
function TabFood({ foods }: { foods: PetFoodView[] }) {
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
            {foods.length === 0 ? (
              <tr><td colSpan={6}>Записей пока нет</td></tr>
            ) : foods.map(f => (
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
function TabCondition({
  condition,
  onDelete,
  onMoveToHistory,
  savingId,
}: {
  condition: PetCurrentCondition | null
  onDelete: (recordId: string) => Promise<void>
  onMoveToHistory: () => void
  savingId?: string
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const c = condition ?? {
    id: '',
    date: 'Нет записей',
    disease: 'Не указано',
    description: 'Записей о текущем состоянии пока нет',
    symptoms: ['Нет данных'],
  }

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
          <EditIcon1 width={14} height={14} className="no-filter" />
          Изменить
        </button>
        <button className={styles.conditionActionBtn} disabled={!condition} onClick={onMoveToHistory}>
          <ReloadIcon width={20} height={20} className="no-filter" />
          Переместить в историю болезней
        </button>
        <button className={styles.dangerBtn} disabled={!condition || savingId === condition.id} onClick={() => condition && void onDelete(condition.id)}>
          <DeleteIcon width={14} height={14} className="no-filter" />
          Удалить
        </button>
      </div>
    </div>
  )
}

// ── Tab: История болезней ───────────────────────────────────────
function TabHistory({
  items,
  onDelete,
  savingId,
}: {
  items: PetDiseaseHistory[]
  onDelete: (recordId: string) => Promise<void>
  savingId?: string
}) {
  const { id } = useParams()
  const navigate = useNavigate()

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
            {items.length === 0 ? (
              <tr><td colSpan={5}>Записей пока нет</td></tr>
            ) : items.map(h => (
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
                <EditIcon1 width={20} height={20} className="no-filter" />
              </button>
              <button className={`${styles.iconActionBtn} ${styles.iconActionBtnDanger}`}
                title="Удалить" disabled={savingId === h.id} onClick={() => void onDelete(h.id)}>
                    <DeleteIcon width={20} height={20} className="no-filter" />
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
function TabContra({ contraindications }: { contraindications: PetContraindications }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const c = contraindications
  return (
    <div>
      <p className={styles.sectionLabel}>Нежелательные ингредиенты</p>
      <div className={styles.chipsRow}>
        {c.ingredients.length === 0
          ? <span className={styles.chip}>Нет данных</span>
          : c.ingredients.map(i => <span key={i} className={styles.chip}>{i}</span>)}
      </div>
      <p className={styles.conditionLabel}>Описание</p>
      <p className={styles.conditionValue}>{c.description || 'Описание пока не добавлено'}</p>
      <button
        className={styles.actionCardBtn}
        onClick={() => navigate(`/pet-profile/${id}/edit-contraindications`, { state: { fromTab: 'contra' } })}
      >
        <EditIcon1 width={20} height={20} className="no-filter" />
        Изменить
      </button>
    </div>
  )
}

// ── Tab: График веса ────────────────────────────────────────────
function TabWeight({
  items,
  onAdd,
  onDelete,
  savingId,
  savingNew,
}: {
  items: WeightEntry[]
  onAdd: (recordDate: string, weight: number) => Promise<void>
  onDelete: (recordId: string) => Promise<void>
  savingId?: string
  savingNew: boolean
}) {
  const [newDate, setNewDate] = useState('')
  const [newWeight, setNewWeight] = useState('')

  const addEntry = async () => {
    if (!newDate || !newWeight) return
    await onAdd(newDate, Number(newWeight))
    setNewDate('')
    setNewWeight('')
  }

  const chartData = items.map(e => ({ date: e.date, value: e.weight }))

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
              <button className={styles.addRowBtn} disabled={savingNew} onClick={() => void addEntry()}>+</button>
            </div>
            <table className={styles.chartTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Вес, кг</th>
                  <th>Удалить</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={3}>Записей пока нет</td></tr>
                ) : items.map(e => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.weight}</td>
                    <td>
                      <button className={styles.removeBtn} disabled={savingId === e.id} onClick={() => void onDelete(e.id)}>X</button>
                    </td>
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

// ── Tab: Активность ─────────────────────────────────────────────
function TabActivity({
  items,
  onAdd,
  onDelete,
  savingId,
  savingNew,
}: {
  items: ActivityEntry[]
  onAdd: (recordDate: string, hours: number) => Promise<void>
  onDelete: (recordId: string) => Promise<void>
  savingId?: string
  savingNew: boolean
}) {
  const [newDate, setNewDate] = useState('')
  const [newHours, setNewHours] = useState('')

  const addEntry = async () => {
    if (!newDate || !newHours) return
    await onAdd(newDate, Number(newHours))
    setNewDate('')
    setNewHours('')
  }

  const chartData = items.map(e => ({ date: e.date, value: e.hours }))

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
              <button className={styles.addRowBtn} disabled={savingNew} onClick={() => void addEntry()}>+</button>
            </div>
            <table className={styles.chartTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Время, ч</th>
                  <th>Удалить</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={3}>Записей пока нет</td></tr>
                ) : items.map(e => (
                  <tr key={e.id} title={e.label}>
                    <td>{e.date}</td>
                    <td>{e.hours}</td>
                    <td>
                      <button className={styles.removeBtn} disabled={savingId === e.id} onClick={() => void onDelete(e.id)}>X</button>
                    </td>
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

// ── Main page ───────────────────────────────────────────────────
export function PetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { tab?: Tab; fromTab?: Tab } | null
  const initialTab = locationState?.tab ?? locationState?.fromTab ?? 'food'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [liked, setLiked] = useState(false)
  const [petData, setPetData] = useState<PetProfileData | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [petFoods, setPetFoods] = useState<PetFood[]>([])
  const [petContraindications, setPetContraindications] = useState<PetContraindications | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [savingNewRecord, setSavingNewRecord] = useState(false)
  const [savingRecordId, setSavingRecordId] = useState<string>()
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [deletingPet, setDeletingPet] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Питомец не найден')
      setLoading(false)
      return
    }

    let cancelled = false

    const loadProfile = async () => {
      setLoading(true)
      setError('')
      setPhotoUrl(undefined)

      try {
        const [pet, records] = await Promise.all([
          petService.getPet(id),
          petService.getHealthRecords(id),
        ])

        if (cancelled) return

        setPetData(pet)
        setHealthRecords(records)

        void petService.getPetFoods(id)
          .then((foods) => {
            if (!cancelled) setPetFoods(foods)
          })
          .catch(() => {
            if (!cancelled) setPetFoods([])
          })

        void petService.getContraindications(id)
          .then((contraindications) => {
            if (!cancelled) setPetContraindications(contraindications)
          })
          .catch(() => {
            if (!cancelled) setPetContraindications({ petId: id, ingredients: [], description: '' })
          })

        void petService.getFavoriteStatus(id)
          .then((status) => {
            if (!cancelled) setLiked(status.favorite)
          })
          .catch(() => {
            if (!cancelled) setLiked(false)
          })

        void Promise.all([
          referenceService.fetchActivityTypes(),
          referenceService.fetchSymptoms(),
        ]).then(([acts, syms]) => {
          if (!cancelled) {
            setActivityTypes(acts)
            setSymptoms(syms)
          }
        }).catch(() => {
          if (!cancelled) {
            setActivityTypes([])
            setSymptoms([])
          }
        })

        if (pet.photoObjectKey) {
          try {
            const photo = await petService.getPhotoDownloadUrl(pet.photoObjectKey)
            if (!cancelled) setPhotoUrl(photo.url)
          } catch {
            if (!cancelled) setPhotoUrl(undefined)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setPetData(null)
          setHealthRecords([])
          setPetFoods([])
          setPetContraindications(null)
          setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль питомца')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [id])

  const latestRecord = useMemo(() => sortRecordsDesc(healthRecords)[0], [healthRecords])
  const latestConditionRecord = useMemo(() => sortRecordsDesc(healthRecords).find(isCurrentConditionRecord), [healthRecords])

  const pet = useMemo(
    () => petData ? mapPetToView(petData, latestRecord, photoUrl) : null,
    [latestRecord, petData, photoUrl],
  )

  const currentCondition = useMemo(() => mapCurrentCondition(latestConditionRecord), [latestConditionRecord])
  const diseaseHistory = useMemo(() => mapDiseaseHistory(healthRecords), [healthRecords])
  const weightHistory = useMemo(() => mapWeightHistory(healthRecords, petData ?? undefined), [healthRecords, petData])
  const activityHistory = useMemo(() => mapActivityHistory(healthRecords), [healthRecords])
  const foodItems = useMemo(() => mapPetFoods(petFoods), [petFoods])

  const refDefaults = useMemo<RefDefaults | null>(() => {
    const activityTypeId = activityTypes[0]?.id
    const symptomId = symptoms.find((item) => {
      const label = (item.nameRu || item.name || item.nameEn || '').toLowerCase()
      return label === 'нет' || label.includes('нет')
    })?.id ?? symptoms[0]?.id

    if (!activityTypeId || !symptomId) return null
    return { activityTypeId, symptomId }
  }, [activityTypes, symptoms])

  const createRecord = async (data: { recordDate: string; weightKg?: number; activityHours?: number; notes: string }) => {
    if (!id || !refDefaults) {
      setActionError('Справочники ещё не загружены, попробуйте ещё раз')
      return
    }

    setSavingNewRecord(true)
    setActionError('')

    try {
      const created = await petService.createHealthRecord(id, {
        activityTypeId: refDefaults.activityTypeId,
        symptomIds: [refDefaults.symptomId],
        recordDate: data.recordDate,
        weightKg: data.weightKg,
        activityHours: data.activityHours,
        notes: data.notes,
      })

      setHealthRecords((prev) => [...prev, created])
      if (data.weightKg != null) {
        setPetData((prev) => prev ? { ...prev, weightKg: data.weightKg } : prev)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось сохранить запись')
      throw err
    } finally {
      setSavingNewRecord(false)
    }
  }

  const deleteRecord = async (recordId: string) => {
    if (!id) return

    setSavingRecordId(recordId)
    setActionError('')

    try {
      await petService.deleteHealthRecord(id, recordId)
      setHealthRecords((prev) => prev.filter((record) => record.id !== recordId))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить запись')
    } finally {
      setSavingRecordId(undefined)
    }
  }

  const moveCurrentConditionToHistory = async () => {
    if (!id || !latestConditionRecord) return

    setSavingRecordId(latestConditionRecord.id)
    setActionError('')

    try {
      const updated = await petService.updateHealthRecord(id, latestConditionRecord.id, {
        conditionStatus: 'history',
      })

      setHealthRecords((prev) => prev.map((record) => record.id === updated.id ? updated : record))
      setActiveTab('history')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось переместить запись в историю болезней')
    } finally {
      setSavingRecordId(undefined)
    }
  }

  const onToggleLike = async () => {
    if (!id || savingFavorite) return

    const next = !liked
    setLiked(next)
    setSavingFavorite(true)
    setActionError('')

    try {
      if (next) {
        await petService.addFavorite(id)
      } else {
        await petService.removeFavorite(id)
      }
    } catch (err) {
      setLiked(!next)
      setActionError(err instanceof Error ? err.message : 'Не удалось обновить избранное')
    } finally {
      setSavingFavorite(false)
    }
  }

  const deletePet = async () => {
    if (!id || deletingPet) return
    if (!window.confirm('Удалить профиль питомца?')) return

    setDeletingPet(true)
    setActionError('')

    try {
      await petService.deletePet(id)
      navigate('/dashboard')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не удалось удалить питомца')
      setDeletingPet(false)
    }
  }

  const sharePet = async () => {
    if (!pet) return
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: pet.name, text: 'Профиль питомца', url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // User cancelled native share dialog.
    }
  }

  const downloadPhoto = () => {
    if (!pet?.photoUrl) return
    window.open(pet.photoUrl, '_blank', 'noopener,noreferrer')
  }

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
            disabled={!petData}
          >
            <EditIcon width={14} height={14} className="no-filter" />
            Изменить
          </button>
          <button className={styles.deleteBtn} disabled={!petData || deletingPet} onClick={() => void deletePet()}>
            <DeleteIcon width={14} height={14} className="no-filter" />
            Удалить
          </button>
        </div>
      </div>

      {/* Pet info card */}
      <div className={styles.petCard}>
        {pet?.photoUrl ? (
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
            <h2 className={styles.petName}>{loading ? 'Загрузка...' : pet?.name ?? 'Питомец не найден'}</h2>
            <p className={styles.petAgeLine}>Возраст: {pet?.age ?? 'Не указано'}<br />ID: {pet?.id ?? id}</p>
            {error ? (
              <p className={styles.conditionValue}>{error}</p>
            ) : (
              <div className={styles.petFields}>
                {[
                  { label: 'Порода', value: pet?.breed ?? 'Не указано' },
                  { label: 'Пол', value: pet?.gender ?? 'Не указано' },
                  { label: 'Дата рождения', value: pet?.birthDate ?? 'Не указано' },
                  { label: 'Вес', value: pet ? `${pet.weight} кг` : 'Не указано' },
                  { label: 'Уровень активности', value: pet?.activityLevel ?? 'Не указано' },
                  { label: 'Репродуктивный статус', value: pet?.reproductiveStatus ?? 'Не указано' },
                ].map(f => (
                  <div key={f.label} className={styles.petFieldRow}>
                    <span className={styles.petFieldLabel}>{f.label}</span>
                    <span className={styles.petFieldValue}>{f.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.petInfoRight}>
            <div className={styles.petActions}>
              <button
                className={styles.heartBtn}
                type="button"
                aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
                disabled={!petData || savingFavorite}
                onClick={(e) => {
                  e.stopPropagation()
                  void onToggleLike()
                }}
              >
                <img alt="" src={liked ? heartOrange : heartWhite} className={styles.heartIcon} />
              </button>
              <button className={styles.iconBtn} title="Поделиться" disabled={!petData} onClick={() => void sharePet()}>
                <ShareIcon width={30} height={30} />
              </button>
              <button className={styles.iconBtn} title="Скачать" disabled={!pet?.photoUrl} onClick={downloadPhoto}>
                <DownloadIcon width={30} height={30} />
              </button>
            </div>
            <p className={styles.descriptionLabel}>Описание</p>
            <p className={styles.descriptionText}>{pet?.description ?? 'Описание пока не добавлено'}</p>
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
        <div className={styles.tabsDropdown}>
          <select
            className={styles.tabsSelect}
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as Tab)}
          >
            {tabs.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.tabContent}>
          {actionError && <p className={styles.conditionValue}>{actionError}</p>}
          {activeTab === 'food' && <TabFood foods={foodItems} />}
          {activeTab === 'condition' && (
            <TabCondition
              condition={currentCondition}
              onDelete={deleteRecord}
              onMoveToHistory={moveCurrentConditionToHistory}
              savingId={savingRecordId}
            />
          )}
          {activeTab === 'history' && (
            <TabHistory
              items={diseaseHistory}
              onDelete={deleteRecord}
              savingId={savingRecordId}
            />
          )}
          {activeTab === 'contra' && (
            <TabContra contraindications={petContraindications ?? { petId: id ?? '', ingredients: [], description: '' }} />
          )}
          {activeTab === 'weight' && (
            <TabWeight
              items={weightHistory}
              onAdd={(recordDate, weightKg) => createRecord({
                recordDate,
                weightKg,
                notes: `Вес: ${weightKg} кг`,
              })}
              onDelete={deleteRecord}
              savingId={savingRecordId}
              savingNew={savingNewRecord}
            />
          )}
          {activeTab === 'activity' && (
            <TabActivity
              items={activityHistory}
              onAdd={(recordDate, activityHours) => createRecord({
                recordDate,
                activityHours,
                weightKg: petData?.weightKg,
                notes: `Активность: ${activityHours} ч`,
              })}
              onDelete={deleteRecord}
              savingId={savingRecordId}
              savingNew={savingNewRecord}
            />
          )}
        </div>
      </div>
    </div>
  )
}
