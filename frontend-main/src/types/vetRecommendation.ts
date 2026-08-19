type NutrientRange = {
  min: number;
  max: number;
};

export type DisorderRecommendation = {
  disorder: string;
  disorder_type: string;
  breed_size: string;
  ingr_ranges: Record<string, { min: number; max: number }>;
  nutrients_ranges: {
    moisture_per: NutrientRange;
    protein_per: NutrientRange;
    fats_per: NutrientRange;
    carbohydrate_per: NutrientRange;
  };
  maxim_main_nutr: string[];
  recommended_ingredients?: string[];
};

export type RangeValue = {
  min: number;
  max: number;
};

export type IngredientRangesType = {
  [ingredient: string]: RangeValue;
};

export type NutrientRangesType = {
  moisture_per: RangeValue;
  protein_per: RangeValue;
  carbohydrate_per: RangeValue;
  fats_per: RangeValue;
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
  reproductiveStatus?: string;
  pregnancyPeriod?: string;
  lactationWeek?: string;
  puppyCount?: number;
};
