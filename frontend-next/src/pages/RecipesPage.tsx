import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_RECIPES, RECIPE_FILTER_GROUPS } from '../data/recipesMock'
import { FiltersDrawer } from '../components/recipes/FiltersDrawer'
import EditRecipeIcon from '../assets/icons/edit-recipe.svg?react'
import SearchIcon from '../assets/icons/search.svg?react'
import styles from '../styles/Recipes.module.css'

type ActiveFilter = { groupKey: string; optionKey: string; label: string }

export function RecipesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  const activeKeys = useMemo(
    () => new Set(activeFilters.map(f => f.optionKey)),
    [activeFilters]
  )

  const toggleFilter = (groupKey: string, optionKey: string, label: string) => {
    setActiveFilters(prev => {
      const exists = prev.find(f => f.optionKey === optionKey)
      if (exists) return prev.filter(f => f.optionKey !== optionKey)
      return [...prev, { groupKey, optionKey, label }]
    })
  }

  const removeFilter = (optionKey: string) => {
    setActiveFilters(prev => prev.filter(f => f.optionKey !== optionKey))
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_RECIPES
    const q = search.toLowerCase()
    return MOCK_RECIPES.filter(r => r.name.toLowerCase().includes(q))
  }, [search])

  const handleAdd = () => {
    navigate('/recipes/create')
  }

  const handleEdit = (id: number) => {
    navigate(`/recipes/${id}`)
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.headerSpacer} />
        <h1 className={styles.pageTitle}>Список всех кормов</h1>
        <button className={styles.addBtn} onClick={handleAdd}>
          + Добавить корм
        </button>
      </div>

      {/* Content card */}
      <div className={styles.contentCard}>
        {/* Search + filters trigger */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <input
              className={styles.searchInput}
              placeholder="Поиск"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="button" className={styles.searchBtn} aria-label="Поиск">
              <SearchIcon width={16} height={16} />
            </button>
          </div>

          <button className={styles.allFiltersBtn} onClick={() => setDrawerOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
            Все фильтры
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className={styles.chipsRow}>
            {activeFilters.map(f => (
              <span key={f.optionKey} className={styles.chip}>
                {f.label}
                <button className={styles.chipRemove} onClick={() => removeFilter(f.optionKey)}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Тип</th>
                <th>Формат</th>
                <th>Возрастная категория</th>
                <th>Последнее изменения</th>
                <th>Изменить</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className={styles.emptyRow}>Ничего не найдено</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.format}</td>
                    <td>{item.ageCategory}</td>
                    <td>{item.lastModified}</td>
                    <td>
                      <button className={styles.editIconBtn} onClick={() => handleEdit(item.id)} aria-label="Изменить">
                        <EditRecipeIcon width={16} height={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FiltersDrawer
        isOpen={isDrawerOpen}
        groups={RECIPE_FILTER_GROUPS}
        activeKeys={activeKeys}
        onToggleOption={toggleFilter}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
