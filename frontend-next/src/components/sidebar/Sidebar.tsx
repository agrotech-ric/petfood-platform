import styles from './Sidebar.module.css'

import iconLogo from '../../assets/figma/pets-list/icon-logo.png'
import iconFork from '../../assets/figma/pets-list/icon-fork.png'
import iconRecipe from '../../assets/figma/pets-list/icon-recipe.png'
import iconCat from '../../assets/figma/pets-list/icon-cat.png'

export function Sidebar(props: { expanded?: boolean; onOpen?: () => void; onClose?: () => void }) {
  const expanded = props.expanded ?? false

  return (
    <div className={styles.root} data-node-id="39:1201">
      {/* Collapsed rail (always visible) */}
      <button className={styles.railClickArea} type="button" onClick={props.onOpen} aria-label="Open menu" />
      <div className={styles.rail} />

      <img alt="" src={iconLogo} className={styles.logo} />
      <img alt="" src={iconFork} className={styles.iconFork} />
      <img alt="" src={iconRecipe} className={styles.iconRecipe} />
      <img alt="" src={iconCat} className={styles.iconCat} />

      {expanded && (
        <div className={styles.flyout}>
          <button className={styles.flyoutCloseArea} type="button" onClick={props.onClose} aria-label="Close menu" />
          <div className={styles.flyoutPanel} />

          {/* re-render icons above flyout panel */}
          <img alt="" src={iconLogo} className={styles.logo} />
          <img alt="" src={iconFork} className={styles.iconFork} />
          <img alt="" src={iconRecipe} className={styles.iconRecipe} />
          <img alt="" src={iconCat} className={styles.iconCat} />

          <div className={styles.labelPets}>Мои питомцы</div>
          <div className={styles.labelIngredients}>Ингредиенты</div>
          <div className={styles.labelRecipes}>Мои рецепты</div>
          <div className={styles.labelProfile}>Мой профиль</div>
          <div className={styles.labelSettings}>Настройки</div>
          <div className={styles.labelLogout}>Выйти</div>
        </div>
      )}
    </div>
  )
}

