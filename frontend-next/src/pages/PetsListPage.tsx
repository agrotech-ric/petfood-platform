import styles from './PetsListPage.module.css'
import { FiltersSidebar, type FilterRefs } from '../components/FiltersSidebar'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../utils/apiClient'
import { petSearchService, type PetListItem } from '../../services/petSearchService'
import {
  referenceService,
  type Breed,
  type HealthCondition,
  type ReproductiveStatus,
  type Species,
  type Symptom,
} from '../../services/referenceService'
import {
  EMPTY_PET_DASHBOARD_FILTERS,
  type PetDashboardFilters,
} from '../types/petDashboardFilters'
import { filtersToChips, removeFilterChip } from '../utils/filterChips'

import heartOrange from '../assets/figma/pets-list/heart-orange.svg'
import heartWhite from '../assets/figma/pets-list/heart-white.svg'

function resolveDogSpeciesId(species: Species[]): number {
  if (!species.length) return 0
  const dog =
    species.find(
      (s) =>
        s.code === 'dog' ||
        (s.name && s.name.toLowerCase().includes('соба')) ||
        (s.nameRu && s.nameRu.toLowerCase().includes('соба'))
    ) ?? species[0]
  return dog?.id ?? 0
}

function formatAgeShort(iso: string): string {
  const birth = new Date(iso)
  if (Number.isNaN(birth.getTime())) return ''
  const now = new Date()
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  const years = now.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1)
  if (years <= 0) return '< 1 года'
  return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
}

async function getPhotoUrl(objectKey: string): Promise<string> {
  try {
    const res = await apiClient.get<{ url: string }>(
      `/api/v1/pets/photos/download-url?objectKey=${encodeURIComponent(objectKey)}`
    )
    return res.url
  } catch {
    return ''
  }
}

async function enrichWithPhotos(list: PetListItem[]): Promise<PetListItem[]> {
  return Promise.all(
    list.map(async (p) => {
      if (p.photoObjectKey) {
        return { ...p, photo: await getPhotoUrl(p.photoObjectKey) }
      }
      return p
    })
  )
}

const IconFilters = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 31 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.25 5H28.8816" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M1.25 16H28.8816" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="8.9868" cy="5.25657" r="4.00657" fill="white" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="21.1448" cy="15.7434" r="4.00657" fill="white" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
)

