import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ingredientService, type Ingredient } from '../../services/ingredientService'
import styles from '../styles/Ingredients.module.css'
import ShareIcon from '../assets/icons/share.svg?react'
import DownloadIcon from '../assets/icons/download.svg?react'
import EditIcon from '../assets/icons/edit.svg?react'
import DeleteIcon from '../assets/icons/delete.svg?react'

export function IngredientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ingredientId = Number(id)
  const [item, setItem] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!Number.isInteger(ingredientId)) {
      setLoading(false)
      return
    }
    ingredientService.get(ingredientId)
      .then(data => {
        if (!cancelled) setItem(data)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [ingredientId])

  const handleDelete = async () => {
    if (!item || !window.confirm(`Удалить ингредиент «${item.name}»?`)) return
    try {
      await ingredientService.delete(item.id)
      navigate('/ingredients')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось удалить ингредиент')
    }
  }

  const handleShare = async () => {
    const shareData = { title: item?.name ?? 'Ингредиент', url: window.location.href }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      window.alert('Не удалось поделиться ссылкой')
    }
  }

  const handleDownload = () => {
    if (!item) return
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ingredient-${item.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className={styles.page}><p>Загрузка...</p></div>
  }

  if (!item) {
    return (
      <div className={styles.page}>
        <p>Ингредиент не найден</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/ingredients')}>
          ‹ Назад
        </button>
        <h1 className={styles.headerTitle}>Профиль ингредиента</h1>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/ingredients/${item.id}/edit`)}>
            <EditIcon width={20} height={20} className="no-filter" />
            Изменить
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            <DeleteIcon width={20} height={20} className="no-filter" />
            Удалить
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className={styles.profileCard}>
        {/* Share/download icons */}
        <div className={styles.profileActions}>
          <button className={styles.iconBtn} title="Поделиться" onClick={handleShare}>
            <ShareIcon width={30} height={30} />
          </button>
          <button className={styles.iconBtn} title="Скачать" onClick={handleDownload}>
            <DownloadIcon width={30} height={30} />
          </button>
        </div>

        <h2 className={styles.profileName}>
          {item.name}{item.subtype ? `, ${item.subtype}` : ''}
        </h2>

        {/* Meta row */}
        <div className={styles.profileMeta}>
          <div className={styles.profileMetaGroup}>
            <span className={styles.profileMetaLabel}>Порция</span>
            <span className={styles.profileMetaValue}>{item.portion} г</span>
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
                { label: 'Углеводы', value: item.carbs, unit: 'г' },
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
