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
    [...items].sort((a, b) => getName(a).localeCompare(getName(b), 'ru', { sensitivity: 'base' }))

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
              const byName = categoryIngredients.reduce((map, ingredient) => {
                const variants = map.get(ingredient.name) ?? []
                variants.push(ingredient)
                map.set(ingredient.name, variants)
                return map
              }, new Map<string, Ingredient[]>())

              return {
                key: label,
                label,
                groups: sortByName(
                  Array.from(byName, ([name, variants]) => ({
                    name,
                    variants: sortByName(variants, item => item.subtype ?? ''),
                  })),
                  group => group.name,
                ),
              }
            }),
            category => category.label,
          ),
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось загрузить противопоказания')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()
    return () => { cancelled = true }
  }, [id])

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients(prev => prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name])
  }

  const filteredCategories = ingredientCategories.map(category => ({
    ...category,
    groups: category.groups.filter(group => {
      const query = search.toLowerCase()
      return group.name.toLowerCase().includes(query)
        || group.variants.some(item => `${item.name} ${item.subtype ?? ''}`.toLowerCase().includes(query))
    }),
  })).filter(category => search === '' || category.groups.length > 0)

  const goBack = () => navigate(`/pet-profile/${id}`, { state: { tab: returnTab } })

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      await petService.updateContraindications(id, { ingredients: selectedIngredients, description: description.trim() })
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
        <button className={styles.backBtn} onClick={goBack}>‹ Назад</button>
        <h1 className={styles.headerTitle}>Особенности питания</h1>
        <div style={{ width: 80 }} />
      </div>
      <div className={styles.card}>
        {error && <p className={styles.fieldLabel}>{error}</p>}
        <div className={styles.fieldGroup} style={{ marginBottom: 20 }}>
          <label className={styles.fieldLabel}>Описание</label>
          <textarea className={styles.fieldTextarea} value={description} disabled={loading || saving} onChange={event => setDescription(event.target.value)} />
        </div>
        <div className={styles.twoPanel}>
          <div>
            <p className={styles.panelTitle}>Нежелательные ингредиенты</p>
            <div className={styles.ingredientSearch}>
              <input className={styles.ingredientSearchInput} placeholder="Поиск" value={search} disabled={loading || saving} onChange={event => setSearch(event.target.value)} />
            </div>
            <div className={styles.accordionList}>
              {filteredCategories.map(category => (
                <div key={category.key} className={styles.accordionItem}>
                  <button className={styles.accordionHeader} onClick={() => toggleCategory(category.key)}>
                    <span className={styles.accordionChevron}>{openCategories.has(category.key) ? '▼' : '›'}</span>{category.label}
                  </button>
                  {openCategories.has(category.key) && <div className={styles.accordionBody}>
                    {category.groups.map(group => {
                      const regular = group.variants.filter(item => !item.subtype || item.subtype.toLowerCase() === 'обыкновенный')
                      const variants = group.variants.filter(item => item.subtype && item.subtype.toLowerCase() !== 'обыкновенный')
                      const groupKey = `${category.key}-${group.name}`
                      const render = (ingredient: Ingredient, label: string) => {
                        const value = ingredient.subtype ? `${ingredient.name} — ${ingredient.subtype}` : ingredient.name
                        return <span key={ingredient.id} className={styles.accordionIngredient} style={selectedIngredients.includes(value) ? { color: 'var(--color-accent-alt)', fontWeight: 600 } : undefined} onClick={() => !saving && toggleIngredient(value)}>{selectedIngredients.includes(value) ? '✓ ' : ''}{label}</span>
                      }
                      return <div key={groupKey}>
                        {variants.length > 0 && <button className={styles.accordionHeader} onClick={() => setOpenIngredientGroups(prev => { const next = new Set(prev); if (next.has(groupKey)) next.delete(groupKey); else next.add(groupKey); return next })}><span className={styles.accordionChevron}>{openIngredientGroups.has(groupKey) ? '▼' : '›'}</span>{group.name}</button>}
                        {variants.length > 0 && openIngredientGroups.has(groupKey) && <div className={styles.accordionBody}>{variants.map(item => render(item, item.subtype ?? item.name))}</div>}
                        {regular.map(item => render(item, group.name))}
                      </div>
                    })}
                  </div>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className={styles.panelTitle}>Выбранные нежелательные ингредиенты</p>
            <div className={styles.chipsBox} style={{ minHeight: 80 }}>
              {selectedIngredients.map(ingredient => <span key={ingredient} className={styles.chip}>{ingredient}<button className={styles.chipRemove} onClick={() => toggleIngredient(ingredient)} disabled={saving}>×</button></span>)}
              {selectedIngredients.length === 0 && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Нет выбранных ингредиентов</span>}
            </div>
          </div>
        </div>
        <button className={styles.saveBtn} onClick={handleSave} disabled={loading || saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
      </div>
    </div>
  )
}