export function PetsListPage() {
  const navigate = useNavigate()
  const [pets, setPets] = useState<PetListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [filters, setFilters] = useState<PetDashboardFilters>({ ...EMPTY_PET_DASHBOARD_FILTERS })
  const searchRef = useRef<HTMLInputElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [refsLoading, setRefsLoading] = useState(true)
  const [breeds, setBreeds] = useState<Breed[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [reproductiveStatuses, setReproductiveStatuses] = useState<ReproductiveStatus[]>([])
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([])

  const filterRefs: FilterRefs = useMemo(
    () => ({
      breeds,
      symptoms,
      reproductiveStatuses,
      healthConditions,
      loading: refsLoading,
    }),
    [breeds, symptoms, reproductiveStatuses, healthConditions, refsLoading]
  )

  const chipLabels = useMemo(
    () => ({ breeds, symptoms, reproductiveStatuses, healthConditions }),
    [breeds, symptoms, reproductiveStatuses, healthConditions]
  )

  const chips = useMemo(() => filtersToChips(filters, chipLabels), [filters, chipLabels])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setRefsLoading(true)
      try {
        const [species, syms, health, reproFemale] = await Promise.all([
          referenceService.fetchSpecies(),
          referenceService.fetchSymptoms(),
          referenceService.fetchHealthConditions(),
          referenceService.fetchReproductiveStatuses('female'),
        ])
        if (cancelled) return
        setSymptoms(syms)
        setHealthConditions(health)
        setReproductiveStatuses(reproFemale)
        const sid = resolveDogSpeciesId(species)
        if (sid) {
          const br = await referenceService.fetchBreedsBySpeciesId(sid)
          if (!cancelled) setBreeds(br)
        }
      } catch {
        if (!cancelled) {
          setBreeds([])
          setSymptoms([])
          setHealthConditions([])
          setReproductiveStatuses([])
        }
      } finally {
        if (!cancelled) setRefsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery), 300)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  const loadPets = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const page = await petSearchService.search(debouncedQ, filters)
      const enriched = await enrichWithPhotos(page.content ?? [])
      setPets(enriched)
    } catch (e) {
      setPets([])
      setLoadError(e instanceof Error ? e.message : 'Не удалось загрузить питомцев')
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, filters])

  useEffect(() => {
    loadPets()
  }, [loadPets])

  const toggleFavorite = async (pet: PetListItem) => {
    const next = !pet.favorite
    setPets((prev) =>
      prev.map((p) => (p.id === pet.id ? { ...p, favorite: next } : p))
    )
    try {
      if (next) {
        await petSearchService.addFavorite(pet.id)
      } else {
        await petSearchService.removeFavorite(pet.id)
      }
    } catch {
      setPets((prev) =>
        prev.map((p) => (p.id === pet.id ? { ...p, favorite: !next } : p))
      )
    }
  }

  return (
    <>
      <FiltersSidebar
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        refs={filterRefs}
      />

        <div className={styles.topBar}>
          <div className={styles.headerSpacer} aria-hidden="true" />
          <h1 className={styles.pageTitle}>Список питомцев</h1>
          <button
            className={styles.registerBtn}
            type="button"
            onClick={() => navigate('/register-pet')}
          >
            Зарегистрировать питомца
          </button>
        </div>

        <div className={styles.contentCard}>
          <div className={styles.searchContainer}>
            <div className={styles.searchRow}>
              <div className={styles.searchInputWrap}>
                <input
                  ref={searchRef}
                  className={styles.searchInput}
                  type="text"
                  placeholder="Поиск по кличке или породе…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  className={styles.searchBtn}
                  type="button"
                  onClick={() => searchRef.current?.focus()}
                  aria-label="Поиск"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>

              <button className={styles.allFiltersBtn} type="button" onClick={() => setFiltersOpen(true)}>
                <IconFilters className={styles.filtersIcon} />
                <span>Все фильтры</span>
              </button>
            </div>

            {chips.length > 0 && (
              <div className={styles.activeFiltersRow}>
                {chips.map((chip) => (
                  <div key={chip.id} className={styles.filterChip}>
                    <span>{chip.label}</span>
                    <button
                      className={styles.chipCloseBtn}
                      onClick={() => setFilters((prev) => removeFilterChip(prev, chip.id))}
                      type="button"
                      aria-label="Удалить фильтр"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadError ? (
            <p className={styles.empty}>{loadError}</p>
          ) : loading ? (
            <p className={styles.empty}>Загрузка питомцев…</p>
          ) : pets.length === 0 ? (
            <p className={styles.empty}>Питомцы не найдены</p>
          ) : (
            <div className={styles.cardsGrid}>
              {pets.map((p) => (
                <PetCard
                  key={p.id}
                  pet={p}
                  liked={Boolean(p.favorite)}
                  onToggleLike={() => toggleFavorite(p)}
                  onClick={() => navigate(`/pet-profile/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>
    </>
  )
}

function PetCard(props: {
  pet: PetListItem
  liked: boolean
  onToggleLike: () => void
  onClick: () => void
}) {
  const { pet, liked, onToggleLike, onClick } = props

  return (
    <article
      className={styles.petCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.petImageWrap}>
        {pet.photo ? (
          <img alt={pet.name} src={pet.photo} className={styles.petImage} />
        ) : (
          <div className={styles.petImagePlaceholder}>
            <span>🐾</span>
          </div>
        )}

        <button
          className={styles.heartBtn}
          type="button"
          aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLike()
          }}
        >
          <img alt="" src={liked ? heartOrange : heartWhite} className={styles.heartIcon} />
        </button>
      </div>

      <div className={styles.petMeta}>
        <div className={styles.petMetaRow}>
          <span className={styles.petName}>{pet.name}</span>
          <span className={styles.petAge}>{formatAgeShort(pet.birthDate)}</span>
        </div>
        <span className={styles.petBreed}>{pet.breedName}</span>
      </div>
    </article>
  )
}
