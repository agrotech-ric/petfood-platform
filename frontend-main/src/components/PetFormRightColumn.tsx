import { useMemo } from 'react';
import { usePets } from '../../context/PetContext';
import GenderSelector from './GenderSelector';
import ReproductiveStatusSelector from './ReproductiveStatusSelector';
import PetRegistrationDropdown from './PetRegistrationDropdown';
import WeightInput from './WeightInput';
import { PetFormData, FormErrors } from '../types/petForm';
import styles from '../styles/PetRegistration.module.css';

type PetFormRightColumnProps = {
  name: string;
  gender: string;
  reproductiveStatus: string;
  color: string;
  weight: number;
  formData: PetFormData;
  onInputChange: (field: keyof PetFormData, value: any) => void;
  errors: FormErrors;
};

const PetFormRightColumn = ({
  name,
  gender,
  reproductiveStatus,
  color,
  weight,
  formData,
  onInputChange,
  errors
}: PetFormRightColumnProps) => {
  const { colors } = usePets();

  const colorOptions = useMemo(() => {
    return colors.map(c => ({
      value: c.name,
      label: c.name
    }));
  }, [colors]);

  return (
    <div className={styles.rightColumn}>
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Кличка <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          placeholder="Введите кличку"
          value={name}
          onChange={(e) => onInputChange('name', e.target.value)}
          className={styles.input}
        />
        {errors.name && <p className={styles.error}>{errors.name}</p>}
      </div>

      <GenderSelector
        value={gender}
        onChange={(value) => onInputChange('gender', value)}
        error={errors.gender}
      />

      {gender === 'female' && (
        <ReproductiveStatusSelector
          value={reproductiveStatus}
          onChange={(value) => onInputChange('reproductiveStatus', value)}
          formData={formData}
          onFormDataChange={onInputChange}
          error={errors.reproductiveStatus}
          errors={errors}
        />
      )}

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Окрас <span className={styles.required}>*</span>
        </label>
        {colorOptions.length > 0 ? (
          <PetRegistrationDropdown
            options={colorOptions}
            value={color}
            onChange={(value) => onInputChange('color', value)}
            placeholder="Введите или выберите окрас"
            searchable={true}
            error={errors.color}
          />
        ) : (
          <div className={styles.loadingMessage}>
            Загрузка окрасов...
          </div>
        )}
      </div>

      <WeightInput
        value={weight}
        onChange={(value) => onInputChange('weight', value)}
        error={errors.weight}
      />
    </div>
  );
};

export default PetFormRightColumn;