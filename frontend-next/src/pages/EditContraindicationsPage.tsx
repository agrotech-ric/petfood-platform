import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { MOCK_CONTRAINDICATIONS } from '../data/petProfileMock'
import { INGREDIENT_CATEGORIES } from '../data/createRecipeMock'
import styles from '../styles/EditPet.module.css'

export function EditContraindicationsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTab = (location.state as any)?.fromTab ?? 'food'
  const c = MOCK_CONTRAINDICATIONS

  const [description, setDescription] = useState(c.description)
  const [search, setSearch] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([...c.ingredients])

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }

  const filteredCategories = INGREDIENT_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => search === '' || cat.items.length > 0)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Особенности питания</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
        {/* Description */}
        <div className={styles.fieldGroup} style={{ marginBottom: 20 }}>
          <label className={styles.fieldLabel}>Описание</label>
          <textarea
            className={styles.fieldTextarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Two panel: accordion + selected */}
        <div className={styles.twoPanel}>
          {/* Left: search + accordion */}
          <div>
            <p className={styles.panelTitle}>Нежелательные ингредиенты</p>
            <div className={styles.ingredientSearch}>
              <input
                className={styles.ingredientSearchInput}
                placeholder="Поиск"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            <div className={styles.accordionList}>
              {filteredCategories.map(cat => (
                <div key={cat.key} className={styles.accordionItem}>
                  <button
                    className={styles.accordionHeader}
                    onClick={() => toggleCategory(cat.key)}
                  >
                    <span className={styles.accordionChevron}>
                      {openCategories.has(cat.key) ? '▼' : '›'}
                    </span>
                    {cat.label}
                  </button>
                  {openCategories.has(cat.key) && (
                    <div className={styles.accordionBody}>
                      {cat.items.map(item => (
                        <span
                          key={item}
                          className={styles.accordionIngredient}
                          style={selectedIngredients.includes(item)
                            ? { color: 'var(--color-accent-alt)', fontWeight: 600 }
                            : undefined}
                          onClick={() => toggleIngredient(item)}
                        >
                          {selectedIngredients.includes(item) ? '✓ ' : ''}{item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: selected ingredients */}
          <div>
            <p className={styles.panelTitle}>Выбранные нежелательные ингредиенты</p>
            <div className={styles.chipsBox} style={{ minHeight: 80 }}>
              {selectedIngredients.map(ing => (
                <span key={ing} className={styles.chip}>
                  {ing}
                  <button className={styles.chipRemove} onClick={() => toggleIngredient(ing)}>×</button>
                </span>
              ))}
              {selectedIngredients.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Нет выбранных ингредиентов
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className={styles.saveBtn}
          onClick={() => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })}
        >
          Сохранить
        </button>
      </div>
    </div>
  )
}