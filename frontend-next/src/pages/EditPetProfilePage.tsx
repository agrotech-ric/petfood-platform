import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { MOCK_PET } from '../data/petProfileMock'
import { DOG_BREEDS, ACTIVITY_OPTIONS, GENDER_OPTIONS, REPRODUCTIVE_OPTIONS } from '../data/createRecipeMock'
import styles from '../styles/EditPet.module.css'
import DeleteIcon from '../assets/icons/delete.svg?react'
import Edit1Icon from '../assets/icons/edit1.svg?react'

export function EditPetProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTab = (location.state as any)?.fromTab ?? 'food'
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
        <button className={styles.backBtn} onClick={() => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Редактирование профиля питомца</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
  <div className={styles.petEditLayout}>
    {/* Photo */}
    <div className={styles.photoCol}>
      <div className={styles.photoCard}>
        {pet.photoUrl ? (
          <img
            src={pet.photoUrl}
            alt={pet.name}
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
          <button className={styles.photoBtn} title="Изменить фото">
            <Edit1Icon width={30} height={30} />
          </button>

          <button
            className={`${styles.photoBtn} ${styles.photoBtnDanger}`}
            title="Удалить фото"
          >
            <DeleteIcon width={30} height={30} />
          </button>
        </div>
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

        <button
          className={styles.saveBtn}
          onClick={() => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })}
        >
          Сохранить изменения
        </button>
      </div>
    </div>
  )
}