import { useReferenceData } from '../hooks/useReferenceData';
import PetRegistrationDropdown from './PetRegistrationDropdown';
import styles from '../styles/PetRequestForm.module.css';

type ActivityDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export const ActivityDropdown = ({ value, onChange, error }: ActivityDropdownProps) => {
  const { activityTypes, isLoading, error: fetchError } = useReferenceData();

  if (isLoading) {
    return (
      <div className={styles.section}>
        <label className={styles.label}>
          Активность: <span className={styles.required}>*</span>
        </label>
        <div style={{ padding: '1rem', color: '#666' }}>
          Загрузка...
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.section}>
        <label className={styles.label}>
          Активность: <span className={styles.required}>*</span>
        </label>
        <div style={{ padding: '1rem', color: '#d32f2f', backgroundColor: '#ffebee', borderRadius: '8px' }}>
          {fetchError}
        </div>
      </div>
    );
  }

  const activityOptions = [
    { value: '', label: 'Выберите из списка' },
    ...activityTypes.map(type => ({
      value: type.name,
      label: type.name
    }))
  ];

  return (
    <div className={styles.section}>
      <label className={styles.label}>
        Активность: <span className={styles.required}>*</span>
      </label>
      <PetRegistrationDropdown
        options={activityOptions}
        value={value}
        onChange={onChange}
        placeholder="Выберите из списка"
        error={error}
      />
    </div>
  );
};