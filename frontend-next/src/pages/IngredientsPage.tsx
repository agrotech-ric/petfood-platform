import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_INGREDIENTS, FILTER_GROUPS, type Ingredient } from '../data/ingredientsMock'
import styles from '../styles/Ingredients.module.css'
import SearchIcon from '../assets/icons/search.svg?react'

type SortKey = keyof Ingredient
type SortDir = 'asc' | 'desc'

type ActiveFilter = { group: string; key: string; label: string }

const TABLE_COLS: { key: SortKey; label: string }[] = [
  { key: 'category', label: 'Категория' },
  { key: 'name', label: 'Ингредиент' },
  { key: 'subtype', label: 'Подвид' },
  { key: 'protein', label: 'Белки' },
  { key: 'fat', label: 'Жиры' },
  { key: 'moisture', label: 'Влага' },
  { key: 'calcium', label: 'Кальций' },
  { key: 'phosphorus', label: 'Фосфор' },
  { key: 'vitaminB1', label: 'Витамин B1' },
]

export function IngredientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('category')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleFilter = (group: string, key: string, label: string) => {
    setActiveFilters(prev => {
      const exists = prev.find(f => f.key === key)
      if (exists) return prev.filter(f => f.key !== key)
      return [...prev, { group, key, label }]
    })
  }

  const removeFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key))
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let data = [...MOCK_INGREDIENTS]

    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.subtype ?? '').toLowerCase().includes(q)
      )
    }

    data.sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return data
  }, [search, sortKey, sortDir])

  const isFilterActive = (key: string) => activeFilters.some(f => f.key === key)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.headerSpacer} />
        <h1 className={styles.pageTitle}>Ингредиенты</h1>
        <button className={styles.addBtn} onClick={() => navigate('/ingredients/create')}>
          + Добавить ингредиент
        </button>
      </div>

      {/* Content card */}
      <div className={styles.contentCard}>
        {/* Search */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <input
              className={styles.searchInput}
              placeholder="Поиск"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="button" className={styles.searchBtn} aria-label="Search">
              <SearchIcon className={styles.svgSlot} />
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className={styles.filterRow} ref={dropdownRef}>
          {Object.entries(FILTER_GROUPS).map(([groupName, items]) => {
            const isOpen = openGroup === groupName
            const hasActive = items.some(i => isFilterActive(i.key))
            return (
              <div key={groupName} className={styles.filterDropdown}>
                <button
                  className={`${styles.filterBtn} ${hasActive ? styles.filterBtnActive : ''}`}
                  onClick={() => setOpenGroup(isOpen ? null : groupName)}
                >
                  {groupName}
                  <span className={styles.filterChevron}>▼</span>
                </button>
                {isOpen && (
                  <div className={styles.dropdownMenu}>
                    {items.map(item => {
                      const active = isFilterActive(item.key)
                      return (
                        <div
                          key={item.key}
                          className={styles.dropdownItem}
                          onClick={() => toggleFilter(groupName, item.key, item.label)}
                        >
                          <div
                            className={`${styles.checkbox} ${active ? styles.checkboxChecked : ''}`}
                          >
                            {active && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2"/></svg>}
                          </div>
                          {item.label}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className={styles.chipsRow}>
            {activeFilters.map(f => (
              <span key={f.key} className={styles.chip}>
                {f.label}
                <button className={styles.chipRemove} onClick={() => removeFilter(f.key)}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {TABLE_COLS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}>
                    {col.label}
                    <span className={styles.sortIcon}>
                      {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={TABLE_COLS.length} className={styles.emptyRow}>Ничего не найдено</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} onClick={() => navigate(`/ingredients/${item.id}`)}>
                    <td>{item.category}</td>
                    <td>{item.name}</td>
                    <td>{item.subtype ?? '—'}</td>
                    <td>{item.protein}</td>
                    <td>{item.fat}</td>
                    <td>{item.moisture}</td>
                    <td>{item.calcium}</td>
                    <td>{item.phosphorus}</td>
                    <td>{item.vitaminB1}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
