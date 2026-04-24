import styles from '../styles/PetRegistration.module.css';

type GenderSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const GenderSelector = ({ value, onChange, error }: GenderSelectorProps) => {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        Пол <span className={styles.required}>*</span>
      </label>
      <div className={styles.genderButtons}>
        <button
          type="button"
          onClick={() => onChange('female')}
          className={`${styles.genderBtn} ${value === 'female' ? styles.genderBtnActiveCustom : ''}`}
        >
          Самка
        </button>
        <button
          type="button"
          onClick={() => onChange('male')}
          className={`${styles.genderBtn} ${value === 'male' ? styles.genderBtnActiveCustom : ''}`}
        >
          Самец
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default GenderSelector;