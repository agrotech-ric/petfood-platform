import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MOCK_CURRENT_CONDITION } from '../data/petProfileMock'
import { SYMPTOMS_OPTIONS, HEALTH_CONDITIONS } from '../data/createRecipeMock'
import styles from '../styles/EditPet.module.css'

export function EditCurrentConditionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const c = MOCK_CURRENT_CONDITION

  const [date, setDate] = useState('2025-01-01')
  const [disease, setDisease] = useState(c.disease)
  const [description, setDescription] = useState(c.description)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([...c.symptoms])

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(`/pet-profile/${id}`)}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Текущее состояние здоровья питомца</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
        <div className={styles.twoPanel}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Дата</label>
              <div className={styles.dateWrapper}>
                <input className={styles.fieldInput} type="date" value={date}
                  onChange={e => setDate(e.target.value)} style={{ paddingRight: 36 }} />
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
              <label className={styles.fieldLabel}>Наличие заболевание</label>
              <input className={styles.fieldInput} value={disease}
                onChange={e => setDisease(e.target.value)} />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Симптомы заболевания</label>
              <select className={styles.fieldSelect}
                onChange={e => { if (e.target.value) toggleSymptom(e.target.value) }}>
                <option value="">Найдите симптомы</option>
                {SYMPTOMS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Выбранные симптомы</label>
              <div className={styles.chipsBox}>
                {selectedSymptoms.map(s => (
                  <span key={s} className={styles.chip}>
                    {s}
                    <button className={styles.chipRemove} onClick={() => toggleSymptom(s)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Описание</label>
            <textarea className={styles.fieldTextarea}
              style={{ minHeight: 200 }}
              value={description}
              onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        <button className={styles.saveBtn} onClick={() => navigate(`/pet-profile/${id}`)}>
          Сохранить изменения
        </button>
      </div>
    </div>
  )
}