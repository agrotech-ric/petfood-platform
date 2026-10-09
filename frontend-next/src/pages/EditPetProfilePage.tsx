import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { referenceService, type ActivityType, type Breed, type Color, type ReproductiveStatus, type Species, type Symptom } from '../../services/referenceService'
import { petService, type HealthRecord, type PetProfileData } from '../../services/petService'
import styles from '../styles/EditPet.module.css'
import DeleteIcon from '../assets/icons/delete.svg?react'
import Edit1Icon from '../assets/icons/edit1.svg?react'
import { ownerService, type PetOwner, type PetOwnerInput } from '../../services/ownerService'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'

type FormErrors = Partial<Record<string, string>>

const emptyOwner: PetOwnerInput = {
  fullName: '',
  country: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  telegram: '',
  avatarObjectKey: '',
}

function ownerToInput(owner: PetOwner): PetOwnerInput {
  return {
    fullName: owner.fullName || '',
    country: owner.country || '',
    city: owner.city || '',
    address: owner.address || '',
    phone: owner.phone || '',
    email: owner.email || '',
    telegram: owner.telegram || '',
    avatarObjectKey: owner.avatarObjectKey || '',
  }
}

function normalizeOwnerInput(owner: PetOwnerInput): PetOwnerInput {
  return {
    fullName: owner.fullName.trim(),
    country: owner.country?.trim() || '',
    city: owner.city?.trim() || '',
    address: owner.address?.trim() || '',
    phone: owner.phone?.trim() || '',
    email: owner.email?.trim() || '',
    telegram: owner.telegram?.trim() || '',
    avatarObjectKey: owner.avatarObjectKey || '',
  }
}

function hasOwnerDetails(owner: PetOwnerInput) {
  return Boolean(owner.fullName.trim() || owner.country?.trim() || owner.city?.trim() || owner.address?.trim() || owner.phone?.trim() || owner.email?.trim() || owner.telegram?.trim())
}

function sameOwnerDetails(left: PetOwnerInput, right: PetOwnerInput) {
  return JSON.stringify(normalizeOwnerInput(left)) === JSON.stringify(normalizeOwnerInput(right))
}

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

function sameNumber(a?: number, b?: number) {
  if (a == null || b == null) return a == b
  return Math.abs(a - b) < 0.001
}

