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
          min={nutrientRanges.moisture_per.min}
          max={nutrientRanges.moisture_per.max}
          onMinChange={(val) => onUpdateRange('moisture_per', 'min', val)}
          onMaxChange={(val) => onUpdateRange('moisture_per', 'max', val)}
        />
        <DualRangeSlider
          label="Белки:"
          min={nutrientRanges.protein_per.min}
          max={nutrientRanges.protein_per.max}
          onMinChange={(val) => onUpdateRange('protein_per', 'min', val)}
          onMaxChange={(val) => onUpdateRange('protein_per', 'max', val)}
        />
        <DualRangeSlider
          label="Углеводы:"
          min={nutrientRanges.carbohydrate_per.min}
          max={nutrientRanges.carbohydrate_per.max}
          onMinChange={(val) => onUpdateRange('carbohydrate_per', 'min', val)}
          onMaxChange={(val) => onUpdateRange('carbohydrate_per', 'max', val)}
        />
        <DualRangeSlider
          label="Жиры:"
          min={nutrientRanges.fats_per.min}
          max={nutrientRanges.fats_per.max}
          onMinChange={(val) => onUpdateRange('fats_per', 'min', val)}
          onMaxChange={(val) => onUpdateRange('fats_per', 'max', val)}
        />
      </div>
    </>
  );
};
