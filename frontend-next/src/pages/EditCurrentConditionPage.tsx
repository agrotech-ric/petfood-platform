import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { petService, type HealthRecord, type PetProfileData } from '../../services/petService'
import { referenceService, type ActivityType, type Symptom } from '../../services/referenceService'
import styles from '../styles/EditPet.module.css'

function refLabel(item: { name?: string; nameRu?: string; nameEn?: string }) {
  return item.nameRu || item.name || item.nameEn || ''
}

function sortRecordsDesc(records: HealthRecord[]) {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.recordDate || a.createdAt).getTime()
    const bTime = new Date(b.recordDate || b.createdAt).getTime()
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  })
}

function isNoSymptom(value?: string) {
  const normalized = value?.trim().toLowerCase()
  return !normalized || normalized === 'нет' || normalized === 'нет симптомов'
}

function isConditionRecord(record: HealthRecord) {
  return Boolean(record.conditionName?.trim())
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function findSymptomIds(record: HealthRecord | undefined, symptoms: Symptom[]) {
  if (!record?.symptoms?.length) return []
  return symptoms
    .filter((symptom) => record.symptoms?.some((value) => refLabel(symptom) === value || symptom.name === value))
    .map((symptom) => symptom.id)
}

function getDisease(record: HealthRecord | undefined) {
  return record?.conditionName?.trim()
    || record?.symptoms?.find((symptom) => !isNoSymptom(symptom))
    || ''
}

export function EditCurrentConditionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTab = (location.state as any)?.fromTab ?? 'condition'

  const [pet, setPet] = useState<PetProfileData | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [date, setDate] = useState(today())
  const [disease, setDisease] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentRecord = useMemo(() => sortRecordsDesc(records).find(isConditionRecord), [records])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const petId = id

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [loadedPet, loadedRecords, loadedActivities, loadedSymptoms] = await Promise.all([
          petService.getPet(petId),
          petService.getHealthRecords(petId),
          referenceService.fetchActivityTypes(),
          referenceService.fetchSymptoms(),
        ])

        if (cancelled) return

        const conditionRecord = sortRecordsDesc(loadedRecords).find(isConditionRecord)
        setPet(loadedPet)
        setRecords(loadedRecords)
        setActivityTypes(loadedActivities)
        setSymptoms(loadedSymptoms)
        setDate(conditionRecord?.recordDate || today())
        setDisease(getDisease(conditionRecord))
        setDescription(conditionRecord?.comments || '')
        setSelectedSymptomIds(findSymptomIds(conditionRecord, loadedSymptoms))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось загрузить текущее состояние')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [id])

  const toggleSymptom = (symptomId: number) => {
    setSelectedSymptomIds(prev =>
      prev.includes(symptomId) ? prev.filter(x => x !== symptomId) : [...prev, symptomId]
    )
  }

  const goBack = () => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })

  const handleSave = async () => {
    if (!id) return
    const activityTypeId = currentRecord?.activityTypeId ?? activityTypes[0]?.id
    const fallbackSymptom = symptoms.find((symptom) => isNoSymptom(refLabel(symptom))) ?? symptoms[0]
    const symptomIds = selectedSymptomIds.length > 0
      ? selectedSymptomIds
      : fallbackSymptom
        ? [fallbackSymptom.id]
        : []

    if (!activityTypeId || symptomIds.length === 0) {
      setError('Справочники ещё не загружены, попробуйте ещё раз')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      activityTypeId,
      symptomIds,
      conditionName: disease.trim() || 'Не указано',
      conditionStatus: 'current',
      notes: description.trim(),
      weightKg: currentRecord?.weightKg ?? pet?.weightKg,
      activityHours: currentRecord?.activityHours,
      recordDate: date,
    }

    try {
      if (currentRecord) {
        await petService.updateHealthRecord(id, currentRecord.id, payload)
      } else {
        await petService.createHealthRecord(id, payload)
      }
      goBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить текущее состояние')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={goBack}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Текущее состояние здоровья питомца</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
        {error && <p className={styles.fieldLabel}>{error}</p>}
        <div className={styles.twoPanel}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Дата</label>
              <div className={styles.dateWrapper}>
                <input className={styles.fieldInput} type="date" value={date}
                  onChange={e => setDate(e.target.value)} style={{ paddingRight: 12 }} disabled={loading || saving} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Наличие заболевание</label>
              <input className={styles.fieldInput} value={disease}
                onChange={e => setDisease(e.target.value)} disabled={loading || saving} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Симптомы заболевания</label>
              <select className={styles.fieldSelect}
                value=""
                disabled={loading || saving}
                onChange={e => { if (e.target.value) toggleSymptom(Number(e.target.value)) }}>
                <option value="">Найдите симптомы</option>
                {symptoms.map(s => <option key={s.id} value={s.id}>{refLabel(s)}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Выбранные симптомы</label>
              <div className={styles.chipsBox}>
                {selectedSymptomIds.map(symptomId => {
                  const symptom = symptoms.find(s => s.id === symptomId)
                  const label = symptom ? refLabel(symptom) : String(symptomId)
                  return (
                    <span key={symptomId} className={styles.chip}>
                      {label}
                      <button className={styles.chipRemove} onClick={() => toggleSymptom(symptomId)} disabled={saving}>×</button>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Описание</label>
            <textarea className={styles.fieldTextarea}
              style={{ minHeight: 200 }}
              value={description}
              disabled={loading || saving}
              onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  )
}
