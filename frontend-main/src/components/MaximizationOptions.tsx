import { Dropdown } from './Dropdown';
import styles from '../styles/MaximizationOptions.module.css';

type MaximizationOptionsProps = {
  maximizeNutrients: string[];
  onToggle: (nutrient: string) => void;
};

const NUTRIENT_OPTIONS = [
  { value: 'moisture_per', label: 'Влага' },
  { value: 'protein_per', label: 'Белки' },
  { value: 'carbohydrate_per', label: 'Углеводы' },
  { value: 'fats_per', label: 'Жиры' }
];

export const MaximizationOptions = ({ maximizeNutrients, onToggle }: MaximizationOptionsProps) => {
  const handleChange = (values: string | string[]) => {
    console.log(maximizeNutrients);
    const valuesArray = Array.isArray(values) ? values : [values];
    
    const added = valuesArray.find(v => !maximizeNutrients.includes(v));
    const removed = maximizeNutrients.find(v => !valuesArray.includes(v));
    
    if (added) {
      onToggle(added);
    } else if (removed) {
      onToggle(removed);
    }
  };

  return (
    <>
      <h2 className={styles.sectionTitle}>Максимизация</h2>
      <p className={styles.maximizationSubtext}>Выберите нутриенты для максимизации:</p>
      
      <Dropdown
        options={NUTRIENT_OPTIONS}
        value={maximizeNutrients}
        onChange={handleChange}
        placeholder="Выберите нутриенты"
        multiple={true}
      />
    </>
  );
};