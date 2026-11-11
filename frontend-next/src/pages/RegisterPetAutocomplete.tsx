import { useState } from 'react'
import styles from './RegisterPetPage.module.css'

type Option = { id: string; label: string; detail?: string; searchText?: string }
type Props = {
  id: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  emptyText: string
  invalid?: boolean
}

export function RegisterPetAutocomplete({ id, options, value, onChange, placeholder, emptyText, invalid }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const selected = options.find(option => option.id === value)
  const search = selected ? '' : query.trim().toLocaleLowerCase()
  const matches = options.filter(option => (option.searchText ?? option.label).toLocaleLowerCase().includes(search))
  const listId = `${id}-options`

  const select = (option: Option) => {
    onChange(option.id)
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  return (
    <div className={styles.autocomplete}>
      <input
        id={id}
        className={styles.input}
        type="search"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={selected?.label ?? query}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); setActiveIndex(-1) }}
        onChange={event => {
          setQuery(event.target.value)
          onChange('')
          setActiveIndex(-1)
          setOpen(true)
        }}
        onKeyDown={event => {
          if (event.key === 'Escape' && open) {
            event.preventDefault()
            setOpen(false)
            setActiveIndex(-1)
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex(current => event.key === 'ArrowDown'
              ? Math.min(current + 1, matches.length - 1)
              : Math.max(current - 1, 0))
          } else if (event.key === 'Enter' && open) {
            event.preventDefault()
            if (matches[activeIndex]) select(matches[activeIndex])
          }
        }}
      />
      {open && (
        <div id={listId} role="listbox" aria-label={placeholder} className={styles.autocompleteList}>
          {matches.length === 0 && <p role="status" className={styles.autocompleteEmpty}>{emptyText}</p>}
          {matches.map((option, index) => (
            <button
              id={`${listId}-${index}`}
              className={styles.autocompleteOption}
              data-active={index === activeIndex}
              type="button"
              role="option"
              aria-selected={option.id === value}
              key={option.id}
              tabIndex={-1}
              onMouseDown={event => event.preventDefault()}
              onClick={() => select(option)}
            >
              {option.label}
              {option.detail && <small className={styles.autocompleteDetail}>{option.detail}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
