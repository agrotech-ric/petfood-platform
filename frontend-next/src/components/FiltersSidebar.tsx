import React, { useMemo, useState } from 'react'
import styles from './FiltersSidebar.module.css'
import {
  ACTIVITY_FILTER_GROUPS,
  AGE_OPTIONS,
  EMPTY_PET_DASHBOARD_FILTERS,
  FAVORITE_OPTIONS,
  GENDER_OPTIONS,
  RECIPE_OPTIONS,
  SIZE_OPTIONS,
  type PetDashboardFilters,
} from '../types/petDashboardFilters'
import type { Breed, HealthCondition, ReproductiveStatus, Symptom } from '../../services/referenceService'

const IconFilters = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 31 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.25 5H28.8816" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M1.25 16H28.8816" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="8.9868" cy="5.25657" r="4.00657" fill="white" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="21.1448" cy="15.7434" r="4.00657" fill="white" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
)

const IconClose = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

function breedLabel(b: Breed): string {
  return b.nameRu || b.name || b.nameEn || ''
}

function symptomLabel(s: Symptom): string {
  return s.name || s.nameRu || s.nameEn || ''
}

export type FilterRefs = {
  breeds: Breed[]
  symptoms: Symptom[]
  reproductiveStatuses: ReproductiveStatus[]
  healthConditions: HealthCondition[]
  loading: boolean
}

interface FiltersSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: PetDashboardFilters
  onChange: (filters: PetDashboardFilters) => void
  refs: FilterRefs
}

