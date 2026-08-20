import { useTranslation } from '../../../context/LanguageContext'
import type { CalorieCalculation } from '../../../services/recommenderService'
import adultActive from '../../assets/formulas/adult_active.png'
import adultExtreme from '../../assets/formulas/adult_extreme.png'
import adultModerate from '../../assets/formulas/adult_moderate.png'
import adultObesityProne from '../../assets/formulas/adult_obesity_prone.png'
import lactationLessFive from '../../assets/formulas/lactation_num_pup_less_5.png'
import lactationMoreFive from '../../assets/formulas/lactation_num_pup_more_5.png'
import pregnancyEarly from '../../assets/formulas/pregnancy_early_4_weeks.png'
import pregnancyLate from '../../assets/formulas/pregnancy_last_5_weeks.png'
import puppyTwoMonths from '../../assets/formulas/puppy_2_month.png'
import puppyMoreTwelveMonths from '../../assets/formulas/puppy_more_12_month.png'
import puppyMoreTwoMonths from '../../assets/formulas/puppy_more_2_month.png'
import seniorActiveAdultLow from '../../assets/formulas/senior_active_adult_low.png'
import seniorModerateAdultPassive from '../../assets/formulas/senior_moderate_adult_passive.png'
import seniorPassive from '../../assets/formulas/senior_passive.png'
import styles from '../../styles/CreateRecipe.module.css'

const FORMULA_IMAGES: Record<string, string> = {
  pregnancy_early_4_weeks: pregnancyEarly,
  pregnancy_last_5_weeks: pregnancyLate,
  lactation_num_pup_less_5: lactationLessFive,
  lactation_num_pup_more_5: lactationMoreFive,
  puppy_2_month: puppyTwoMonths,
  puppy_more_2_month: puppyMoreTwoMonths,
  puppy_more_12_month: puppyMoreTwelveMonths,
  senior_passive: seniorPassive,
  senior_moderate_adult_passive: seniorModerateAdultPassive,
  senior_active_adult_low: seniorActiveAdultLow,
  adult_moderate: adultModerate,
  adult_active: adultActive,
  adult_extreme: adultExtreme,
  adult_obesity_prone: adultObesityProne,
}

const FEDIAF_GUIDELINES_URL =
  'https://europeanpetfood.org/wp-content/uploads/2024/09/FEDIAF-Nutritional-Guidelines_2024.pdf'

export function CalorieFormula({
  calculation,
}: {
  calculation: CalorieCalculation | null
}) {
  const { t } = useTranslation()
  const formulaImage = calculation ? FORMULA_IMAGES[calculation.formula] : null

  if (!calculation || !formulaImage) return null

  const sourceUrl = calculation.reference_page
    ? `${FEDIAF_GUIDELINES_URL}#page=${encodeURIComponent(calculation.reference_page)}`
    : FEDIAF_GUIDELINES_URL

  return (
    <div className={styles.formulaSection}>
      <h3 className={styles.formulaTitle}>{t('recipes.energyFormulaTitle')}</h3>
      <img
        src={formulaImage}
        className={styles.formulaImage}
        alt={t('recipes.energyFormulaAlt')}
      />
      {calculation.additional_text && (
        <p className={styles.formulaDescription}>{calculation.additional_text}</p>
      )}
      <p className={styles.formulaSource}>
        {t('recipes.energyFormulaSource')}{' '}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer">FEDIAF</a>
      </p>
    </div>
  )
}
