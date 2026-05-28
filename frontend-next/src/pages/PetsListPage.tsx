import styles from './PetsListPage.module.css'
import { Sidebar } from '../components/sidebar/Sidebar'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../utils/apiClient'

import iconSearchBg from '../assets/figma/pets-list/icon-search.png'
import iconMagnifier from '../assets/figma/pets-list/icon-magnifier.png'
import iconFilters from '../assets/figma/pets-list/icon-filters.svg'

import dog1 from '../assets/figma/pets-list/dog1.jpg'
import dog2 from '../assets/figma/pets-list/dog2.jpg'
import heartOrange from '../assets/figma/pets-list/heart-orange.svg'
import heartWhite from '../assets/figma/pets-list/heart-white.svg'

export function PetsListPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const [pets, setPets] = useState<Pet[]>([])
  const [petsLoading, setPetsLoading] = useState(false)
  const [likedById, setLikedById] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    setPetsLoading(true)
    apiClient
      .get<any>('/api/v1/pets/me')
      .then((data) => {
        if (cancelled) return
        let petsList: Pet[] = []
        if (data?.content && Array.isArray(data.content)) {
          petsList = data.content
        } else if (Array.isArray(data)) {
          petsList = data
        } else if (data && typeof data === 'object' && data.id) {
          petsList = [data]
        }
        setPets(petsList)
      })
      .catch(() => {
        if (cancelled) return
        setPets([])
      })
      .finally(() => {
        if (cancelled) return
        setPetsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const openMenu = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setMenuOpen(true)
  }

  const scheduleCloseMenu = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setMenuOpen(false)
      closeTimer.current = null
    }, 120)
  }

  return (
    <div className={styles.outer}>
      <div className={styles.page} data-node-id="39:1197">
        <Sidebar expanded={menuOpen} onMouseEnter={openMenu} onMouseLeave={scheduleCloseMenu} />

        {menuOpen && <div className={styles.backdrop} aria-hidden="true" />}

        <div className={styles.headerCard} />
        <div className={styles.headerTitle}>Список питомцев</div>

        <button className={styles.registerPetBtn} type="button" onClick={() => navigate('/register-pet')}>
          <span>Зарегистрировать питомца</span>
        </button>

        <div className={styles.contentCard} />

        <div className={styles.searchBar} />
        <div className={styles.searchButton}>
          <img alt="" src={iconSearchBg} className={styles.searchButtonBg} />
          <img alt="" src={iconMagnifier} className={styles.searchIcon} />
        </div>

        <div className={styles.allFiltersBtn}>
          <img alt="" src={iconFilters} className={styles.filtersIcon} />
          <span>Все фильтры</span>
        </div>

        <div className={styles.cardsRow}>
          {petsLoading || pets.length === 0 ? (
            <>
              <PetCard
                image={dog1}
                liked={true}
                name="Фред"
                breed="Золотой ретривер"
                age="1 год"
                onClick={() => {}}
                onToggleLike={() => {}}
              />
              <PetCard
                image={dog2}
                liked={false}
                name="Мухтар"
                breed="Немецкая овчарка"
                age="5 год"
                onClick={() => {}}
                onToggleLike={() => {}}
              />
              <PetCard
                image={dog1}
                liked={false}
                name="Фред"
                breed="Золотой ретривер"
                age="1 год"
                onClick={() => {}}
                onToggleLike={() => {}}
              />
            </>
          ) : (
            pets.slice(0, 3).map((p, idx) => (
              <PetCard
                key={p.id}
                image={idx % 2 === 0 ? dog1 : dog2}
                liked={Boolean(likedById[p.id])}
                name={p.name}
                breed={p.breedName}
                age={formatAgeShort(p.birthDate)}
                onClick={() => navigate(`/pet-profile/${p.id}`)}
                onToggleLike={() =>
                  setLikedById((prev) => ({
                    ...prev,
                    [p.id]: !prev[p.id],
                  }))
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

type Pet = {
  id: string
  name: string
  breedName: string
  birthDate: string
  photo?: string
}

function formatAgeShort(birthDateIso: string): string {
  const birth = new Date(birthDateIso)
  if (Number.isNaN(birth.getTime())) return ''
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear() - (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0)
  if (years <= 0) return '0 год'
  return `${years} год`
}

function PetCard(props: {
  image: string
  liked: boolean
  name: string
  breed: string
  age: string
  onClick: () => void
  onToggleLike: () => void
}) {
  return (
    <button className={styles.petCard} type="button" onClick={props.onClick}>
      <div className={styles.petImageWrap}>
        <img alt="" src={props.image} className={styles.petImage} />
        <button
          className={styles.heartButton}
          type="button"
          aria-label={props.liked ? 'Unlike' : 'Like'}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            props.onToggleLike()
          }}
        >
          <img alt="" src={props.liked ? heartOrange : heartWhite} className={styles.heartIcon} />
        </button>
      </div>
      <div className={styles.petMeta}>
        <div className={styles.petName}>{props.name}</div>
        <div className={styles.petAge}>{props.age}</div>
        <div className={styles.petBreed}>{props.breed}</div>
      </div>
    </button>
  )
}

