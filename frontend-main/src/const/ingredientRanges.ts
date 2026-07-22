export const INGREDIENT_RANGE_DEFAULTS = {
  proteins: { min: 40, max: 60 },
  oils: { min: 1, max: 10 },
  carbonates_cer: { min: 5, max: 35 },
  carbonates_veg: { min: 5, max: 25 },
  water: { min: 0, max: 30 },
  other: { min: 1, max: 3 }
};

export type IngredientCategory = keyof typeof INGREDIENT_RANGE_DEFAULTS;

const CATEGORY_MAPPING = {
  'мясо': 'proteins',
  'масло и жир': 'oils',
  'крупы': 'carbonates_cer',
  'овощи и фрукты': 'carbonates_veg',
  'зелень и специи': 'other',
  'яйца и молочные продукты': 'proteins',
  'вода, соль и сахар': 'water',
  'дополнительные пищевые компоненты': 'other'
};

export const getDefaultRangeForIngredient = (
  ingredient: string,
  ingredientCategories: Record<string, string[]>
): { min: number; max: number } => {
  const cleanIngredient = ingredient.replace(" — Обыкновенный", "").trim();
  
  // Check water specifically
  if (cleanIngredient.includes("Вода")) {
    return INGREDIENT_RANGE_DEFAULTS.water;
  }
  
  // Find which category this ingredient belongs to
  for (const [categoryName, categoryItems] of Object.entries(ingredientCategories)) {
    if (categoryItems.includes(ingredient) || categoryItems.includes(cleanIngredient)) {
      const categoryKey = CATEGORY_MAPPING[categoryName.toLowerCase()] || 'other';
      return INGREDIENT_RANGE_DEFAULTS[categoryKey as IngredientCategory];
    }
  }
  
  // Fallback default ranges
  return { min: 0, max: 100 };
};
