import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type Ingredient } from '../../../services/ingredientService'
import { CATEGORIES } from '../../data/ingredientOptions'
import styles from '../../styles/Ingredients.module.css'

type Props = {
  title: string
  initialValues: Partial<Ingredient>
  onSave: (values: Partial<Ingredient>) => Promise<void> | void
  saveLabel?: string
}

type Fields = Record<string, string>

function toFields(v: Partial<Ingredient>): Fields {
  const result: Fields = {}
  Object.entries(v).forEach(([k, val]) => {
    result[k] = val != null ? String(val) : ''
  })
  return result
}

const NUTRIENT_ROWS = [
  // [label, key, unit]
  // Основные нутриенты
  ['Влажность', 'moisture', 'г'],
  ['Белки', 'protein', 'г'],
  ['Жиры', 'fat', 'г'],
  ['Углеводы', 'carbs', 'г'],
  ['Клетчатка', 'fiber', 'г'],
  ['Зола', 'ash', 'г'],
  ['Холестерин', 'cholesterol', 'г'],
  ['Сахар общее', 'sugar', 'г'],
  // Минералы
  ['Кальций', 'calcium', 'мг'],
  ['Фосфор', 'phosphorus', 'мг'],
  ['Магний', 'magnesium', 'мг'],
  ['Натрий', 'sodium', 'мг'],
  ['Калий', 'potassium', 'мг'],
  ['Железо', 'iron', 'мг'],
  ['Медь', 'copper', 'мг'],
  ['Цинк', 'zinc', 'мг'],
  ['Марганец', 'manganese', 'мг'],
  // Жирные кислоты
  ['Линолевая кислота', 'linoleic', 'г'],
  ['Альфа-линоленовая кислота', 'alphaLinolenic', 'г'],
  ['Арахидоновая кислота', 'arachidonic', 'г'],
  ['Эйкозапентаеновая кислота (ЭПК)', 'epa', 'г'],
  ['Докозагексаеновая кислота (ДГК)', 'dha', 'г'],
] as const

const RIGHT_ROWS = [
  // Холин и микро
  ['Холин', 'choline', 'мг'],
  ['Селен', 'selenium', 'мкг'],
  ['Йод', 'iodine', 'мкг'],
  // Витамины
  ['Витамин А', 'vitaminA', 'мкг'],
  ['Витамин Е', 'vitaminE', 'мг'],
  ['Витамин Д', 'vitaminD', 'мкг'],
  ['Витамин В1 (тиамин)', 'vitaminB1', 'мг'],
  ['Витамин В2 (рибофлавин)', 'vitaminB2', 'мг'],
  ['Витамин В3 (ниацин)', 'vitaminB3', 'мг'],
  ['Витамин В5 (Пантотеновая кислота)', 'vitaminB5', 'мг'],
  ['Витамин В6', 'vitaminB6', 'мг'],
  ['Витамин В9 (Фолиевая кислота)', 'vitaminB9', 'мкг'],
  ['Витамин В12', 'vitaminB12', 'мкг'],
  ['Витамин С', 'vitaminC', 'мг'],
  ['Витамин К', 'vitaminK', 'мкг'],
  // Производные витамина А
  ['Альфа-каротин', 'alphaCarotene', 'мкг'],
  ['Бета-каротин', 'betaCarotene', 'мкг'],
  ['Бета-криптоксантин', 'betaCryptoxanthin', 'мкг'],
  ['Лютеин и зеаксантин', 'luteinZeaxanthin', 'мкг'],
  ['Ликопин', 'lycopene', 'мкг'],
  ['Ретино', 'retinol', 'мкг'],
] as const

