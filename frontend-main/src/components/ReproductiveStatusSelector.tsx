import { useEffect, useState } from 'react';
import PetRegistrationDropdown from './PetRegistrationDropdown';
import styles from '../styles/PetRegistration.module.css';
import reproStyles from '../styles/ReproductiveStatus.module.css';
import { PetFormData, FormErrors } from '../types/petForm';
import { REPRODUCTIVE_STATUSES, LACTATION_WEEKS } from '../const/petForm';

type ReproductiveStatusSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  formData?: PetFormData;
  onFormDataChange?: (field: keyof PetFormData, value: any) => void;
  error?: string;
  errors?: FormErrors;
};

const ReproductiveStatusSelector = ({
  value,
  onChange,
  formData,
  onFormDataChange,
  error,
  errors
}: ReproductiveStatusSelectorProps) => {
  const [lactationWeek, setLactationWeek] = useState(formData?.lactationWeek || '');
  const [puppyCount, setPuppyCount] = useState(formData?.puppyCount || 0);

  useEffect(() => {
    setLactationWeek(formData?.lactationWeek || '');
    setPuppyCount(formData?.puppyCount || 0);
  }, [formData?.lactationWeek, formData?.puppyCount]);

  const handleReproductiveStatusChange = (newValue: string) => {
    onChange(newValue);

    if (newValue !== 'lactation') {
      setLactationWeek('');
      setPuppyCount(0);
      onFormDataChange?.('lactationWeek', '');
      onFormDataChange?.('puppyCount', 0);
    }
  };

  const handleLactationWeekChange = (newValue: string) => {
    setLactationWeek(newValue);
    onFormDataChange?.('lactationWeek', newValue);
  };

  const handlePuppyCountChange = (delta: number) => {
    const newCount = Math.max(0, puppyCount + delta);
    setPuppyCount(newCount);
    onFormDataChange?.('puppyCount', newCount);
  };

  const handlePuppyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(0, parseInt(e.target.value) || 0);
    setPuppyCount(newValue);
    onFormDataChange?.('puppyCount', newValue);
  };

  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Репродуктивный статус <span className={styles.required}>*</span>
        </label>
        <PetRegistrationDropdown
          options={REPRODUCTIVE_STATUSES}
          value={value}
          onChange={handleReproductiveStatusChange}
          placeholder="Выберите из списка"
          error={error}
        />
      </div>

      {value === 'lactation' && (
        <>
          <div className={reproStyles.nestedField}>
            <label className={styles.label}>
              Лактационный период <span className={styles.required}>*</span>
            </label>
            <PetRegistrationDropdown
              options={LACTATION_WEEKS}
              value={lactationWeek}
              onChange={handleLactationWeekChange}
              placeholder="Выберите из списка"
              error={errors?.lactationWeek}
            />
          </div>

          <div className={reproStyles.nestedField}>
          <label className={styles.label}>
            Количество щенков <span className={styles.required}>*</span>
          </label>
          <div className={styles.weightControl}>
            <input
              type="number"
              value={puppyCount}
              onChange={handlePuppyInputChange}
              className={styles.weightInput}
              min="0"
            />
            <button
              type="button"
              className={styles.weightBtn}
              onClick={() => handlePuppyCountChange(-1)}
            >
              −
            </button>
            <button
              type="button"
              className={styles.weightBtn}
              onClick={() => handlePuppyCountChange(1)}
            >
              +
            </button>
          </div>
          {errors?.puppyCount && (
            <p className={styles.error}>{errors.puppyCount}</p>
          )}
        </div>
        </>
      )}
    </>
  );
};

export default ReproductiveStatusSelector;