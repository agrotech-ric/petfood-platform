import { useMemo } from 'react';
import { usePets } from '../../context/PetContext';
import PetRegistrationDropdown from './PetRegistrationDropdown';
import { PetFormData, FormErrors } from '../types/petForm';
import DatePicker from '../components/Calendar';
import styles from '../styles/PetRegistration.module.css';

type PetFormLeftColumnProps = {
  petType: string;
  breed: string;
  dateOfBirth: string;
  passportId: string;
  onInputChange: (field: keyof PetFormData, value: any) => void;
  errors: FormErrors;
};

const PetFormLeftColumn = ({
  petType,
  breed,
  dateOfBirth,
  passportId,
  onInputChange,
  errors
}: PetFormLeftColumnProps) => {
  const { breeds } = usePets();

  const breedOptions = useMemo(() => {
    return breeds.map(b => {
      const displayName = b.nameRu || b.name || b.nameEn || 'Unknown';

      return {
        value: displayName,
        label: displayName
      };
    }).sort((a, b) => a.label.localeCompare(b.label, 'ru'));
  }, [breeds]);

  return (
    <div className={styles.leftColumn}>
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Вид животного <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          value={petType}
          disabled
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Порода <span className={styles.required}>*</span>
        </label>
        {breedOptions.length > 0 ? (
          <PetRegistrationDropdown
            options={breedOptions}
            value={breed}
            onChange={(value) => onInputChange('breed', value)}
            placeholder="Введите или выберите породу"
            error={errors.breed}
            searchable={true}
          />
        ) : (
          <div className={styles.loadingMessage}>
            Загрузка пород...
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>
          Дата рождения <span className={styles.required}>*</span>
        </label>
        <DatePicker
          value={dateOfBirth}
          onChange={(value) => onInputChange('dateOfBirth', value)}
          error={errors.dateOfBirth}
          placeholder="Выберите дату"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>ID паспорта</label>
        <input
          type="text"
          placeholder="Введите ID паспорта"
          value={passportId}
          onChange={(e) => onInputChange('passportId', e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  );
};

export default PetFormLeftColumn;