import { apiClient } from './apiClient';
import { OptimizationResult } from '../../context/RequestContext';

export type BreedInfo = {
  breed_info: {
    breed: string;
    min_weight: number;
    max_weight: number;
    avg_weight: number;
    diseases: string[];
  };
};

export type RecipeOptimizationRequest = {
  weight: number;
  age: number;
  age_metric: 'years' | 'months';
  gender: string;
  breed: string;
  activity_level: 'passive' | 'moderate' | 'active';
  ingredients: string[];
  ingredient_ranges: Array<{
    ingredient: string;
    min_percent: number;
    max_percent: number;
  }>;
  nutrient_ranges: Array<{
    nutrient: string;
    min_value: number;
    max_value: number;
  }>;
  maximize_nutrients: string[];
  target_kcal: number;
};
export const vetService = {
  async getBreedDiseases(breed: string): Promise<string[]> {
    try {
      const breedLower = breed.toLowerCase().trim();
      const data = await apiClient.get<BreedInfo>(`/recommender/breeds/${breedLower}`);
      return data.breed_info.diseases;
    } catch (error) {
      console.error('Failed to fetch breed diseases:', error);
      throw new Error('Не удалось загрузить список заболеваний для породы');
    }
  },

  async optimizeRecipe(request: RecipeOptimizationRequest): Promise<OptimizationResult> {
    try {
      const data = await apiClient.post<OptimizationResult>('/recommender/optimize/recipe', request);

      if (!data.success) {
        throw new Error('Оптимизация не удалась');
      }

      return data;
    } catch (error) {
      console.error('Failed to optimize recipe:', error);
      throw new Error('Не удалось рассчитать оптимальный состав. Попробуйте изменить параметры.');
    }
  }
};