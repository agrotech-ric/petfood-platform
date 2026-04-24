import styles from '../styles/PetProfile.module.css';

interface PetProfileParamItemProps {
  label: string;
  value: string | number | null | undefined;
}

export const PetProfileParamItem = ({ label, value }: PetProfileParamItemProps) => {
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <div className={styles.paramItem}>
      <span className={styles.paramLabel}>{label}</span>
      <span className={styles.paramValue}>{value}</span>
    </div>
  );
};