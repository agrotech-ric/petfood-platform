import { apiClient } from '../src/utils/apiClient';
import { OptimizationResult } from '../context/RequestContext';

export type VetPetRequest = {
  id: string;
  petId: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  petPhoto?: string;
  petBirthDate?: string;
  petGender?: string;
  petColor?: string;
  petPassportId?: string;
  ownerId: string;
  ownerName: string;
  activityTypeName: string;
  symptoms: string[];
  comments: string;
  weightKg: number;
  createdAt: string;
  hasRecommendation: boolean;
  recommendation?: any;
};

export type BreedInfo = {
  breed_info: {
    breed: string;
    min_weight: number;
    max_weight: number;
    avg_weight: number;
    diseases: string[];
  };
};

export type DisorderRecommendation = {
  disorder: string;
  disorder_type: string;
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
    calcium: number;
    phospohorus: number;
    potassium: number;
    sodium: number;
    magnesium: number;
    'vitamin e': number;
    'vitamin c': number;
    'omega-3-fatty acids': number;
    'omega-6-fatty acids': number;
    moisture?: number;
  };
};

export type CaloriesCalculation = {
  daily_kcal: number;
  formula: string;
  reference_page: string;
  size_category: string;
  age_category: string;
};

export type NutrientsCalculation = {
  norms: {
    [nutrient: string]: number;
  };
};

export type RecipeOptimizationRequest = {
  weight: number;
  age: number;
  breed: string;
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

export type CaloriesRequest = {
  weight: number;
  age: number;
  age_metric: 'years' | 'months';
  gender: string;
  breed: string;
  activity_level: 'passive' | 'moderate' | 'active';
  reproductive_status?: 'none' | 'pregnant' | 'lactating';
};

export type NutrientsRequest = CaloriesRequest & {
  target_kcal: number;
};

export type SavedRecommendation = {
  id: string;
  healthRecordId: string;
  vetId: string;
  createdAt: string;
  payload: OptimizationResult;
};

const getEnglishBreedName = (breedName: string): string => {
  return breedName.toLowerCase().trim();
};

const encodeBreedNameForUrl = (breedName: string): string => {
  const normalized = getEnglishBreedName(breedName);
  return encodeURIComponent(normalized);
};

export const vetService = {
  async fetchAllHealthRecords(): Promise<VetPetRequest[]> {
    const data = await apiClient.get<VetPetRequest[]>('/api/v1/pets/health-records/all');
    return data;
  },

  async fetchHealthRecordById(recordId: string): Promise<VetPetRequest> {
    const data = await apiClient.get<VetPetRequest>(`/api/v1/pets/health-records/${recordId}`);
    return data;
  },

  async getBreedInfo(breedName: string): Promise<BreedInfo> {
    try {
      const encodedBreedName = encodeBreedNameForUrl(breedName);
      const data = await apiClient.get<BreedInfo>(`/recommender/breeds/${encodedBreedName}`);
      return data;
    } catch (error) {
      throw new Error('Не удалось загрузить информацию о породе');
    }
  },

  async getBreedDiseases(breedName: string): Promise<string[]> {
    try {
      const breedInfo = await this.getBreedInfo(breedName);
      return breedInfo.breed_info.diseases;
    } catch (error) {
      throw new Error('Не удалось загрузить список заболеваний для породы');
    }
  },

  async getDisorderRecommendations(request: {
    breed: string;
    disorder: string;
  }): Promise<DisorderRecommendation> {
    try {
      const normalizedRequest = {
        ...request,
        breed: getEnglishBreedName(request.breed)
      };

      const data = await apiClient.post<DisorderRecommendation>(
        '/recommender/recommendations/disorder',
        normalizedRequest
      );
      return data;
    } catch (error) {
      throw new Error('Не удалось получить рекомендации по заболеванию');
    }
  },

 async calculateCalories(request: CaloriesRequest): Promise<CaloriesCalculation> {
  try {
    const normalizedRequest: any = {
      weight: request.weight,
      age: request.age,
      age_metric: request.age_metric,
      gender: request.gender,
      breed: getEnglishBreedName(request.breed),
      activity_level: request.activity_level
    };

    if (request.gender.toLowerCase() === 'female') {
      normalizedRequest.reproductive_status = 'none';
    }

    console.log('Sending request:', normalizedRequest);

    const data = await apiClient.post<CaloriesCalculation>(
      '/recommender/calculate/calories',
      normalizedRequest
    );
    return data;
  } catch (error) {
    console.error('Backend error:', error);
    throw new Error('Не удалось рассчитать калории');
  }
},

  async calculateNutrients(request: NutrientsRequest): Promise<NutrientsCalculation> {
    try {
      const normalizedRequest = {
        ...request,
        breed: getEnglishBreedName(request.breed)
      };

      const data = await apiClient.post<NutrientsCalculation>(
        '/recommender/calculate/nutrients',
        normalizedRequest
      );
      return data;
    } catch (error) {
      throw new Error('Не удалось рассчитать нутриенты');
    }
  },

  async optimizeRecipe(request: RecipeOptimizationRequest): Promise<OptimizationResult> {
    try {
      const normalizedRequest = {
        ...request,
        breed: getEnglishBreedName(request.breed)
      };

      const data = await apiClient.post<OptimizationResult>(
        '/recommender/optimize/recipe',
        normalizedRequest
      );

      if (!data.success) {
        throw new Error('Оптимизация не удалась');
      }

      return data;
    } catch (error) {
      throw new Error('Не удалось рассчитать оптимальный состав. Попробуйте изменить параметры.');
    }
  },

  async saveRecommendation(
    healthRecordId: string,
    optimizationResult: OptimizationResult
  ): Promise<SavedRecommendation> {
    try {
      const payload = {
        payload: optimizationResult
      };

      const data = await apiClient.post<SavedRecommendation>(
        `/api/v1/pets/health-records/${healthRecordId}/recommendation`,
        payload
      );

      return data;
    } catch (error) {
      throw new Error('Не удалось сохранить рекомендацию');
    }
  },

  async getRecommendation(healthRecordId: string): Promise<SavedRecommendation> {
    try {
      const data = await apiClient.get<SavedRecommendation>(
        `/api/v1/pets/health-records/${healthRecordId}/recommendation`
      );
      return data;
    } catch (error) {
      throw new Error('Не удалось загрузить рекомендацию');
    }
  }
};