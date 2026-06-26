import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MOCK_PET } from '../data/petProfileMock'
import { DOG_BREEDS, ACTIVITY_OPTIONS, GENDER_OPTIONS, REPRODUCTIVE_OPTIONS } from '../data/createRecipeMock'
import styles from '../styles/EditPet.module.css'

export function EditPetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const pet = MOCK_PET

  const [name, setName] = useState(pet.name)
  const [description, setDescription] = useState(pet.description)
  const [breed, setBreed] = useState(pet.breed)
  const [weight, setWeight] = useState(String(pet.weight))
  const [birthDate, setBirthDate] = useState('2025-01-01')
  const [activityLevel, setActivityLevel] = useState(pet.activityLevel)
  const [gender, setGender] = useState(pet.gender)
  const [reproductiveStatus, setReproductiveStatus] = useState(pet.reproductiveStatus)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(`/pet-profile/${id}`)}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Редактирование профиля питомца</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
        <div className={styles.petEditLayout}>
          {/* Photo */}
          <div className={styles.photoCol}>
            {pet.photoUrl ? (
              <img src={pet.photoUrl} alt={pet.name} className={styles.petPhoto} />
            ) : (
              <div className={styles.petPhoto} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
            )}
            <div className={styles.photoActions}>
              <button className={styles.photoBtn} title="Изменить фото">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className={`${styles.photoBtn} ${styles.photoBtnDanger}`} title="Удалить фото">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className={styles.fieldsCol}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Имя</label>
              <input className={styles.fieldInput} value={name}
                onChange={e => setName(e.target.value)} />
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
            <input className={styles.fieldInput} value={pet.id} readOnly
              style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Порода</label>
            <select className={styles.fieldSelect} value={breed}
              onChange={e => setBreed(e.target.value)}>
              {DOG_BREEDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Вес (кг)</label>
            <input className={styles.fieldInput} type="number" value={weight}
              onChange={e => setWeight(e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Уровень активности</label>
            <select className={styles.fieldSelect} value={activityLevel}
              onChange={e => setActivityLevel(e.target.value)}>
              {ACTIVITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
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
            <select className={styles.fieldSelect} value={reproductiveStatus}
              onChange={e => setReproductiveStatus(e.target.value)}>
              {REPRODUCTIVE_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={() => navigate(`/pet-profile/${id}`)}>
          Сохранить изменения
        </button>
      </div>
    </div>
  )
}