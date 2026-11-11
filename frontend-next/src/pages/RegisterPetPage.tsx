import styles from './RegisterPetPage.module.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { referenceService, type Breed, type Color, type ActivityType, type ReproductiveStatus, type Species, type Symptom } from '../../services/referenceService'
import { petService } from '../../services/petService'
import { ownerService, type PetOwner } from '../../services/ownerService'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../context/LanguageContext'
import { recommenderService } from '../../services/recommenderService'
import { RegisterPetAutocomplete } from './RegisterPetAutocomplete'

function refLabel(item: { name?: string; nameRu?: string; nameEn?: string }) {
  return item.nameRu || item.name || item.nameEn || ''
}

function resolveDogSpeciesId(species: Species[]): number {
  if (!species.length) return 0
  const dog =
    species.find(
      (s) =>
        s.code === 'dog' ||
        (s.name && s.name.toLowerCase().includes('соба')) ||
        (s.nameRu && s.nameRu.toLowerCase().includes('соба'))
    ) ?? species[0]
  return dog?.id ?? 0
}

type FormErrors = Partial<Record<string, string>>

// Keep the file in this tab while React Router restores the serializable fields.
let draftPhoto: { id: string; file: File } | null = null

type PetDraft = {
  photoId?: string
  name: string
  description: string
  passportId: string
  weight: string
  birthDate: string
  breedId: string
  gender: string
  reproductiveStatusId: string
  activityTypeId: string
  colorId: string
}

function activityAge(birthDate: string, adultWeight: number) {
  const birth = new Date(`${birthDate}T00:00:00`)
  const today = new Date()
  if (!birthDate || Number.isNaN(birth.getTime()) || birth > today) return null
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth()
    - Number(today.getDate() < birth.getDate())
  const adultMonths = adultWeight > 40 ? 24 : adultWeight > 25 ? 15 : 12
  const seniorMonths = adultWeight <= 10 ? 96 : adultWeight > 40 ? 72 : 84
  return months < adultMonths ? 'puppy' : months > seniorMonths ? 'senior' : 'adult'
}

// These IDs are the shared activity reference entries used by the recommender.
const seniorActivities = [
  { id: 1, label: 'petRegistration.activityPassive' },
  { id: 3, label: 'petRegistration.activityModerate' },
  { id: 4, label: 'petRegistration.activityActive' },
] as const