export function NutrientForm({ title, initialValues, onSave, saveLabel = 'Сохранить' }: Props) {
  const navigate = useNavigate()
  const [fields, setFields] = useState<Fields>(toFields(initialValues))
  const [saving, setSaving] = useState(false)

  const set = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    const parsed: Partial<Ingredient> = {}
    Object.entries(fields).forEach(([k, v]) => {
      if (v === '') return
      if (k === 'name' || k === 'subtype' || k === 'category') {
        ;(parsed as Record<string, unknown>)[k] = v
        return
      }
      const n = Number(v)
      ;(parsed as Record<string, unknown>)[k] = Number.isNaN(n) ? v : n
    })
    if (!String(parsed.name ?? '').trim() || !String(parsed.category ?? '').trim()) {
      window.alert('Заполните название и категорию ингредиента')
      return
    }
    setSaving(true)
    try {
      await onSave(parsed)
    } finally {
      setSaving(false)
    }
  }

  const numInput = (key: string, unit: string) => (
    <div className={styles.fieldWithUnit}>
      <input
        className={styles.fieldInput}
        type="number"
        step="0.01"
        value={fields[key] ?? '0'}
        onChange={e => set(key, e.target.value)}
      />
      <span className={styles.fieldUnit}>{unit}</span>
    </div>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>{title}</h1>
        <div className={styles.headerSpacer} />
      </div>

      {/* Form card */}
      <div className={styles.formCard}>
        <div className={styles.formSection}>
          <p className={styles.formSectionTitle}>Параметры ингредиента</p>

          {/* Name / Subtype */}
          <div className={styles.formTopRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Название</label>
              <input
                className={styles.fieldInput}
                placeholder="Введите название"
                value={fields.name ?? ''}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Подвид</label>
              <input
                className={styles.fieldInput}
                placeholder="Введите название подвида"
                value={fields.subtype ?? ''}
                onChange={e => set('subtype', e.target.value)}
              />
            </div>
          </div>

          {/* Category / Portion / Calories */}
          <div className={styles.formRow4}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Категория</label>
              <select
                className={styles.fieldSelect}
                value={fields.category ?? ''}
                onChange={e => set('category', e.target.value)}
              >
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Порция (г)</label>
              <input
                className={styles.fieldInput}
                type="number"
                value={fields.portion ?? '100'}
                onChange={e => set('portion', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }} />
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Энергетическая ценность, ккал</label>
              <input
                className={styles.fieldInput}
                type="number"
                value={fields.calories ?? '0'}
                onChange={e => set('calories', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Nutrients grid */}
        <div className={styles.nutrientsGrid}>
          {/* Left */}
          <div>
            <p className={styles.formSectionTitle}>Основные нутриенты</p>
            {NUTRIENT_ROWS.slice(0, 8).map(([label, key, unit]) => (
              <div key={key} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{label}</span>
                {numInput(key, unit)}
              </div>
            ))}

            <p className={styles.formSectionTitle} style={{ marginTop: 24 }}>Минералы</p>
            {NUTRIENT_ROWS.slice(8, 17).map(([label, key, unit]) => (
              <div key={key} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{label}</span>
                {numInput(key, unit)}
              </div>
            ))}

            <p className={styles.formSectionTitle} style={{ marginTop: 24 }}>Жирные кислоты</p>
            {NUTRIENT_ROWS.slice(17).map(([label, key, unit]) => (
              <div key={key} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{label}</span>
                {numInput(key, unit)}
              </div>
            ))}
          </div>

          {/* Right */}
          <div>
            <p className={styles.formSectionTitle}>&nbsp;</p>
            {RIGHT_ROWS.slice(0, 3).map(([label, key, unit]) => (
              <div key={key} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{label}</span>
                {numInput(key, unit)}
              </div>
            ))}

            <p className={styles.formSectionTitle} style={{ marginTop: 24 }}>Витамины</p>
            {RIGHT_ROWS.slice(3, 15).map(([label, key, unit]) => (
              <div key={key} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{label}</span>
                {numInput(key, unit)}
              </div>
            ))}

            <p className={styles.formSectionTitle} style={{ marginTop: 24 }}>Производные витамина А</p>
            {RIGHT_ROWS.slice(15).map(([label, key, unit]) => (
              <div key={key} className={styles.nutrientRow}>
                <span className={styles.nutrientName}>{label}</span>
                {numInput(key, unit)}
              </div>
            ))}
          </div>
        </div>

        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saveLabel}
        </button>
      </div>
    </div>
  )
}
