import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, PawPrint, Search } from 'lucide-react'
import styles from './SearchablePetSelect.module.css'

export type PetSelectOption = {
  id: string
  name: string
  breedName?: string
}

type SearchablePetSelectProps = {
  options: PetSelectOption[]
  value: string | null
  loading: boolean
  selecting: boolean
  placeholder: string
  searchPlaceholder: string
  noSelectionLabel: string
  emptyLabel: string
  loadingLabel: string
  selectingLabel: string
  onChange: (petId: string | null) => void
}

export function SearchablePetSelect({
  options,
  value,
  loading,
  selecting,
  placeholder,
  searchPlaceholder,
  noSelectionLabel,
  emptyLabel,
  loadingLabel,
  selectingLabel,
  onChange,
}: SearchablePetSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedPet = options.find(option => option.id === value)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return options
    return options.filter(option =>
      `${option.name} ${option.breedName ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)
    )
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

  const select = (petId: string | null) => {
    onChange(petId)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={loading || selecting}
        onClick={() => setIsOpen(open => !open)}
      >
        <span className={styles.triggerContent}>
          <span className={styles.iconWrap} aria-hidden="true">
            <PawPrint size={17} />
          </span>
          {loading || selecting ? (
            <span className={styles.placeholder}>{loading ? loadingLabel : selectingLabel}</span>
          ) : selectedPet ? (
            <span className={styles.selectedText}>
              <span className={styles.petName}>{selectedPet.name}</span>
              {selectedPet.breedName && (
                <span className={styles.petBreed}>{selectedPet.breedName}</span>
              )}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          size={17}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <label className={styles.searchField}>
            <Search size={15} aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              onChange={event => setQuery(event.target.value)}
            />
          </label>

          <div className={styles.options} role="listbox">
            <button
              type="button"
              role="option"
              aria-selected={value == null}
              className={`${styles.option} ${value == null ? styles.optionSelected : ''}`}
              onClick={() => select(null)}
            >
              <span>{noSelectionLabel}</span>
              {value == null && <Check size={16} aria-hidden="true" />}
            </button>

            {filteredOptions.map(option => {
              const selected = option.id === value
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                  onClick={() => select(option.id)}
                >
                  <span className={styles.optionText}>
                    <span>{option.name}</span>
                    {option.breedName && <small>{option.breedName}</small>}
                  </span>
                  {selected && <Check size={16} aria-hidden="true" />}
                </button>
              )
            })}

            {!filteredOptions.length && <p className={styles.empty}>{emptyLabel}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
