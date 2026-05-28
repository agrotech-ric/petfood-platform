import styles from './Sidebar.module.css'

import iconLogo from '../../assets/figma/pets-list/icon-logo.png'
import iconFork from '../../assets/figma/pets-list/icon-fork.png'
import iconRecipe from '../../assets/figma/pets-list/icon-recipe.png'
import iconCat from '../../assets/figma/pets-list/icon-cat.png'

export function Sidebar(props: { expanded?: boolean }) {
  const expanded = props.expanded ?? false

  return (
    <div className={styles.root} data-node-id="39:1201">
      <div className={styles.panel} />

      <img alt="" src={iconLogo} className={styles.logo} />
      <img alt="" src={iconFork} className={styles.iconFork} />
      <img alt="" src={iconRecipe} className={styles.iconRecipe} />
      <img alt="" src={iconCat} className={styles.iconCat} />

      {expanded && (
        <>
          <div className={styles.labelPets}>Мои питомцы</div>
          <div className={styles.labelIngredients}>Ингредиенты</div>
          <div className={styles.labelRecipes}>Мои рецепты</div>
          <div className={styles.labelProfile}>Мой профиль</div>
          <div className={styles.labelSettings}>Настройки</div>
          <div className={styles.labelLogout}>Выйти</div>
        </>
      )}
    </div>
  )
}

