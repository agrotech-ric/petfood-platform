export type DisorderRecommendation = {
  disorder: string;
  breed_size: string;
  recommended_ingredients: string[];
  top_ingredients_with_scores: Array<{
    ingredient: string;
    score: number;
    category: string;
  }>;
  predicted_nutrients: {
    protein: number;
    fat: number;
    'carbohydrate (nfe)': number;
    'crude fibre': number;
    moisture?: number;
  };
};

export type RangeValue = {
  min: number;
  max: number;
};

export type IngredientRangesType = {
  [ingredient: string]: RangeValue;
};

export type NutrientRangesType = {
  moisture: RangeValue;
  protein: RangeValue;
  carbs: RangeValue;
  fats: RangeValue;
};

export type VetRequest = {
  id: string;
  petName: string;
  petBreed?: string;
  breedName?: string;
  petSpecies?: string;
  speciesName?: string;
  ownerName?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  colorName?: string;
  passportId?: string;
  weightKg: number;
  activityTypeName: string;
  symptoms: string[];
  comments?: string;
  createdAt: string;
};