import { useState } from 'react'
import type { FilterGroup } from '../../data/recipeOptions'
import styles from '../../styles/Recipes.module.css'

type Props = {
  isOpen: boolean
  groups: FilterGroup[]
  activeKeys: Set<string>
  onToggleOption: (groupKey: string, optionKey: string, label: string) => void
  onClose: () => void
}

export function FiltersDrawer({ isOpen, groups, activeKeys, onToggleOption, onClose }: Props) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
              <line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
            Все фильтры
          </span>
          <button className={styles.drawerCloseBtn} onClick={onClose}>×</button>
        </div>

        {groups.map(group => {
          const isOpenGroup = openGroups.has(group.key)
          const search = (groupSearch[group.key] ?? '').toLowerCase()
          const visibleOptions = group.searchable
            ? group.options.filter(o => o.label.toLowerCase().includes(search))
            : group.options

          return (
            <div key={group.key} className={styles.filterGroup}>
              <div className={styles.filterGroupHeader} onClick={() => toggleGroup(group.key)}>
                <span className={styles.filterGroupTitle}>{group.title}</span>
                <span className={`${styles.filterGroupChevron} ${isOpenGroup ? styles.filterGroupChevronOpen : ''}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>

              {isOpenGroup && (
                <div className={styles.filterGroupBody}>
                  {group.searchable && (
                    <div className={styles.filterSearchBox}>
                      <input
                        className={styles.filterSearchInput}
                        placeholder="Поиск"
                        value={groupSearch[group.key] ?? ''}
                        onChange={e => setGroupSearch(prev => ({ ...prev, [group.key]: e.target.value }))}
                      />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-muted)' }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                  )}
                  <div className={styles.filterOptionsList}>
                    {visibleOptions.map(opt => {
                      const isActive = activeKeys.has(`${group.key}:${opt.key}`)
                      return (
                        <label key={opt.key} className={styles.filterOption}>
                          <span
                            className={`${styles.checkbox} ${isActive ? styles.checkboxChecked : ''}`}
                            onClick={() => onToggleOption(group.key, opt.key, opt.label)}
                          >
                            {isActive && (
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" fill="none"/>
                              </svg>
                            )}
                          </span>
                          <span onClick={() => onToggleOption(group.key, opt.key, opt.label)}>
                            {opt.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