export function RegisterPetPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useTranslation()
  const routeState = location.state as { petOwnerId?: string; newOwnerId?: string; returnTo?: string; petDraft?: PetDraft } | null
  const draft = routeState?.petDraft
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [refsLoading, setRefsLoading] = useState(true)
  const [species, setSpecies] = useState<Species[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [reproStatuses, setReproStatuses] = useState<ReproductiveStatus[]>([])

  const [photo, setPhoto] = useState<File | null>(() => draftPhoto && draftPhoto.id === draft?.photoId ? draftPhoto.file : null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [name, setName] = useState(draft?.name ?? '')
  const [description, setDescription] = useState(draft?.description ?? '')
  const [passportId, setPassportId] = useState(draft?.passportId ?? '')
  const [weight, setWeight] = useState(draft?.weight ?? '')
  const [birthDate, setBirthDate] = useState(draft?.birthDate ?? '')
  const [breedId, setBreedId] = useState(draft?.breedId ?? '')
  const [gender, setGender] = useState(draft?.gender ?? '')
  const [reproductiveStatusId, setReproductiveStatusId] = useState(draft?.reproductiveStatusId ?? '')
  const [activityTypeId, setActivityTypeId] = useState(draft?.activityTypeId ?? '')
  const [colorId, setColorId] = useState(draft?.colorId ?? '')
  const [owners, setOwners] = useState<PetOwner[]>([])
  const [petOwnerId, setPetOwnerId] = useState(routeState?.petOwnerId || routeState?.newOwnerId || '')
  const [breedWeight, setBreedWeight] = useState<{ breed: string; weight: number } | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [sp, cols, acts, syms] = await Promise.all([
          referenceService.fetchSpecies(),
          referenceService.fetchColors(),
          referenceService.fetchActivityTypes(),
          referenceService.fetchSymptoms(),
        ])
        if (cancelled) return
        setSpecies(sp)
        setColors(cols)
        setActivityTypes(acts)
        setSymptoms(syms)
        if (cols.length > 0) {
          setColorId(current => current || String(cols[0].id))
        }
        const sid = resolveDogSpeciesId(sp)
        if (sid) {
          const br = await referenceService.fetchBreedsBySpeciesId(sid)
          if (!cancelled) setBreeds(br)
        }
      } catch {
        if (!cancelled) setGeneralError('Не удалось загрузить справочники')
      } finally {
        if (!cancelled) setRefsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (user?.role === 'USER' || user?.role === 'VET') ownerService.search().then(setOwners).catch(() => setOwners([]))
  }, [user?.role])

  useEffect(() => {
    if (gender !== 'female') {
      setReproStatuses([])
      setReproductiveStatusId('')
      return
    }
    let cancelled = false
    referenceService.fetchReproductiveStatuses('female').then((list) => {
      if (cancelled) return
      setReproStatuses(list)
      if (list.length > 0) {
        setReproductiveStatusId(current => current || String(list[0].id))
      }
    })
    return () => { cancelled = true }
  }, [gender])

  const breed = breeds.find(item => String(item.id) === breedId)
  const modelBreed = (breed?.nameEn ?? breed?.name ?? breed?.nameRu ?? '').trim().toLowerCase()
  const loadingBreedWeight = !!modelBreed && breedWeight?.breed !== modelBreed
  const age = !breed || loadingBreedWeight ? null : activityAge(birthDate, breedWeight?.weight ?? 20)
  const availableActivities = age === 'senior'
    ? seniorActivities.filter(option => activityTypes.some(item => item.id === option.id))
      .map(option => ({ id: option.id, label: t(option.label) }))
    : activityTypes.map(item => ({ id: item.id, label: refLabel(item) }))
  const validActivity = availableActivities.some(item => String(item.id) === activityTypeId)
  const selectedActivity = age && age !== 'puppy' && validActivity ? activityTypeId : ''

  useEffect(() => {
    if (!modelBreed) return
    let cancelled = false
    recommenderService.getBreedDetails(modelBreed).then(({ breed_info }) => {
      if (!cancelled) setBreedWeight({ breed: modelBreed, weight: breed_info.avg_weight || 20 })
    }).catch(() => {
      if (!cancelled) setBreedWeight({ breed: modelBreed, weight: 20 })
    })
    return () => { cancelled = true }
  }, [modelBreed])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const createOwner = () => {
    draftPhoto = photo ? { id: crypto.randomUUID(), file: photo } : null
    const petDraft: PetDraft = {
      photoId: draftPhoto?.id, name, description, passportId, weight, birthDate, breedId, gender,
      reproductiveStatusId, activityTypeId, colorId,
    }
    navigate(location.pathname, { replace: true, state: { ...routeState, petDraft } })
    navigate('/owners/create', {
      state: { returnTo: location.pathname, petRegistrationState: { ...routeState, petDraft } },
    })
  }

  const handlePhotoFile = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors((e) => ({ ...e, photo: 'Формат JPEG или PNG' }))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: 'Максимум 10 МБ' }))
      return
    }
    setPhoto(file)
    setErrors((e) => ({ ...e, photo: undefined }))
  }, [])

  const clearPhoto = () => {
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Введите имя'
    else if (!/^[\p{L} ]+$/u.test(name.trim())) next.name = 'Только буквы и пробелы'
    if (!breedId) next.breed = 'Выберите породу'
    if (!gender) next.gender = 'Выберите пол'
    if (!birthDate) next.birthDate = 'Укажите дату рождения'
    const w = parseFloat(weight)
    if (!weight || Number.isNaN(w) || w <= 0) next.weight = 'Укажите вес'
    if (age && age !== 'puppy' && !selectedActivity) next.activity = t('petRegistration.activityRequired')
    if (!colorId) next.color = 'Окрас не загружен'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    const ext = file.type.split('/')[1] || 'jpg'
    const fileName = `pet-${Date.now()}.${ext}`
    const { url, objectKey } = await petService.getPhotoUploadUrl(fileName, file.type)
    await petService.uploadPhotoToStorage(url, file, file.type)
    return objectKey
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    if (loadingBreedWeight || !validate()) return

    setSubmitting(true)
    try {
      const speciesId = resolveDogSpeciesId(species)
      const payload: Record<string, unknown> = {
        speciesId,
        breedId: Number(breedId),
        name: name.trim(),
        gender,
        colorId: Number(colorId),
        birthDate,
        passportId: passportId.trim(),
        weightKg: parseFloat(weight),
        reproductiveStatusId:
          gender === 'female' && reproductiveStatusId
            ? Number(reproductiveStatusId)
            : 1,
        puppiesCount: 0,
        ...(user?.role === 'USER' || user?.role === 'VET' ? { petOwnerId: petOwnerId || null } : {}),
      }

      if (photo) {
        const key = await uploadPhoto(photo)
        if (key) payload.photoObjectKey = key
      }

      const created = await petService.createPet(payload)

      const noSymptom =
        symptoms.find((s) => refLabel(s).toLowerCase() === 'нет') ?? symptoms[0]
      const actId = selectedActivity ? Number(selectedActivity) : activityTypes[0]?.id

      if (created?.id && (description.trim() || actId)) {
        await petService.createHealthRecord(created.id, {
          activityTypeId: actId,
          symptomIds: noSymptom ? [noSymptom.id] : [],
          notes: description.trim() || undefined,
          weightKg: parseFloat(weight),
        })
      }

      draftPhoto = null
      navigate(routeState?.returnTo || '/dashboard')
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <svg className={styles.backIcon} viewBox="0 0 15 7" fill="currentColor">
              <path d="M7.5 0L0 7h15L7.5 0z" />
            </svg>
            Назад
          </button>
          <h1 className={styles.pageTitle}>Регистрация питомца</h1>
          <span />
        </div>

        {refsLoading ? (
          <div className={styles.formCard}>
            <p className={styles.loading}>Загрузка справочников…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={styles.formContainer}>
            {generalError && <p className={styles.errorGeneral}>{generalError}</p>}

            <div className={styles.formCard}>
              <div className={styles.topSection}>
                <div className={styles.photoWrapper}>
                  <label
                    className={`${styles.photoUpload} ${isDragging ? styles.photoUploadDragging : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f) void handlePhotoFile(f)
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className={styles.photoInput}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handlePhotoFile(f)
                      }}
                    />
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Нажмите или перетащите изображение</p>
                      </div>
                    )}
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className={styles.deletePhotoBtn}
                      title="Удалить фото"
                    >
                      ×
                    </button>
                  )}
                  {errors.photo && <p className={styles.photoError}>{errors.photo}</p>}
                </div>

                <div className={styles.fieldsColumn}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-name">
                      Кличка <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="pet-name"
                      className={styles.input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Введите кличку"
                    />
                    {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-desc">Описание</label>
                    <textarea
                      id="pet-desc"
                      className={styles.textarea}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Дополнительная информация о питомце"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.col}>
                  {(user?.role === 'USER' || user?.role === 'VET') && (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="pet-owner-search">{t('owner.field')}</label>
                      <RegisterPetAutocomplete
                        id="pet-owner-search"
                        value={petOwnerId}
                        onChange={setPetOwnerId}
                        placeholder={t('owner.search')}
                        emptyText={t('owner.search.empty')}
                        options={owners.map(owner => ({
                          id: owner.id,
                          label: owner.fullName || owner.id,
                          detail: owner.phone || owner.email || owner.telegram || undefined,
                          searchText: `${owner.fullName} ${owner.phone || ''} ${owner.email || ''} ${owner.telegram || ''}`,
                        }))}
                      />
                      {!petOwnerId && (
                        <button type="button" className={styles.createOwnerBtn} onClick={createOwner}>
                          <span aria-hidden="true">+</span> {t('owner.create')}
                        </button>
                      )}
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-id">ID</label>
                    <input
                      id="pet-id"
                      className={styles.input}
                      value={passportId}
                      onChange={(e) => setPassportId(e.target.value)}
                      placeholder="ID паспорта"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-weight">
                      Вес (кг) <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.weightControl}>
                      <input
                        id="pet-weight"
                        type="number"
                        min="0"
                        step="0.1"
                        className={styles.weightInput}
                        value={weight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setWeight(isNaN(val) ? '' : val.toString())
                        }}
                        placeholder="0"
                      />
                      <button
                        type="button"
                        className={styles.weightBtn}
                        onClick={() => setWeight((w) => Math.max(0, parseFloat((parseFloat(w) - 0.1).toFixed(1)) || 0).toString())}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className={styles.weightBtn}
                        onClick={() => setWeight((w) => parseFloat((parseFloat(w || '0') + 0.1).toFixed(1)).toString())}
                      >
                        +
                      </button>
                    </div>
                    {errors.weight && <p className={styles.fieldError}>{errors.weight}</p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-dob">
                      Дата рождения <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="pet-dob"
                      type="date"
                      className={styles.input}
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                    {errors.birthDate && <p className={styles.fieldError}>{errors.birthDate}</p>}
                  </div>
                  {gender === 'female' && (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="pet-repro">Репродуктивный статус</label>
                      <select
                        id="pet-repro"
                        className={styles.select}
                        value={reproductiveStatusId}
                        onChange={(e) => setReproductiveStatusId(e.target.value)}
                      >
                        {reproStatuses.length === 0 && <option value="">Загрузка…</option>}
                        {reproStatuses.map((s) => (
                          <option key={s.id} value={s.id}>{refLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className={styles.col}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-breed">
                      {t('public.breed')} <span className={styles.required}>*</span>
                    </label>
                    <RegisterPetAutocomplete
                      id="pet-breed"
                      value={breedId}
                      onChange={setBreedId}
                      placeholder={t('petRegistration.breedSearch')}
                      emptyText={t('petRegistration.breedEmpty')}
                      invalid={!!errors.breed}
                      options={breeds.map(item => ({
                        id: String(item.id),
                        label: refLabel(item),
                        searchText: [item.nameRu, item.nameEn, item.name].filter(Boolean).join(' '),
                      }))}
                    />
                    {errors.breed && <p className={styles.fieldError}>{errors.breed}</p>}
                  </div>
                  {age && age !== 'puppy' && (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="pet-activity">
                        {t('public.activity')} <span className={styles.required}>*</span>
                      </label>
                      <select
                        id="pet-activity"
                        className={styles.select}
                        value={selectedActivity}
                        required
                        onChange={(e) => {
                          setActivityTypeId(e.target.value)
                          setErrors(current => ({ ...current, activity: undefined }))
                        }}
                      >
                        <option value="">{t('petRegistration.activityRequired')}</option>
                        {availableActivities.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                      {errors.activity && <p className={styles.fieldError}>{errors.activity}</p>}
                    </div>
                  )}
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-gender">
                      Пол <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="pet-gender"
                      className={styles.select}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Выберите пол</option>
                      <option value="male">Самец</option>
                      <option value="female">Самка</option>
                    </select>
                    {errors.gender && <p className={styles.fieldError}>{errors.gender}</p>}
                  </div>
                  {/* Окрас обязателен для API — скрытый дефолт + выбор при необходимости */}
                  {colors.length > 1 && (
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="pet-color">
                        {t('public.color')}
                      </label>
                      <select
                        id="pet-color"
                        className={styles.select}
                        value={colorId}
                        onChange={(e) => setColorId(e.target.value)}
                      >
                        {colors.map((c) => (
                          <option key={c.id} value={c.id}>{refLabel(c)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.submitRow}>
              <button type="submit" className={styles.submitBtn} disabled={submitting || loadingBreedWeight}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
