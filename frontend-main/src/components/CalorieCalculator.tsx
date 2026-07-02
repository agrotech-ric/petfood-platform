import styles from '../styles/CalorieCalculator.module.css';

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
  const renderFormula = (formulaText: string) => {
    if (!formulaText) return null;

    const lines = formulaText.split('\\\\').map(line => line.trim());
    
    return (
      <div className={styles.formulaContainer}>
        {lines.map((line, index) => {
          // Parse text parts and math parts
          const parts: Array<{ type: 'text' | 'math'; content: string }> = [];
          let lastIndex = 0;
          const mathPattern = /\\text\{([^}]*)\}|([^\\]*)/g;
          let match;

          while ((match = mathPattern.exec(line)) !== null) {
            if (match[1] !== undefined) {
              // \text{...} part
              parts.push({ type: 'text', content: match[1] });
            } else if (match[2]) {
              // Math part
              parts.push({ type: 'math', content: match[2] });
            }
          }

          return (
            <div key={index} className={styles.formulaLine}>
              {parts.map((part, idx) =>
                part.type === 'text' ? (
                  <span key={idx} className={styles.formulaText}>
                    {part.content}
                  </span>
                ) : (
                  <span key={idx} className={styles.formulaMath}>
                    {part.content}
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
          {renderFormula(formula)}
          {referencePage && (
            <p className={styles.referencePageText}>
              Источник: страница {referencePage}
            </p>
          )}
        </div>
      )}
    </>
  );
};
