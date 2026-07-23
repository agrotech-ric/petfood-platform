import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  recipeService,
  type RecipeAgeCategory,
  type RecipeBreedSize,
  type RecipeFormat,
  type RecipeListItem,
  type RecipeType,
} from '../../services/recipeService'
import { ingredientService } from '../../services/ingredientService'
import { referenceService, type RefItem } from '../../services/referenceService'
import {
  RECIPE_AGE_LABELS,
  RECIPE_FORMAT_LABELS,
  RECIPE_TYPE_LABELS,
  STATIC_RECIPE_FILTER_GROUPS,
  type FilterGroup,
} from '../data/recipeOptions'
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
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(STATIC_RECIPE_FILTER_GROUPS)
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const activeKeys = useMemo(
    () => new Set(activeFilters.map(f => `${f.groupKey}:${f.optionKey}`)),
    [activeFilters]
  )

  const toggleFilter = (groupKey: string, optionKey: string, label: string) => {
    setActiveFilters(prev => {
      const exists = prev.find(f => f.groupKey === groupKey && f.optionKey === optionKey)
      if (exists) {
        return prev.filter(f => f.groupKey !== groupKey || f.optionKey !== optionKey)
      }
      return [...prev, { groupKey, optionKey, label }]
    })
  }

  const removeFilter = (groupKey: string, optionKey: string) => {
    setActiveFilters(prev =>
      prev.filter(f => f.groupKey !== groupKey || f.optionKey !== optionKey)
    )
  }

  useEffect(() => {
    let cancelled = false
    const safe = <T,>(request: Promise<T[]>) => request.catch(() => [] as T[])
    const displayName = (item: RefItem) => item.nameRu ?? item.name ?? item.nameEn ?? `ID ${item.id}`

    Promise.all([
      safe(referenceService.fetchReproductiveStatuses('female')),
      safe(referenceService.fetchReproductiveStatuses('male')),
      safe(referenceService.fetchActivityTypes()),
      safe(referenceService.fetchHealthConditions()),
      safe(referenceService.fetchSymptoms()),
      safe(ingredientService.list()),
    ]).then(([femaleStatuses, maleStatuses, activities, conditions, symptoms, ingredients]) => {
      if (cancelled) return
      const statuses = [...femaleStatuses, ...maleStatuses]
        .filter((item, index, items) => items.findIndex(other => other.id === item.id) === index)

      setFilterGroups([
        ...STATIC_RECIPE_FILTER_GROUPS,
        {
          key: 'reproductiveStatus',
          title: 'Репродуктивный статус',
          options: statuses.map(item => ({ key: String(item.id), label: displayName(item) })),
        },
        {
          key: 'activityLevel',
          title: 'Уровень активности',
          options: activities.map(item => ({ key: String(item.id), label: displayName(item) })),
        },
        {
          key: 'healthCondition',
          title: 'Состояние здоровья',
          searchable: true,
          options: conditions.map(item => ({ key: String(item.id), label: displayName(item) })),
        },
        {
          key: 'symptoms',
          title: 'Симптомы',
          searchable: true,
          options: symptoms.map(item => ({ key: String(item.id), label: displayName(item) })),
        },
        {
          key: 'composition',
          title: 'Состав',
          searchable: true,
          options: ingredients.map(item => ({
            key: String(item.id),
            label: item.subtype ? `${item.name}, ${item.subtype}` : item.name,
          })),
        },
      ])
    })

    return () => { cancelled = true }
  }, [])

  const requestFilters = useMemo(() => {
    const values = (groupKey: string) =>
      activeFilters.filter(filter => filter.groupKey === groupKey).map(filter => filter.optionKey)
    const ids = (groupKey: string) => values(groupKey).map(Number).filter(Number.isInteger)

    return {
      types: values('type') as RecipeType[],
      formats: values('format') as RecipeFormat[],
      ageCategories: values('ageCategory') as RecipeAgeCategory[],
      breedSizes: values('breedSize') as RecipeBreedSize[],
      reproductiveStatusIds: ids('reproductiveStatus'),
      activityTypeIds: ids('activityLevel'),
      healthConditionIds: ids('healthCondition'),
      symptomIds: ids('symptoms'),
      ingredientIds: ids('composition'),
    }
  }, [activeFilters])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const timer = window.setTimeout(() => {
      recipeService.list({
        search,
        ...requestFilters,
        sort: 'updatedAt',
        direction: 'desc',
      }).then(data => {
        if (!cancelled) setRecipes(data)
      }).catch(errorValue => {
        if (!cancelled) {
          setRecipes([])
          setError(errorValue instanceof Error ? errorValue.message : 'Не удалось загрузить рецепты')
        }
      }).finally(() => {
        if (!cancelled) setLoading(false)
      })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [search, requestFilters, reloadKey])

  const handleAdd = () => {
    navigate('/recipes/create')
  }

  const handleOpenProfile = (id: number) => {
    navigate(`/recipes/${id}`)
  }

  const handleEdit = (id: number) => {
    navigate(`/recipes/${id}/edit`)
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('ru-RU')

  return (
    <div className={styles.page}>
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
            <button
              type="button"
              className={styles.searchBtn}
              aria-label="Поиск"
              onClick={() => setReloadKey(value => value + 1)}
            >
              <SearchIcon width={16} height={16} className="no-filter" />
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
                <button className={styles.chipRemove} onClick={() => removeFilter(f.groupKey, f.optionKey)}>×</button>
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
              {loading ? (
                <tr><td colSpan={6} className={styles.emptyRow}>Загрузка...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    Не удалось загрузить рецепты
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr><td colSpan={6} className={styles.emptyRow}>Ничего не найдено</td></tr>
              ) : (
                recipes.map(item => (
                  <tr
                    key={item.id}
                    className={styles.clickableRow}
                    tabIndex={0}
                    onClick={() => handleOpenProfile(item.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleOpenProfile(item.id)
                      }
                    }}
                  >
                    <td>{item.name}</td>
                    <td>{RECIPE_TYPE_LABELS[item.type]}</td>
                    <td>{RECIPE_FORMAT_LABELS[item.format]}</td>
                    <td>{RECIPE_AGE_LABELS[item.ageCategory]}</td>
                    <td>{formatDate(item.updatedAt)}</td>
                    <td>
                      <button
                        className={styles.editIconBtn}
                        onClick={event => {
                          event.stopPropagation()
                          handleEdit(item.id)
                        }}
                        aria-label={`Изменить ${item.name}`}
                      >
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
        groups={filterGroups}
        activeKeys={activeKeys}
        onToggleOption={toggleFilter}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
