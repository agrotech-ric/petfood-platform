import type { RecipeCalculationResult } from '../../../services/recipeService'
import { useTranslation } from '../../../context/LanguageContext'
import styles from '../../styles/NutrientBalanceChart.module.css'

type BalanceItem = NonNullable<RecipeCalculationResult['minerals']>[number]
  | NonNullable<RecipeCalculationResult['vitamins']>[number]

export function NutrientBalanceChart({ title, items }: { title: string; items: BalanceItem[] }) {
  const { t } = useTranslation()
  const maxScale = 175
  const ticks = [0, 25, 50, 75, 100, 125, 150]

  return (
    <div className={styles.chart}>
      <p className={styles.title}>{title}</p>
      <div className={styles.normRow}>
        <span />
        <span className={styles.normTrack}>
          <span className={styles.norm} style={{ left: `${(100 / maxScale) * 100}%` }}>
            Норма
          </span>
        </span>
        <span />
      </div>
      <div
        className={styles.rows}
        style={{ gridTemplateRows: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item, index) => {
          const percent = Number.isFinite(item.percent) ? Math.max(0, item.percent) : 0
          const hasValues = item.current != null && item.norm != null
          const difference = hasValues ? Math.abs(item.norm! - item.current!) : 0

          return (
            <div key={`${item.label}-${index}`} className={styles.row} tabIndex={0}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.track}>
                <span
                  className={`${styles.fill} ${percent >= 100 ? styles.fillEnough : styles.fillLow}`}
                  style={{ width: `${Math.min(percent, maxScale) / maxScale * 100}%` }}
                />
                <span
                  className={styles.normLine}
                  style={{ left: `${(100 / maxScale) * 100}%` }}
                />
              </span>
              <span className={styles.percent}>{Math.round(percent)}%</span>
              <span className={styles.tooltip} role="tooltip">
                <strong>{item.label}</strong>
                {hasValues ? (
                  <>
                    <span>
                      Текущее: {item.current}{item.unit
                        ? ` ${t('recipes.unitPer100', { unit: item.unit })}`
                        : ''}
                    </span>
                    <span>Норма: {item.norm} {item.unit ?? ''}</span>
                    <span>
                      {item.current! >= item.norm! ? 'Превышение' : 'Дефицит'}: {Math.round(difference * 100) / 100} {item.unit ?? ''}
                    </span>
                  </>
                ) : (
                  <span>Текущее значение: {Math.round(percent)}% от нормы</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
      <div className={styles.axis}>
        {ticks.map(tick => (
          <span key={tick} style={{ left: `${(tick / maxScale) * 100}%` }}>{tick}</span>
        ))}
      </div>
      <p className={styles.caption}>Процентное соотношение с нормой (%)</p>
    </div>
  )
}
