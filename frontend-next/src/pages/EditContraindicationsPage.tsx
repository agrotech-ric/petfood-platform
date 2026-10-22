import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ingredientService, type Ingredient } from '../../services/ingredientService'
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
  const [openIngredientGroups, setOpenIngredientGroups] = useState<Set<string>>(new Set())
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [ingredientCategories, setIngredientCategories] = useState<Array<{
    key: string
    label: string
    groups: Array<{ name: string; variants: Ingredient[] }>
  }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sortByName = <T,>(items: T[], getName: (item: T) => string): T[] =>
  [...items].sort((a, b) =>
    getName(a).localeCompare(getName(b), 'ru', { sensitivity: 'base' })
  )

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
        const grouped = new Map<string, Ingredient[]>()
        ingredients.forEach(ingredient => {
          const items = grouped.get(ingredient.category) ?? []
          items.push(ingredient)
          grouped.set(ingredient.category, items)
        })
        
setIngredientCategories(
  sortByName(
    Array.from(grouped, ([label, categoryIngredients]) => {
      const byName = categoryIngredients.reduce(
        (map, ingredient) => {
          const variants = map.get(ingredient.name) ?? []
          variants.push(ingredient)
          map.set(ingredient.name, variants)
          return map
        },
        new Map<string, Ingredient[]>()
      )

      return {
        key: label,
        label,
        groups: sortByName(
          Array.from(byName, ([name, variants]) => ({
            name,
            variants: sortByName(
              variants,
              item => item.subtype ?? ''
            ),
          })),
          group => group.name
        ),
      }
    }),
    category => category.label
  )
)
 => ({
          key: label,
          label,
          groups: Array.from(
            categoryIngredients.reduce((byName, ingredient) => {
              const variants = byName.get(ingredient.name) ?? []
              variants.push(ingredient)
              byName.set(ingredient.name, variants)
              return byName
            }, new Map<string, Ingredient[]>()),
            ([name, variants]) => ({ name, variants }),
          ),
        })))      } catch (err) {
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
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }
  const filteredCategories = ingredientCategories.map(category => ({
    ...category,
    groups: category.groups.filter(group => (
      group.name.toLowerCase().includes(search.toLowerCase())
      || group.variants.some(item => (
        `${item.name} ${item.subtype ?? ''}`.toLowerCase().includes(search.toLowerCase())
      ))
    )),
  })).filter(category => search === '' || category.groups.length > 0)

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
              {filteredCategories.map((cat: { key: string; label: any; groups: any[] }) => (
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
                      {cat.groups.map(group => {
                        const regular = group.variants.filter(item => !item.subtype || item.subtype.toLowerCase() === 'обыкновенный')
                        const variants = group.variants.filter(item => item.subtype && item.subtype.toLowerCase() !== 'обыкновенный')
                        const groupKey = `${cat.key} — ${group.name}`
                        const renderItem = (ingredient: Ingredient, label: string) => {
                          const value = ingredient.subtype ? `${ingredient.name} — ${ingredient.subtype}` : ingredient.name
                          return (
                            <span key={ingredient.id} className={styles.accordionIngredient}
                              style={selectedIngredients.includes(value) ? {fontWeight: 600,
                                                    background: 'var(--color-accent-alt)',
                                                    borderColor: 'var(--color-accent-alt)',
                                                    color: '#fff'}} : undefined}
                              onClick={() => { if (!saving) toggleIngredient(value) }}>
                              {label}{selectedIngredients.includes(value) ? ' x' : ''}
                            </span>
                          )
                        }
                        return (
                          <div key={groupKey}>
                            {variants.length > 0 && <button className={styles.accordionHeader} 
                               onClick={() => setOpenIngredientGroups(
                                    current => { const next = new Set(current); 
                                    if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey); return next })}>
                                      <span className={styles.accordionChevron}>
                                         {openIngredientGroups.has(groupKey) ? '▼' : '›'}
                                         </span>{group.name}</button>}
                            {variants.length > 0 && openIngredientGroups.has(groupKey) && 
                                <div className={styles.accordionBody}>
                                  {variants.map(item => renderItem(item, item.subtype ?? item.name))}</div>}
                            {regular.map(item => renderItem(item, group.name))}
                          </div>
                        )
                      })}                    </div>
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
