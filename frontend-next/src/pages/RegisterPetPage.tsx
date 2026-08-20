import styles from './RegisterPetPage.module.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { referenceService, type Breed, type Color, type ActivityType, type ReproductiveStatus, type Species, type Symptom } from '../../services/referenceService'
import { petService } from '../../services/petService'

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

export function RegisterPetPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [refsLoading, setRefsLoading] = useState(true)
  const [species, setSpecies] = useState<Species[]>([])
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [colors, setColors] = useState<Color[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [reproStatuses, setReproStatuses] = useState<ReproductiveStatus[]>([])

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [passportId, setPassportId] = useState('')
  const [weight, setWeight] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [breedId, setBreedId] = useState('')
  const [gender, setGender] = useState('')
  const [reproductiveStatusId, setReproductiveStatusId] = useState('')
  const [activityTypeId, setActivityTypeId] = useState('')
  const [colorId, setColorId] = useState('')

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
          setColorId(String(cols[0].id))
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
        setReproductiveStatusId(String(list[0].id))
      }
    })
    return () => { cancelled = true }
  }, [gender])

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
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((e) => ({ ...e, photo: undefined }))
  }, [])

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null)
    setPhotoPreview(null)
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
    if (!validate()) return

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
      }

      if (photo) {
        const key = await uploadPhoto(photo)
        if (key) payload.photoObjectKey = key
      }

      const created = await petService.createPet(payload)

      const noSymptom =
        symptoms.find((s) => refLabel(s).toLowerCase() === 'нет') ?? symptoms[0]
      const actId = activityTypeId ? Number(activityTypeId) : activityTypes[0]?.id

      if (created?.id && (description.trim() || actId)) {
        await petService.createHealthRecord(created.id, {
          activityTypeId: actId,
          symptomIds: noSymptom ? [noSymptom.id] : [],
          notes: description.trim() || undefined,
          weightKg: parseFloat(weight),
        })
      }

      navigate('/dashboard')
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
                      Порода <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="pet-breed"
                      className={styles.select}
                      value={breedId}
                      onChange={(e) => setBreedId(e.target.value)}
                    >
                      <option value="">Выберите породу</option>
                      {breeds.map((b) => (
                        <option key={b.id} value={b.id}>{refLabel(b)}</option>
                      ))}
                    </select>
                    {errors.breed && <p className={styles.fieldError}>{errors.breed}</p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="pet-activity">Уровень активности</label>
                    <select
                      id="pet-activity"
                      className={styles.select}
                      value={activityTypeId}
                      onChange={(e) => setActivityTypeId(e.target.value)}
                    >
                      <option value="">Выберите уровень</option>
                      {activityTypes.map((a) => (
                        <option key={a.id} value={a.id}>{refLabel(a)}</option>
                      ))}
                    </select>
                  </div>
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
                        Окрас <span className={styles.required}>*</span>
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
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
