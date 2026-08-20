import { IngredientRangesType } from '../types/vetRecommendation';
import { DualRangeSlider } from './DualRangeSlider';
import styles from '../styles/IngredientSelector.module.css';

type Category = {
  category: string;
  items: string[];
};

type IngredientSelectorProps = {
  categories: Category[];
  selectedIngredients: string[];
  recommendedIngredients: string[];
  ingredientRanges: IngredientRangesType;
  onToggleIngredient: (ingredient: string) => void;
  onUpdateRange: (ingredient: string, type: 'min' | 'max', value: number) => void;
  onClearAll: () => void;
};

export const IngredientSelector = ({
  categories,
  selectedIngredients,
  recommendedIngredients,
  ingredientRanges,
  onToggleIngredient,
  onUpdateRange,
  onClearAll
}: IngredientSelectorProps) => {
  return (
    <>
      <h2 className={styles.sectionTitle}>Выбор ингредиентов</h2>
      <div className={styles.ingredientsSection}>
        <div className={styles.ingredientCategories}>
          {categories.map(category => (
            <details key={category.category} className={styles.categoryDetails}>
              <summary className={styles.categoryBtn}>
                <span className={styles.categoryArrow}>›</span>
                <span>{category.category}</span>
              </summary>
              <div className={styles.categoryItems}>
                {category.items.map(item => {
                  const isRecommended = recommendedIngredients.includes(item);
                  const isSelected = selectedIngredients.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => onToggleIngredient(item)}
                      className={`${styles.ingredientButton} ${isSelected ? styles.ingredientButtonSelected : ''} ${isRecommended ? styles.ingredientButtonRecommended : ''}`}
                      title={isRecommended ? 'Рекомендовано для выбранного заболевания' : ''}
                    >
                      {item}
                      {isRecommended && <span className={styles.recommendedBadge}>★</span>}
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </div>

        <div className={styles.selectedIngredients}>
          <h3 className={styles.selectedIngredientsTitle}>Выбранные ингредиенты</h3>
          <div className={styles.ingredientTags}>
            {selectedIngredients.length > 0 ? (
              selectedIngredients.map(ingredient => (
                <span key={ingredient} className={styles.ingredientTag}>
                  {ingredient}
                  <button onClick={() => onToggleIngredient(ingredient)} className={styles.removeTag}>×</button>
                </span>
              ))
            ) : (
              <p className={styles.noIngredients}>Ингредиенты не выбраны</p>
            )}
          </div>
          <button
            onClick={onClearAll}
            className={styles.clearAllBtn}
            disabled={selectedIngredients.length === 0}
          >
            Очистить все
          </button>
        </div>
      </div>

      {selectedIngredients.length > 0 && (
        <>
          <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>
            Ограничения по количеству ингредиентов (в % от 100 г):
          </h2>
          <div className={styles.rangeSliders}>
            {selectedIngredients.map(ingredient => (
              <DualRangeSlider
                key={ingredient}
                label={`${ingredient}:`}
                min={ingredientRanges[ingredient]?.min || 0}
                max={ingredientRanges[ingredient]?.max || 100}
                onMinChange={(val) => onUpdateRange(ingredient, 'min', val)}
                onMaxChange={(val) => onUpdateRange(ingredient, 'max', val)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
};