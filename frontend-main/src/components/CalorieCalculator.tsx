import styles from '../styles/CalorieCalculator.module.css';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';


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
}: CalorieCalculatorProps) => {
  
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

      {formula && (
        <div className={styles.formulaSection}>
          <h3 className={styles.formulaTitle}>Формула расчета</h3>
          <BlockMath math={formula} />
          {referencePage && (
              <p className={styles.referencePageText}>
                Источник: формула расчета по FEDIAF {referencePage}{' '}
                <a
                  href={`https://europeanpetfood.org/wp-content/uploads/2024/09/FEDIAF-Nutritional-Guidelines_2024.pdf#page=${referencePage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть документ
                </a>
              </p>
            )}
        </div>
      )}
    </>
  );
};