export function EditPetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useTranslation()
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
  const [owners, setOwners] = useState<PetOwner[]>([])
  const [petOwnerId, setPetOwnerId] = useState('')
  const [ownerQuery, setOwnerQuery] = useState('')
  const [ownerForm, setOwnerForm] = useState<PetOwnerInput>(emptyOwner)
  const [originalOwnerForm, setOriginalOwnerForm] = useState<PetOwnerInput>(emptyOwner)
  const [ownerOptionsOpen, setOwnerOptionsOpen] = useState(false)

  const latestRecord = useMemo(() => sortRecordsDesc(healthRecords)[0], [healthRecords])
  const filteredOwners = useMemo(() => {
    const query = ownerQuery.trim().toLowerCase()
    if (!query || owners.some(owner => owner.id === petOwnerId && owner.fullName === ownerQuery)) return owners
    return owners.filter(owner => `${owner.fullName} ${owner.phone || ''} ${owner.email || ''} ${owner.telegram || ''}`.toLowerCase().includes(query))
  }, [ownerQuery, owners, petOwnerId])

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
        const [loadedPet, records, loadedSpecies, loadedColors, loadedActivities, loadedSymptoms, loadedOwners] = await Promise.all([
          petService.getPet(id),
          petService.getHealthRecords(id),
          referenceService.fetchSpecies(),
          referenceService.fetchColors(),
          referenceService.fetchActivityTypes(),
          referenceService.fetchSymptoms(),
          user?.role === 'USER' || user?.role === 'VET' ? ownerService.search().catch(() => []) : Promise.resolve([]),
        ])

        if (cancelled) return

        setPet(loadedPet)
        const selectedOwnerId = ((location.state as { newOwnerId?: string } | null)?.newOwnerId) || loadedPet.petOwnerId || ''
        const selectedOwner = loadedOwners.find(owner => owner.id === selectedOwnerId)
        const selectedOwnerForm = selectedOwner ? ownerToInput(selectedOwner) : emptyOwner
        setOwners(loadedOwners)
        setPetOwnerId(selectedOwnerId)
        setOwnerQuery(selectedOwner?.fullName || '')
        setOwnerForm(selectedOwnerForm)
        setOriginalOwnerForm(selectedOwnerForm)
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
  }, [id, user?.role])

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

  const selectOwner = (owner: PetOwner) => {
    const form = ownerToInput(owner)
    setPetOwnerId(owner.id)
    setOwnerQuery(owner.fullName || owner.id)
    setOwnerForm(form)
    setOriginalOwnerForm(form)
    setOwnerOptionsOpen(false)
    setErrors(current => ({ ...current, ownerFullName: undefined }))
  }

  const startNewOwner = () => {
    setPetOwnerId('')
    setOwnerQuery('')
    setOwnerForm(emptyOwner)
    setOriginalOwnerForm(emptyOwner)
    setOwnerOptionsOpen(false)
    setErrors(current => ({ ...current, ownerFullName: undefined }))
  }

  const detachOwner = () => {
    startNewOwner()
  }

  const updateOwnerField = (field: keyof PetOwnerInput, value: string) => {
    setOwnerForm(current => ({ ...current, [field]: value }))
    if (field === 'fullName') setErrors(current => ({ ...current, ownerFullName: undefined }))
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
    const ownerWasEdited = petOwnerId && !sameOwnerDetails(ownerForm, originalOwnerForm)
    if ((user?.role === 'USER' || user?.role === 'VET') && (ownerWasEdited || (!petOwnerId && hasOwnerDetails(ownerForm))) && !ownerForm.fullName.trim()) {
      next.ownerFullName = t('owner.validation.name')
    }
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
      let nextPetOwnerId = petOwnerId || null
      if (user?.role === 'USER' || user?.role === 'VET') {
        const normalizedOwner = normalizeOwnerInput(ownerForm)
        if (petOwnerId && !sameOwnerDetails(normalizedOwner, originalOwnerForm)) {
          await ownerService.update(petOwnerId, normalizedOwner)
        } else if (!petOwnerId && hasOwnerDetails(normalizedOwner)) {
          const createdOwner = await ownerService.create(normalizedOwner)
          nextPetOwnerId = createdOwner.id
        }
      }

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
        ...(user?.role === 'USER' || user?.role === 'VET' ? { petOwnerId: nextPetOwnerId } : {}),
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

          </>
        )}
      </div>

      {!loading && (user?.role === 'USER' || user?.role === 'VET') && (
        <section className={styles.ownerCard} aria-labelledby="pet-owner-heading">
          <div className={styles.ownerCardHeader}>
            <h2 id="pet-owner-heading">{t('owner.information')}</h2>
            <div className={styles.ownerCardActions}>
              <button type="button" className={styles.ownerActionBtn} onClick={startNewOwner}>
                {t('owner.createNew')}
              </button>
              {petOwnerId && (
                <button type="button" className={styles.ownerDetachBtn} onClick={detachOwner}>
                  {t('owner.detach')}
                </button>
              )}
            </div>
          </div>

          <div className={styles.ownerCombobox}>
            <label className={styles.fieldLabel} htmlFor="pet-owner-search">{t('owner.selectExisting')}</label>
            <input
              id="pet-owner-search"
              className={styles.fieldInput}
              type="search"
              role="combobox"
              aria-expanded={ownerOptionsOpen}
              aria-controls="pet-owner-options"
              aria-autocomplete="list"
              value={ownerQuery}
              onFocus={() => setOwnerOptionsOpen(true)}
              onBlur={() => window.setTimeout(() => setOwnerOptionsOpen(false), 120)}
              onChange={event => {
                setOwnerQuery(event.target.value)
                setOwnerOptionsOpen(true)
              }}
              placeholder={t('owner.search')}
            />
            {ownerOptionsOpen && (
              <div id="pet-owner-options" className={styles.ownerOptions} role="listbox">
                {filteredOwners.length > 0 ? filteredOwners.map(owner => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={owner.id === petOwnerId}
                    className={styles.ownerOption}
                    key={owner.id}
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => selectOwner(owner)}
                  >
                    <strong>{owner.fullName || t('owner.placeholder')}</strong>
                    <span>{owner.phone || owner.email || owner.telegram || t('owner.contacts.empty')}</span>
                  </button>
                )) : <p className={styles.ownerOptionsEmpty}>{t('owner.search.empty')}</p>}
              </div>
            )}
          </div>

          <div className={styles.ownerGrid}>
            <OwnerField field="fullName" label={t('owner.fullName')} value={ownerForm.fullName} onChange={updateOwnerField} error={errors.ownerFullName} />
            <OwnerField field="country" label={t('owner.country')} value={ownerForm.country || ''} onChange={updateOwnerField} />
            <OwnerField field="address" label={t('owner.address')} value={ownerForm.address || ''} onChange={updateOwnerField} />
            <OwnerField field="city" label={t('owner.city')} value={ownerForm.city || ''} onChange={updateOwnerField} />
            <OwnerField field="phone" label={t('owner.phone')} value={ownerForm.phone || ''} onChange={updateOwnerField} type="tel" />
            <OwnerField field="email" label={t('owner.email')} value={ownerForm.email || ''} onChange={updateOwnerField} type="email" />
            <OwnerField field="telegram" label={t('owner.telegram')} value={ownerForm.telegram || ''} onChange={updateOwnerField} />
          </div>
        </section>
      )}

      {!loading && (
        <button
          className={styles.saveBtn}
          disabled={saving}
          aria-busy={saving}
          onClick={() => void handleSubmit()}
        >
          {saving ? t('common.saving') : t('pet.saveChanges')}
        </button>
      )}
    </div>
  )
}

function OwnerField({
  field,
  label,
  value,
  type = 'text',
  error,
  onChange,
}: {
  field: keyof PetOwnerInput
  label: string
  value: string
  type?: string
  error?: string
  onChange: (field: keyof PetOwnerInput, value: string) => void
}) {
  const inputId = `pet-owner-${field}`
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel} htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={styles.fieldInput}
        type={type}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={event => onChange(field, event.target.value)}
      />
      {error && <span id={`${inputId}-error`} className={styles.fieldError}>{error}</span>}
    </div>
  )
}