export function FiltersSidebar({ isOpen, onClose, filters, onChange, refs }: FiltersSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    gender: true,
    age: true,
    weight: true,
    breed: true,
    size: false,
    reproduction: false,
    activity: false,
    health: false,
    symptoms: false,
    favorites: false,
    recipe_status: false,
  })

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const update = (patch: Partial<PetDashboardFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const sortedBreeds = useMemo(
    () => [...refs.breeds].sort((a, b) => breedLabel(a).localeCompare(breedLabel(b), 'ru')),
    [refs.breeds]
  )

  const sortedSymptoms = useMemo(
    () => [...refs.symptoms].sort((a, b) => symptomLabel(a).localeCompare(symptomLabel(b), 'ru')),
    [refs.symptoms]
  )

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <IconClose className={styles.closeIcon} />
        </button>

        <div className={styles.header}>
          <IconFilters className={styles.headerIcon} />
          <h2 className={styles.title}>Все фильтры</h2>
        </div>

        {refs.loading ? (
          <p className={styles.loadingRefs}>Загрузка справочников…</p>
        ) : (
          <div className={styles.filterList}>
            <CheckboxSection
              title="Пол"
              sectionId="gender"
              isOpen={openSections.gender}
              onToggle={() => toggleSection('gender')}
              options={GENDER_OPTIONS.map((o) => ({ key: o.value, label: o.label, checked: filters.genders.includes(o.value) }))}
              onToggleOption={(key) => {
                const genders = filters.genders.includes(key)
                  ? filters.genders.filter((g) => g !== key)
                  : [...filters.genders, key]
                update({ genders })
              }}
            />

            <CheckboxSection
              title="Возраст"
              sectionId="age"
              isOpen={openSections.age}
              onToggle={() => toggleSection('age')}
              options={AGE_OPTIONS.map((o) => ({ key: o.value, label: o.label, checked: filters.ageGroups.includes(o.value) }))}
              onToggleOption={(key) => {
                const ageGroups = filters.ageGroups.includes(key)
                  ? filters.ageGroups.filter((a) => a !== key)
                  : [...filters.ageGroups, key]
                update({ ageGroups })
              }}
            />

            <WeightSection
              isOpen={openSections.weight}
              onToggle={() => toggleSection('weight')}
              minWeight={filters.minWeight}
              maxWeight={filters.maxWeight}
              onApply={(minWeight, maxWeight) => update({ minWeight, maxWeight })}
            />

            <SearchableCheckboxSection
              title="Порода"
              sectionId="breed"
              isOpen={openSections.breed}
              onToggle={() => toggleSection('breed')}
              options={sortedBreeds.map((b) => ({
                key: String(b.id),
                label: breedLabel(b),
                checked: filters.breedIds.includes(b.id),
              }))}
              onToggleOption={(key) => {
                const id = Number(key)
                const breedIds = filters.breedIds.includes(id)
                  ? filters.breedIds.filter((b) => b !== id)
                  : [...filters.breedIds, id]
                update({ breedIds })
              }}
            />

            <CheckboxSection
              title="Размер породы"
              sectionId="size"
              isOpen={openSections.size}
              onToggle={() => toggleSection('size')}
              options={SIZE_OPTIONS.map((o) => ({
                key: o.value,
                label: o.label,
                checked: filters.sizeCategories.includes(o.value),
              }))}
              onToggleOption={(key) => {
                const sizeCategories = filters.sizeCategories.includes(key)
                  ? filters.sizeCategories.filter((s) => s !== key)
                  : [...filters.sizeCategories, key]
                update({ sizeCategories })
              }}
            />

            <CheckboxSection
              title="Репродуктивный статус"
              sectionId="reproduction"
              isOpen={openSections.reproduction}
              onToggle={() => toggleSection('reproduction')}
              options={refs.reproductiveStatuses.map((r) => ({
                key: String(r.id),
                label: r.name || r.nameRu || '',
                checked: filters.reproductiveStatusIds.includes(r.id),
              }))}
              onToggleOption={(key) => {
                const id = Number(key)
                const reproductiveStatusIds = filters.reproductiveStatusIds.includes(id)
                  ? filters.reproductiveStatusIds.filter((x) => x !== id)
                  : [...filters.reproductiveStatusIds, id]
                update({ reproductiveStatusIds })
              }}
            />

            <CheckboxSection
              title="Уровень активности"
              sectionId="activity"
              isOpen={openSections.activity}
              onToggle={() => toggleSection('activity')}
              options={ACTIVITY_FILTER_GROUPS.map((g) => ({
                key: g.label,
                label: g.label,
                checked: g.ids.every((id) => filters.activityTypeIds.includes(id)),
              }))}
              onToggleOption={(key) => {
                const group = ACTIVITY_FILTER_GROUPS.find((g) => g.label === key)
                if (!group) return
                const allSelected = group.ids.every((id) => filters.activityTypeIds.includes(id))
                let activityTypeIds = [...filters.activityTypeIds]
                if (allSelected) {
                  activityTypeIds = activityTypeIds.filter((id) => !group.ids.includes(id))
                } else {
                  for (const id of group.ids) {
                    if (!activityTypeIds.includes(id)) activityTypeIds.push(id)
                  }
                }
                update({ activityTypeIds })
              }}
            />

            <SearchableCheckboxSection
              title="Состояние здоровья"
              sectionId="health"
              isOpen={openSections.health}
              onToggle={() => toggleSection('health')}
              options={refs.healthConditions.map((h) => ({
                key: h.code,
                label: h.nameRu || h.name || h.code,
                checked: filters.healthConditionCodes.includes(h.code),
              }))}
              onToggleOption={(key) => {
                const healthConditionCodes = filters.healthConditionCodes.includes(key)
                  ? filters.healthConditionCodes.filter((c) => c !== key)
                  : [...filters.healthConditionCodes, key]
                update({ healthConditionCodes })
              }}
            />

            <SearchableCheckboxSection
              title="Симптомы"
              sectionId="symptoms"
              isOpen={openSections.symptoms}
              onToggle={() => toggleSection('symptoms')}
              options={[
                { key: 'none', label: 'Нет', checked: filters.symptomIds.includes(-1) },
                ...sortedSymptoms.map((s) => ({
                  key: String(s.id),
                  label: symptomLabel(s),
                  checked: filters.symptomIds.includes(s.id),
                })),
              ]}
              onToggleOption={(key) => {
                const id = key === 'none' ? -1 : Number(key)
                const symptomIds = filters.symptomIds.includes(id)
                  ? filters.symptomIds.filter((s) => s !== id)
                  : [...filters.symptomIds, id]
                update({ symptomIds })
              }}
            />

            <CheckboxSection
              title="Избранные"
              sectionId="favorites"
              isOpen={openSections.favorites}
              onToggle={() => toggleSection('favorites')}
              exclusive
              options={FAVORITE_OPTIONS.map((o) => ({
                key: o.value,
                label: o.label,
                checked: filters.favorite === o.value,
              }))}
              onToggleOption={(key) => {
                const value = key as PetDashboardFilters['favorite']
                update({ favorite: filters.favorite === value && value !== 'all' ? 'all' : value })
              }}
            />

            <CheckboxSection
              title="Наличие рецептуры"
              sectionId="recipe_status"
              isOpen={openSections.recipe_status}
              onToggle={() => toggleSection('recipe_status')}
              exclusive
              options={RECIPE_OPTIONS.map((o) => ({
                key: o.value,
                label: o.label,
                checked: filters.recipeStatus === o.value,
              }))}
              onToggleOption={(key) => {
                const value = key as PetDashboardFilters['recipeStatus']
                update({
                  recipeStatus:
                    filters.recipeStatus === value && value !== 'all' ? 'all' : value,
                })
              }}
            />

            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => onChange({ ...EMPTY_PET_DASHBOARD_FILTERS })}
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </>
  )
}

type OptionRow = { key: string; label: string; checked: boolean }

