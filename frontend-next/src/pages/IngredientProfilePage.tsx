import { useNavigate, useParams } from 'react-router-dom'
import { MOCK_INGREDIENTS } from '../data/ingredientsMock'
import styles from '../styles/Ingredients.module.css'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import DeleteIcon from '../assets/icons/delete.svg?react'

export function IngredientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = MOCK_INGREDIENTS.find(i => i.id === Number(id))

  if (!item) {
    return (
      <div style={{ padding: '24px' }}>
        <p>Ингредиент не найден</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/ingredients')}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Профиль ингредиента</h1>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/ingredients/${item.id}/edit`)}>
            <EditIcon width={14} height={14} />
            Изменить
          </button>
          <button className={styles.deleteBtn}>
            <DeleteIcon width={14} height={14} />
            Удалить
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className={styles.profileCard}>
        {/* Share/download icons */}
        <div className={styles.profileActions}>
          <button className={styles.iconBtn} title="Поделиться">
            <ShareIcon width={18} height={18} />
          </button>
          <button className={styles.iconBtn} title="Скачать">
            <DownloadIcon width={18} height={18} />
          </button>
        </div>

        <h2 className={styles.profileName}>
          {item.name}{item.subtype ? `, ${item.subtype}` : ''}
        </h2>

        {/* Meta row */}
        <div className={styles.profileMeta}>
          <div className={styles.profileMetaGroup}>
            <span className={styles.profileMetaLabel}>Порция</span>
            <span className={styles.profileMetaValue}>100 г</span>
          </div>
          <div className={styles.profileMetaGroup}>
            <span className={styles.profileMetaLabel}>Энергетическая ценность</span>
            <span className={styles.profileMetaValue}>{item.calories} ккал</span>
          </div>
          <div className={styles.profileMetaGroup}>
            <span className={styles.profileMetaLabel}>Категория</span>
            <span className={styles.profileMetaValue}>{item.category}</span>
          </div>
          <div className={styles.profileMetaGroup}>
            <span className={styles.profileMetaLabel}>ID</span>
            <span className={styles.profileMetaValue}>{item.id.toString().padStart(8, '0')}</span>
          </div>
        </div>

        {/* Nutrients grid */}
        <div className={styles.nutrientsGrid}>
          {/* Left column */}
          <div>
            <div className={styles.nutrientSection}>
              <p className={styles.nutrientSectionTitle}>Основные нутриенты</p>
              {[
                { label: 'Влажность', value: item.moisture, unit: 'г' },
                { label: 'Белки', value: item.protein, unit: 'г' },
                { label: 'Жиры', value: item.fat, unit: 'г' },
                { label: 'Углеводы', value: 0, unit: 'г' },
                { label: 'Клетчатка', value: item.fiber, unit: 'г' },
                { label: 'Зола', value: item.ash, unit: 'г' },
                { label: 'Холестерин', value: item.cholesterol, unit: 'г' },
                { label: 'Сахар общее', value: item.sugar, unit: 'г' },
              ].map(row => (
                <div key={row.label} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{row.label}</span>
                  <span className={styles.nutrientValue}>
                    {row.value} <span className={styles.nutrientUnit}>{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.nutrientSection} style={{ marginTop: 24 }}>
              <p className={styles.nutrientSectionTitle}>Минералы</p>
              {[
                { label: 'Кальций', value: item.calcium, unit: 'мг' },
                { label: 'Фосфор', value: item.phosphorus, unit: 'мг' },
                { label: 'Магний', value: item.magnesium, unit: 'мг' },
                { label: 'Натрий', value: item.sodium, unit: 'мг' },
                { label: 'Калий', value: item.potassium, unit: 'мг' },
                { label: 'Железо', value: item.iron, unit: 'мг' },
                { label: 'Медь', value: item.copper, unit: 'мг' },
                { label: 'Цинк', value: item.zinc, unit: 'мг' },
                { label: 'Марганец', value: item.manganese, unit: 'мг' },
              ].map(row => (
                <div key={row.label} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{row.label}</span>
                  <span className={styles.nutrientValue}>
                    {row.value} <span className={styles.nutrientUnit}>{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.nutrientSection} style={{ marginTop: 24 }}>
              <p className={styles.nutrientSectionTitle}>Жирные кислоты</p>
              {[
                { label: 'Линолевая кислота', value: item.linoleic, unit: 'г' },
                { label: 'Альфа-линоленовая кислота', value: item.alphaLinolenic, unit: 'г' },
                { label: 'Арахидоновая кислота', value: item.arachidonic, unit: 'г' },
                { label: 'Эйкозапентаеновая кислота (ЭПК)', value: item.epa, unit: 'г' },
                { label: 'Докозагексаеновая кислота (ДГК)', value: item.dha, unit: 'г' },
              ].map(row => (
                <div key={row.label} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{row.label}</span>
                  <span className={styles.nutrientValue}>
                    {row.value} <span className={styles.nutrientUnit}>{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className={styles.nutrientSection}>
              <p className={styles.nutrientSectionTitle}>&nbsp;</p>
              {[
                { label: 'Холин', value: item.choline, unit: 'мг' },
                { label: 'Селен', value: item.selenium, unit: 'мкг' },
                { label: 'Йод', value: item.iodine, unit: 'мкг' },
              ].map(row => (
                <div key={row.label} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{row.label}</span>
                  <span className={styles.nutrientValue}>
                    {row.value} <span className={styles.nutrientUnit}>{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.nutrientSection} style={{ marginTop: 24 }}>
              <p className={styles.nutrientSectionTitle}>Витамины</p>
              {[
                { label: 'Витамин А', value: item.vitaminA, unit: 'мкг' },
                { label: 'Витамин Е', value: item.vitaminE, unit: 'мг' },
                { label: 'Витамин Д', value: item.vitaminD, unit: 'мкг' },
                { label: 'Витамин В1 (тиамин)', value: item.vitaminB1, unit: 'мг' },
                { label: 'Витамин В2 (рибофлавин)', value: item.vitaminB2, unit: 'мг' },
                { label: 'Витамин В3 (ниацин)', value: item.vitaminB3, unit: 'мг' },
                { label: 'Витамин В5 (Пантотеновая кислота)', value: item.vitaminB5, unit: 'мг' },
                { label: 'Витамин В6', value: item.vitaminB6, unit: 'мг' },
                { label: 'Витамин В9 (Фолиевая кислота)', value: item.vitaminB9, unit: 'мкг' },
                { label: 'Витамин В12', value: item.vitaminB12, unit: 'мкг' },
                { label: 'Витамин С', value: item.vitaminC, unit: 'мг' },
                { label: 'Витамин К', value: item.vitaminK, unit: 'мкг' },
              ].map(row => (
                <div key={row.label} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{row.label}</span>
                  <span className={styles.nutrientValue}>
                    {row.value} <span className={styles.nutrientUnit}>{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.nutrientSection} style={{ marginTop: 24 }}>
              <p className={styles.nutrientSectionTitle}>Производные витамина А</p>
              {[
                { label: 'Альфа-каротин', value: item.alphaCarotene, unit: 'мкг' },
                { label: 'Бета-каротин', value: item.betaCarotene, unit: 'мкг' },
                { label: 'Бета-криптоксантин', value: item.betaCryptoxanthin, unit: 'мкг' },
                { label: 'Лютеин и зеаксантин', value: item.luteinZeaxanthin, unit: 'мкг' },
                { label: 'Ликопин', value: item.lycopene, unit: 'мкг' },
                { label: 'Ретино', value: item.retinol, unit: 'мкг' },
              ].map(row => (
                <div key={row.label} className={styles.nutrientRow}>
                  <span className={styles.nutrientName}>{row.label}</span>
                  <span className={styles.nutrientValue}>
                    {row.value} <span className={styles.nutrientUnit}>{row.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
