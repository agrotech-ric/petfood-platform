import styles from '../styles/CalorieCalculator.module.css';

import adult_active from "../formulas/adult_active.png";
import adult_extreme from "../formulas/adult_extreme.png";
import adult_moderate from "../formulas/adult_moderate.png";
import adult_obesity_prone from "../formulas/adult_obesity_prone.png";
import lactation_num_pup_less_5 from "../formulas/lactation_num_pup_less_5.png";
import lactation_num_pup_more_5 from "../formulas/lactation_num_pup_more_5.png";
import pregnancy_early_4_weeks from "../formulas/pregnancy_early_4_weeks.png";
import pregnancy_last_5_weeks from "../formulas/pregnancy_last_5_weeks.png";
import puppy_2_month from "../formulas/puppy_2_month.png";
import puppy_more_2_month from "../formulas/puppy_more_2_month.png";
import puppy_more_12_month from "../formulas/puppy_more_12_month.png";
import senior_passive from "../formulas/senior_passive.png";
import senior_moderate_adult_passive from "../formulas/senior_moderate_adult_passive.png";
import senior_active_adult_low from "../formulas/senior_active_adult_low.png";


const formulaImages: Record<string, string> = {
  "pregnancy_early_4_weeks": pregnancy_early_4_weeks,
  "pregnancy_last_5_weeks": pregnancy_last_5_weeks,
  "lactation_num_pup_less_5": lactation_num_pup_less_5,
  "lactation_num_pup_more_5": lactation_num_pup_more_5,
  "puppy_2_month": puppy_2_month,
  "puppy_more_2_month": puppy_more_2_month,
  "puppy_more_12_month": puppy_more_12_month,
  "senior_passive": senior_passive,
  "senior_moderate_adult_passive": senior_moderate_adult_passive,
  "senior_active_adult_low": senior_active_adult_low,
  "adult_moderate": adult_moderate,
  "adult_active": adult_active,
  "adult_extreme": adult_extreme,
  "adult_obesity_prone": adult_obesity_prone,
};

type CalorieCalculatorProps = {
  targetKcal: number;
  onTargetKcalChange: (value: number) => void;
  dailyKcal: number | null;
  kcalChanged: boolean;
  isCalculatingKcal: boolean;
  onRecalculate: () => void;
  errorMessage?: string | null;
  formula?: string | null;
  referencePage?: string | null;
  additionalText?: string | null;

};



export const CalorieCalculator = ({
  targetKcal,
  onTargetKcalChange,
  dailyKcal,
  kcalChanged,
  isCalculatingKcal,
  onRecalculate,
  errorMessage = null,
  formula = null,
  referencePage = null,
  additionalText = null,

}: CalorieCalculatorProps) => {

  const formulaImage = formula ? formulaImages[formula] : null;
  
  return (
    <>
      <h2 className={styles.sectionTitle}>Целевая энергия (ккал)</h2>
      {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
      <div className={styles.calorieContainer}>
        <input
          type="number"
          value={targetKcal}
          onChange={(e) => onTargetKcalChange(Number(e.target.value))}
          className={styles.kcalInput}
          min="0"
          step="100"
          disabled={isCalculatingKcal}
        />
        
        {dailyKcal && (
          <span className={styles.recommendedText}>
            Рекомендуемая: {dailyKcal} ккал
          </span>
        )}
        {kcalChanged && (
          <button
            onClick={onRecalculate}
            className={styles.recalculateBtn}
          >
            Пересчитать
          </button>
        )}
      </div>

      {formulaImage && (
        <div className={styles.formulaSection}>
          <h3 className={styles.formulaTitle}>Формула расчета</h3>
            {formulaImage && (
              <img
                src={formulaImage}
                className={styles.formulaImage}
              />
            )}
            <p> {additionalText}</p>
            


          {referencePage && (
              <p className={styles.recommendedText}>
                Источник: формула расчета по 
                <a
                  href={`https://europeanpetfood.org/wp-content/uploads/2024/09/FEDIAF-Nutritional-Guidelines_2024.pdf#page=${referencePage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FEDIAF {' '}
                </a>
              </p>
            )}
        </div>
      )}
    </>
  );
};
