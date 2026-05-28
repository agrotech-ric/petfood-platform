import styles from './PetsListPage.module.css'
import { Sidebar } from '../components/sidebar/Sidebar'
import { useState } from 'react'

import iconSearchBg from '../assets/figma/pets-list/icon-search.png'
import iconMagnifier from '../assets/figma/pets-list/icon-magnifier.png'
import iconFilters from '../assets/figma/pets-list/icon-filters.svg'

import dog1 from '../assets/figma/pets-list/dog1.jpg'
import dog2 from '../assets/figma/pets-list/dog2.jpg'
import heartOrange from '../assets/figma/pets-list/heart-orange.svg'
import heartWhite from '../assets/figma/pets-list/heart-white.svg'

export function PetsListPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={styles.outer}>
      <div className={styles.page} data-node-id="39:1197">
        <Sidebar expanded={menuOpen} onOpen={() => setMenuOpen(true)} onClose={() => setMenuOpen(false)} />

        {menuOpen && <button className={styles.backdrop} type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

        <div className={styles.headerCard} />
        <div className={styles.headerTitle}>Список питомцев</div>

        <div className={styles.registerPetBtn}>
          <span>Зарегистрировать питомца</span>
        </div>

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

        <div className={styles.chipsRow}>
          <div className={styles.chip}>Самец&nbsp;&nbsp;X</div>
          <div className={styles.chip}>10 - 25 кг&nbsp;&nbsp;X</div>
          <div className={styles.chip}>Кашель&nbsp;&nbsp;X</div>
          <div className={styles.chip}>Зуд&nbsp;&nbsp;X</div>
          <div className={styles.chip}>Аллергия&nbsp;&nbsp;X</div>
        </div>

        <div className={styles.cardsRow}>
          <PetCard image={dog1} heart={heartOrange} name="Фред" breed="Золотой ретривер" age="1 год" />
          <PetCard image={dog2} heart={heartWhite} name="Мухтар" breed="Немецкая овчарка" age="5 год" />
          <PetCard image={dog1} heart={heartWhite} name="Фред" breed="Золотой ретривер" age="1 год" />
        </div>
      </div>
    </div>
  )
}

function PetCard(props: { image: string; heart: string; name: string; breed: string; age: string }) {
  return (
    <div className={styles.petCard}>
      <div className={styles.petImageWrap}>
        <img alt="" src={props.image} className={styles.petImage} />
        <img alt="" src={props.heart} className={styles.petHeart} />
      </div>
      <div className={styles.petMeta}>
        <div className={styles.petName}>{props.name}</div>
        <div className={styles.petAge}>{props.age}</div>
        <div className={styles.petBreed}>{props.breed}</div>
      </div>
    </div>
  )
}

