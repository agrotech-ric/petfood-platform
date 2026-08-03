import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { referenceService, type ActivityType, type Breed, type Color, type ReproductiveStatus, type Species, type Symptom } from '../../services/referenceService'
import { petService, type HealthRecord, type PetProfileData } from '../../services/petService'
import styles from '../styles/EditPet.module.css'
import DeleteIcon from '../assets/icons/delete.svg?react'
import Edit1Icon from '../assets/icons/edit1.svg?react'

type FormErrors = Partial<Record<string, string>>

function refLabel(item: { name?: string; nameRu?: string; nameEn?: string }) {
  return item.nameRu || item.name || item.nameEn || ''
}

function resolveDogSpeciesId(species: Species[], currentSpeciesId?: number): number {
  if (currentSpeciesId) return currentSpeciesId
  const dog =
    species.find(
      (s) =>
        s.code === 'dog' ||
        (s.name && s.name.toLowerCase().includes('соба')) ||
        (s.nameRu && s.nameRu.toLowerCase().includes('соба')),
    ) ?? species[0]
  return dog?.id ?? 0
}

function normalizeGender(gender?: string) {
  const normalized = gender?.toLowerCase()
  return normalized === 'female' ? 'female' : 'male'
}

function normalizeDate(value?: string) {
  if (!value) return ''
  return value.slice(0, 10)
}

function sortRecordsDesc(records: HealthRecord[]) {
  return [...records].sort((a, b) => {
    const aDate = a.recordDate || a.createdAt
    const bDate = b.recordDate || b.createdAt
    const aTime = new Date(aDate).getTime()
    const bTime = new Date(bDate).getTime()
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
  })
}

function genderLabel(value: string) {
  return value === 'female' ? 'Самка' : 'Самец'
}

function normalizeText(value?: string) {
  return (value || '').trim()
}

function sameNumber(a?: number, b?: number) {
  if (a == null || b == null) return a == b
  return Math.abs(a - b) < 0.001
}