function CheckboxSection(props: {
  title: string
  sectionId: string
  isOpen: boolean
  onToggle: () => void
  options: OptionRow[]
  onToggleOption: (key: string) => void
  exclusive?: boolean
}) {
  return (
    <FilterAccordion title={props.title} isOpen={props.isOpen} onToggle={props.onToggle}>
      <div className={styles.filterContent}>
        {props.options.map((opt) => (
          <CheckboxRow
            key={opt.key}
            label={opt.label}
            checked={opt.checked}
            onChange={() => props.onToggleOption(opt.key)}
          />
        ))}
      </div>
    </FilterAccordion>
  )
}

function SearchableCheckboxSection(props: {
  title: string
  sectionId: string
  isOpen: boolean
  onToggle: () => void
  options: OptionRow[]
  onToggleOption: (key: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const filtered = searchQuery
    ? props.options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : props.options
  const needsScroll = filtered.length > 5

  return (
    <FilterAccordion title={props.title} isOpen={props.isOpen} onToggle={props.onToggle}>
      <div className={styles.filterContent}>
        <div className={styles.searchInputWrap}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск…"
          />
          <IconSearch className={styles.searchIcon} />
        </div>
        <div className={needsScroll ? styles.scrollableList : undefined}>
          {filtered.map((opt) => (
            <CheckboxRow
              key={opt.key}
              label={opt.label}
              checked={opt.checked}
              onChange={() => props.onToggleOption(opt.key)}
            />
          ))}
        </div>
      </div>
    </FilterAccordion>
  )
}

function WeightSection(props: {
  isOpen: boolean
  onToggle: () => void
  minWeight: number | null
  maxWeight: number | null
  onApply: (min: number | null, max: number | null) => void
}) {
  const [minVal, setMinVal] = useState('')
  const [maxVal, setMaxVal] = useState('')

  React.useEffect(() => {
    setMinVal(props.minWeight != null ? String(props.minWeight) : '')
    setMaxVal(props.maxWeight != null ? String(props.maxWeight) : '')
  }, [props.minWeight, props.maxWeight])

  const apply = () => {
    const min = minVal === '' ? null : Number(minVal)
    const max = maxVal === '' ? null : Number(maxVal)
    if (min != null && max != null && min > max) return
    props.onApply(min, max)
  }

  const minNum = Number(minVal) || 0
  const maxNum = maxVal === '' ? 100 : Number(maxVal)
  const leftPercent = Math.min(100, Math.max(0, (minNum / 100) * 100))
  const rightPercent = Math.min(100, Math.max(0, 100 - (maxNum / 100) * 100))

  return (
    <FilterAccordion title="Вес, кг" isOpen={props.isOpen} onToggle={props.onToggle}>
      <div className={styles.filterContent}>
        <div className={styles.rangeRow}>
          <div className={styles.rangeInputWrap}>
            <input
              type="number"
              className={styles.rangeInput}
              placeholder="0"
              value={minVal}
              onChange={(e) => setMinVal(e.target.value)}
              onBlur={apply}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
            />
          </div>
          <span className={styles.rangeDash}>—</span>
          <div className={styles.rangeInputWrap}>
            <input
              type="number"
              className={styles.rangeInput}
              placeholder="100"
              value={maxVal}
              onChange={(e) => setMaxVal(e.target.value)}
              onBlur={apply}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
            />
          </div>
        </div>
        <div className={styles.rangeSliderContainer}>
          <div
            className={styles.rangeSliderFill}
            style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
          />
          <input
            type="range"
            className={styles.rangeInputThumb}
            min="0"
            max="100"
            value={minNum}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (maxVal !== '' && v > Number(maxVal)) return
              setMinVal(e.target.value)
            }}
            onMouseUp={apply}
            onTouchEnd={apply}
          />
          <input
            type="range"
            className={styles.rangeInputThumb}
            min="0"
            max="100"
            value={maxNum}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (minVal !== '' && v < Number(minVal)) return
              setMaxVal(e.target.value)
            }}
            onMouseUp={apply}
            onTouchEnd={apply}
          />
        </div>
      </div>
    </FilterAccordion>
  )
}

function FilterAccordion(props: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.filterItem}>
      <button className={styles.filterHeader} type="button" onClick={props.onToggle}>
        <span className={styles.filterName}>{props.title}</span>
        <IconChevronDown className={`${styles.chevron} ${props.isOpen ? styles.chevronOpen : ''}`} />
      </button>
      {props.isOpen && props.children}
    </div>
  )
}

function CheckboxRow(props: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={styles.checkboxRow}>
      <input
        type="checkbox"
        className={styles.checkboxInput}
        checked={props.checked}
        onChange={props.onChange}
      />
      <div className={styles.customCheckbox}>
        <IconCheck className={styles.checkmark} />
      </div>
      <span className={styles.checkboxLabel}>{props.label}</span>
    </label>
  )
}
