import { NutrientRangesType } from '../types/vetRecommendation';
import { DualRangeSlider } from './DualRangeSlider';
import styles from '../styles/NutrientRanges.module.css';

type NutrientRangesProps = {
  nutrientRanges: NutrientRangesType;
  onUpdateRange: (nutrient: keyof NutrientRangesType, type: 'min' | 'max', value: number) => void;
};

export const NutrientRanges = ({ nutrientRanges, onUpdateRange }: NutrientRangesProps) => {
  return (
    <>
      <h2 className={styles.sectionTitle}>Ограничения по нутриентам:</h2>
      <div className={styles.rangeSliders}>
        <DualRangeSlider
          label="Влага:"
          min={nutrientRanges.moisture.min}
          max={nutrientRanges.moisture.max}
          onMinChange={(val) => onUpdateRange('moisture', 'min', val)}
          onMaxChange={(val) => onUpdateRange('moisture', 'max', val)}
        />
        <DualRangeSlider
          label="Белки:"
          min={nutrientRanges.protein.min}
          max={nutrientRanges.protein.max}
          onMinChange={(val) => onUpdateRange('protein', 'min', val)}
          onMaxChange={(val) => onUpdateRange('protein', 'max', val)}
        />
        <DualRangeSlider
          label="Углеводы:"
          min={nutrientRanges.carbs.min}
          max={nutrientRanges.carbs.max}
          onMinChange={(val) => onUpdateRange('carbs', 'min', val)}
          onMaxChange={(val) => onUpdateRange('carbs', 'max', val)}
        />
        <DualRangeSlider
          label="Жиры:"
          min={nutrientRanges.fats.min}
          max={nutrientRanges.fats.max}
          onMinChange={(val) => onUpdateRange('fats', 'min', val)}
          onMaxChange={(val) => onUpdateRange('fats', 'max', val)}
        />
      </div>
    </>
  );
};