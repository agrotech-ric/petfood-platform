import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import styles from './SearchableNutrientSelect.module.css'

type NutrientOption = {
  key: string
  label: string
}

type SearchableNutrientSelectProps = {
  options: readonly NutrientOption[]
  value: string[]
  onChange: (value: string[]) => void
}

export function SearchableNutrientSelect({
  options,
  value,
  onChange,
}: SearchableNutrientSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedLabels = options
    .filter(option => value.includes(option.key))
    .map(option => option.label)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')
    if (!normalizedQuery) return options
    return options.filter(option => option.label.toLocaleLowerCase('ru-RU').includes(normalizedQuery))
  }, [options, query])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const toggleOption = (key: string) => {
    onChange(value.includes(key) ? value.filter(item => item !== key) : [...value, key])
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
      >
        <span className={selectedLabels.length ? styles.triggerValue : styles.placeholder}>
          {selectedLabels.length ? selectedLabels.join(', ') : 'Выберите нутриенты'}
        </span>
        <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <label className={styles.searchField}>
            <Search size={15} aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={query}
              placeholder="Поиск нутриентов"
              onChange={event => setQuery(event.target.value)}
            />
          </label>

          <div className={styles.options} role="listbox" aria-multiselectable="true">
            {filteredOptions.map(option => {
              const selected = value.includes(option.key)
              return (
                <button
                  key={option.key}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                  onClick={() => toggleOption(option.key)}
                >
                  <span>{option.label}</span>
                  {selected && <Check size={16} aria-hidden="true" />}
                </button>
              )
            })}
            {!filteredOptions.length && <p className={styles.empty}>Ничего не найдено</p>}
          </div>
        </div>
      )}
    </div>
  )
}
