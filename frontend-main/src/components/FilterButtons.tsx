import styles from '../styles/Dashboard.module.css';

interface FilterButtonsProps<T> {
  label: string;
  options: Array<{ value: T; label: string }>;
  selectedValue: T;
  onChange: (value: T) => void;
}

export const FilterButtons = <T extends string>({
  label,
  options,
  selectedValue,
  onChange
}: FilterButtonsProps<T>) => {
  return (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{label}</label>
      <div className={styles.filterButtons}>
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`${styles.filterBtn} ${
              selectedValue === option.value ? styles.filterBtnActive : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
