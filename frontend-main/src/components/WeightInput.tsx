import styles from '../styles/PetRegistration.module.css';

type WeightInputProps = {
  value: number;
  onChange: (value: number) => void;
  error?: string;
};

const WeightInput = ({ value, onChange, error }: WeightInputProps) => {
  const handleIncrement = () => {
    onChange(parseFloat((value + 0.1).toFixed(1)));
  };

  const handleDecrement = () => {
    onChange(Math.max(0, parseFloat((value - 0.1).toFixed(1))));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(isNaN(newValue) ? 0 : newValue);
  };

  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        Вес (кг) <span className={styles.required}>*</span>
      </label>
      <div className={styles.weightControl}>
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={handleInputChange}
          className={styles.weightInput}
          min="0"
        />
        <button
          type="button"
          onClick={handleDecrement}
          className={styles.weightBtn}
        >
          −
        </button>
        <button
          type="button"
          onClick={handleIncrement}
          className={styles.weightBtn}
        >
          +
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default WeightInput;