export function EditPetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTab = ((location.state as { fromTab?: string } | null)?.fromTab) ?? 'food'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const [pet, setPet] = useState<PetProfileData | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [reproStatuses, setReproStatuses] = useState<ReproductiveStatus[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [breedId, setBreedId] = useState('')
  const [weight, setWeight] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [activityTypeId, setActivityTypeId] = useState('')
  const [gender, setGender] = useState('male')
  const [reproductiveStatusId, setReproductiveStatusId] = useState('')
  const [colorId, setColorId] = useState('')
  const [photoObjectKey, setPhotoObjectKey] = useState<string | undefined>()
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | undefined>()

  const latestRecord = useMemo(() => sortRecordsDesc(healthRecords)[0], [healthRecords])

  useEffect(() => {
    if (!id) {
      setGeneralError('Питомец не найден')
      setLoading(false)
      return
    }

    let cancelled = false

    const loadData = async () => {
      setLoading(true)
      setGeneralError('')

      try {
        const [loadedPet, records, loadedSpecies, loadedColors, loadedActivities, loadedSymptoms] = await Promise.all([
          petService.getPet(id),
          petService.getHealthRecords(id),
          referenceService.fetchSpecies(),
          referenceService.fetchColors(),
          referenceService.fetchActivityTypes(),
          referenceService.fetchSymptoms(),
        ])

        if (cancelled) return

        setPet(loadedPet)
        setHealthRecords(records)
        setSpecies(loadedSpecies)
        setColors(loadedColors)
        setActivityTypes(loadedActivities)
        setSymptoms(loadedSymptoms)

        const speciesId = resolveDogSpeciesId(loadedSpecies, loadedPet.speciesId)
        const loadedBreeds = speciesId ? await referenceService.fetchBreedsBySpeciesId(speciesId) : []
        if (cancelled) return
        setBreeds(loadedBreeds)

        const loadedGender = normalizeGender(loadedPet.gender)
        const statuses = await referenceService.fetchReproductiveStatuses(loadedGender)
        if (cancelled) return
        setReproStatuses(statuses)

        setName(loadedPet.name || '')
        setDescription(loadedPet.comments || '')
        setBreedId(loadedPet.breedId ? String(loadedPet.breedId) : '')
        setWeight(loadedPet.weightKg != null ? String(loadedPet.weightKg) : '')
        setBirthDate(normalizeDate(loadedPet.birthDate))
        setActivityTypeId(sortRecordsDesc(records)[0]?.activityTypeId ? String(sortRecordsDesc(records)[0].activityTypeId) : '')
        setGender(loadedGender)
        setReproductiveStatusId(
          loadedPet.reproductiveStatusId
            ? String(loadedPet.reproductiveStatusId)
            : statuses[0]?.id
              ? String(statuses[0].id)
              : '',
        )
        setColorId(loadedPet.colorId ? String(loadedPet.colorId) : loadedColors[0]?.id ? String(loadedColors[0].id) : '')
        setPhotoObjectKey(loadedPet.photoObjectKey)

        if (loadedPet.photoObjectKey) {
          try {
            const photo = await petService.getPhotoDownloadUrl(loadedPet.photoObjectKey)
            if (!cancelled) setPhotoUrl(photo.url)
          } catch {
            if (!cancelled) setPhotoUrl(undefined)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setGeneralError(err instanceof Error ? err.message : 'Не удалось загрузить профиль питомца')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false

    referenceService.fetchReproductiveStatuses(gender).then((statuses) => {
      if (cancelled) return
      setReproStatuses(statuses)
      if (!statuses.some((status) => String(status.id) === reproductiveStatusId)) {
        setReproductiveStatusId(statuses[0]?.id ? String(statuses[0].id) : '')
      }
    }).catch(() => {
      if (!cancelled) setReproStatuses([])
    })

    return () => {
      cancelled = true
    }
  }, [gender])

  useEffect(() => {
    if (!latestRecord?.activityTypeName || activityTypeId) return
    const match = activityTypes.find((activity) => String(activity.id) === String(latestRecord.activityTypeId) || refLabel(activity) === latestRecord.activityTypeName || activity.name === latestRecord.activityTypeName)
    if (match) setActivityTypeId(String(match.id))
  }, [activityTypeId, activityTypes, latestRecord])

  const goBack = () => {
    navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })
  }

  const handlePhotoFile = useCallback((file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Формат JPEG или PNG' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Максимум 10 МБ' }))
      return
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((prev) => ({ ...prev, photo: undefined }))
  }, [photoPreview])

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(undefined)
    setPhotoUrl(undefined)
    setPhotoObjectKey(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const next: FormErrors = {}
    const trimmedName = name.trim()
    if (!trimmedName) next.name = 'Введите имя'
    else if (!/^[\p{L} ]+$/u.test(trimmedName)) next.name = 'Только буквы и пробелы'
    if (!breedId) next.breed = 'Выберите породу'
    if (!gender) next.gender = 'Выберите пол'
    if (!birthDate) next.birthDate = 'Укажите дату рождения'
    if (!colorId) next.color = 'Выберите окрас'
    const parsedWeight = Number(weight)
    if (!weight || Number.isNaN(parsedWeight) || parsedWeight <= 0) next.weight = 'Укажите вес'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const uploadPhoto = async (file: File) => {
    const ext = file.type.split('/')[1] || 'jpg'
    const fileName = `pet-${Date.now()}.${ext}`
    const { url, objectKey } = await petService.getPhotoUploadUrl(fileName, file.type)
    await petService.uploadPhotoToStorage(url, file, file.type)
    return objectKey
  }

  const handleSubmit = async () => {
    if (!id || !pet) return
    setGeneralError('')
    if (!validate()) return

    setSaving(true)

    try {
      const nextPhotoObjectKey = photoFile ? await uploadPhoto(photoFile) : photoObjectKey
      const speciesId = resolveDogSpeciesId(species, pet.speciesId)
      const parsedWeight = Number(weight)
      const payload: Record<string, unknown> = {
        speciesId,
        breedId: Number(breedId),
        name: name.trim(),
        gender,
        colorId: Number(colorId),
        birthDate,
        passportId: pet.passportId || '',
        weightKg: parsedWeight,
        reproductiveStatusId: reproductiveStatusId ? Number(reproductiveStatusId) : undefined,
        reproductiveSubStatusId: pet.reproductiveSubStatusId,
        puppiesCount: pet.puppiesCount ?? 0,
        comments: description.trim(),
      }

      if (nextPhotoObjectKey) {
        payload.photoObjectKey = nextPhotoObjectKey
      } else {
        payload.photoObjectKey = ''
      }

      await petService.updatePet(id, payload)

      const noSymptom =
        symptoms.find((symptom) => refLabel(symptom).toLowerCase() === 'нет') ?? symptoms[0]
      const actId = activityTypeId ? Number(activityTypeId) : activityTypes[0]?.id

      const activityChanged = actId != null && String(actId) !== String(latestRecord?.activityTypeId ?? '')
      const weightChanged = !sameNumber(parsedWeight, latestRecord?.weightKg ?? pet.weightKg)
      const shouldCreateHealthRecord = Boolean(noSymptom && actId && (activityChanged || weightChanged))

      if (shouldCreateHealthRecord) {
        await petService.createHealthRecord(id, {
          activityTypeId: actId,
          symptomIds: [noSymptom.id],
          weightKg: parsedWeight,
          recordDate: new Date().toISOString().slice(0, 10),
        })
      }

      navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const visiblePhoto = photoPreview || photoUrl

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={goBack}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Редактирование профиля питомца</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
        {generalError && <p style={{ color: '#e53e3e', marginTop: 0 }}>{generalError}</p>}
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Загрузка...</p>
        ) : (
          <>
            <div className={styles.petEditLayout}>
              {/* Photo */}
              <div className={styles.photoCol}>
                <div className={styles.photoCard}>
                  {visiblePhoto ? (
                    <img
                      src={visiblePhoto}
                      alt={name}
                      className={styles.petPhoto}
                    />
                  ) : (
                    <div
                      className={styles.petPhoto}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  )}

                  <div className={styles.photoToolbar}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      style={{ display: 'none' }}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) handlePhotoFile(file)
                      }}
                    />
                    <button className={styles.photoBtn} title="Изменить фото" onClick={() => fileInputRef.current?.click()}>
                      <Edit1Icon width={30} height={30} />
                    </button>

                    <button
                      className={`${styles.photoBtn} ${styles.photoBtnDanger}`}
                      title="Удалить фото"
                      onClick={clearPhoto}
                    >
                      <DeleteIcon width={30} height={30} />
                    </button>
                  </div>
                </div>
                {errors.photo && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.photo}</span>}
              </div>

              {/* Fields */}
              <div className={styles.fieldsCol}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Имя</label>
                  <input className={styles.fieldInput} value={name}
                    onChange={e => setName(e.target.value)} />
                  {errors.name && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.name}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Описание</label>
                  <textarea className={styles.fieldTextarea} value={description}
                    onChange={e => setDescription(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Bottom fields grid */}
            <div className={styles.formGrid2} style={{ marginTop: 20 }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>ID</label>
                <input className={styles.fieldInput} value={pet?.id ?? id ?? ''} readOnly
                  style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Порода</label>
                <select className={styles.fieldSelect} value={breedId}
                  onChange={e => setBreedId(e.target.value)}>
                  <option value="">Выберите породу</option>
                  {breeds.map(b => <option key={b.id} value={b.id}>{refLabel(b)}</option>)}
                </select>
                {errors.breed && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.breed}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Вес (кг)</label>
                <input className={styles.fieldInput} type="number" value={weight}
                  onChange={e => setWeight(e.target.value)} />
                {errors.weight && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.weight}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Уровень активности</label>
                <select className={styles.fieldSelect} value={activityTypeId}
                  onChange={e => setActivityTypeId(e.target.value)}>
                  <option value="">Выберите активность</option>
                  {activityTypes.map(o => <option key={o.id} value={o.id}>{refLabel(o)}</option>)}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Дата рождения</label>
                <div className={styles.dateWrapper}>
                  <input className={styles.fieldInput} type="date" value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    style={{ paddingRight: 36 }} />
                  <span className={styles.dateIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </span>
                </div>
                {errors.birthDate && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.birthDate}</span>}
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Пол</label>
                <select className={styles.fieldSelect} value={gender}
                  onChange={e => setGender(e.target.value)}>
                  {['male', 'female'].map(o => <option key={o} value={o}>{genderLabel(o)}</option>)}
                </select>
                {errors.gender && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.gender}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Окрас</label>
                <select className={styles.fieldSelect} value={colorId}
                  onChange={e => setColorId(e.target.value)}>
                  <option value="">Выберите окрас</option>
                  {colors.map(o => <option key={o.id} value={o.id}>{refLabel(o)}</option>)}
                </select>
                {errors.color && <span style={{ color: '#e53e3e', fontSize: 12 }}>{errors.color}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Репродуктивный статус</label>
                <select className={styles.fieldSelect} value={reproductiveStatusId}
                  onChange={e => setReproductiveStatusId(e.target.value)}>
                  <option value="">Не указано</option>
                  {reproStatuses.map(o => <option key={o.id} value={o.id}>{refLabel(o)}</option>)}
                </select>
              </div>
            </div>

            <button
              className={styles.saveBtn}
              disabled={saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
