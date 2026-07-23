import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ingredientService } from '../../services/ingredientService'
import { petService } from '../../services/petService'
import styles from '../styles/EditPet.module.css'

export function EditContraindicationsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTab = (location.state as any)?.fromTab ?? 'contra'

  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [ingredientCategories, setIngredientCategories] = useState<
    Array<{ key: string; label: string; items: string[] }>
  >([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const petId = id

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [data, ingredients] = await Promise.all([
          petService.getContraindications(petId),
          ingredientService.list(),
        ])
        if (cancelled) return
        setDescription(data.description || '')
        setSelectedIngredients(data.ingredients || [])
        const grouped = new Map<string, string[]>()
        ingredients.forEach((ingredient) => {
          const items = grouped.get(ingredient.category) ?? []
          items.push(ingredient.subtype
            ? `${ingredient.name} — ${ingredient.subtype}`
            : ingredient.name)
          grouped.set(ingredient.category, items)
        })
        setIngredientCategories(Array.from(grouped, ([label, items]) => ({
          key: label,
          label,
          items,
        })))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось загрузить противопоказания')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [id])

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

  const filteredCategories = ingredientCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => search === '' || cat.items.length > 0)

  const goBack = () => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })

  const handleSave = async () => {
    if (!id) return

    setSaving(true)
    setError('')

    try {
      await petService.updateContraindications(id, {
        ingredients: selectedIngredients,
        description: description.trim(),
      })
      goBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить противопоказания')
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
        <h1 className={styles.headerTitle}>Особенности питания</h1>
        <div style={{ width: 80 }} />
      </div>

      <div className={styles.card}>
        {error && <p className={styles.fieldLabel}>{error}</p>}
        {/* Description */}
        <div className={styles.fieldGroup} style={{ marginBottom: 20 }}>
          <label className={styles.fieldLabel}>Описание</label>
          <textarea
            className={styles.fieldTextarea}
            value={description}
            disabled={loading || saving}
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
                disabled={loading || saving}
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
                          onClick={() => {
                            if (!saving) toggleIngredient(item)
                          }}
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
                  <button className={styles.chipRemove} onClick={() => toggleIngredient(ing)} disabled={saving}>×</button>
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
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
