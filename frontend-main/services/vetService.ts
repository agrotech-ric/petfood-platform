import { apiClient } from '../src/utils/apiClient';
import { toUserErrorMessage } from '../src/utils/parseApiError';
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
  activity_level: 'passive' |'low' |'moderate' | 'active'| 'extreme'| 'obesity_prone';
  reproductive_status?: 'none' | 'pregnancy' | 'lactation';
  pregnancy_period?: 'none' |'early_4_weeks' | 'last_5_weeks';
  lactation_week?: 'none' |'week_1' | 'week_2'| 'week_3'| 'week_4';
  num_puppies?: number|0;
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

const getEnglishBreedName = (breedName: string): string => breedName.toLowerCase().trim();

const encodeBreedNameForUrl = (breedName: string): string =>
  encodeURIComponent(getEnglishBreedName(breedName));

const RECOMMENDER_TIMEOUT_MS = 45000;
const RECOMMENDER_OPTIMIZE_TIMEOUT_MS = 120000;

const raiseUserError = (error: unknown, fallback: string): never => {
  throw new Error(toUserErrorMessage(error, fallback));
};




export const vetService = {
  async fetchAllHealthRecords(): Promise<VetPetRequest[]> {
    return apiClient.get<VetPetRequest[]>('/api/v1/pets/health-records/all');
  },

  async fetchHealthRecordById(recordId: string): Promise<VetPetRequest> {
    return apiClient.get<VetPetRequest>(`/api/v1/pets/health-records/${recordId}`);
  },

  async getBreedInfo(breedName: string): Promise<BreedInfo> {
    try {
      const encodedBreedName = encodeBreedNameForUrl(breedName);
      return await apiClient.get<BreedInfo>(
        `/recommender/breeds/${encodedBreedName}`,
        RECOMMENDER_TIMEOUT_MS
      );
    } catch (error) {
      raiseUserError(error, 'Не удалось загрузить информацию о породе');
    }
  },

  async getBreedDiseases(breedName: string): Promise<string[]> {
    try {
      const breedInfo = await this.getBreedInfo(breedName);
      return breedInfo.breed_info.diseases;
    } catch (error) {
      raiseUserError(error, 'Не удалось загрузить список заболеваний для породы');
    }
  },

  async getDisorderRecommendations(request: {
    breed: string;
    disorder: string;
  }): Promise<DisorderRecommendation> {
    try {
      const normalizedRequest = {
        ...request,
        breed: getEnglishBreedName(request.breed),
      };

      return await apiClient.post<DisorderRecommendation>(
        '/recommender/recommendations/disorder',
        normalizedRequest,
        RECOMMENDER_TIMEOUT_MS
      );
    } catch (error) {
      raiseUserError(error, 'Не удалось получить рекомендации по заболеванию');
    }
  },

  async calculateCalories(request: CaloriesRequest): Promise<CaloriesCalculation> {
    try {
      const isFemale = request.gender.toLowerCase() === 'female';
      
      const normalizedRequest: CaloriesRequest = {
        weight: request.weight,
        age: request.age,
        age_metric: request.age_metric,
        gender: request.gender,
        breed: getEnglishBreedName(request.breed),
        activity_level: request.activity_level,
      };

      // Only include reproductive status for female dogs
      if (isFemale) {
        normalizedRequest.reproductive_status = request.reproductive_status ?? 'none';

        // Only include pregnancy fields if reproductive_status is 'pregnancy'
        if (request.reproductive_status === 'pregnancy') {
          normalizedRequest.pregnancy_period = request.pregnancy_period;
        }

        // Only include lactation fields if reproductive_status is 'lactation'
        if (request.reproductive_status === 'lactation') {
          normalizedRequest.lactation_week = request.lactation_week;
          normalizedRequest.num_puppies = request.num_puppies;
        }
      }

      return await apiClient.post<CaloriesCalculation>(
        '/recommender/calculate/calories',
        normalizedRequest,
        RECOMMENDER_TIMEOUT_MS
      );
    } catch (error) {
      raiseUserError(error, 'Не удалось рассчитать калории');
    }
  },

  async calculateNutrients(request: NutrientsRequest): Promise<NutrientsCalculation> {
    try {
      const { target_kcal, ...rest } = request;
      const isFemale = request.gender.toLowerCase() === 'female';
      
      const normalizedRequest: CaloriesRequest = {
        ...rest,
        breed: getEnglishBreedName(request.breed),
      };

      // Only include reproductive status for female dogs
      if (isFemale) {
        normalizedRequest.reproductive_status = request.reproductive_status ?? 'none';

        // Only include pregnancy fields if reproductive_status is 'pregnancy'
        if (request.reproductive_status === 'pregnancy') {
          normalizedRequest.pregnancy_period = request.pregnancy_period;
        }

        // Only include lactation fields if reproductive_status is 'lactation'
        if (request.reproductive_status === 'lactation') {
          normalizedRequest.lactation_week = request.lactation_week;
          normalizedRequest.num_puppies = request.num_puppies;
        }
      }

      const endpoint = `/recommender/calculate/nutrients?target_kcal=${encodeURIComponent(target_kcal)}`;

      return await apiClient.post<NutrientsCalculation>(endpoint, normalizedRequest, RECOMMENDER_TIMEOUT_MS);
    } catch (error) {
      raiseUserError(error, 'Не удалось рассчитать нутриенты');
    }
  },

  async optimizeRecipe(request: RecipeOptimizationRequest): Promise<OptimizationResult> {
    try {
      const normalizedRequest = {
        ...request,
        breed: getEnglishBreedName(request.breed),
      };

      const data = await apiClient.post<OptimizationResult>(
        '/recommender/optimize/recipe',
        normalizedRequest,
        RECOMMENDER_OPTIMIZE_TIMEOUT_MS
      );

      if (!data.success) {
        throw new Error(
          'Не удалось подобрать состав рациона с текущими ингредиентами и ограничениями. Попробуйте изменить ингредиенты или диапазоны нутриентов.'
        );
      }

      return data;
    } catch (error) {
      raiseUserError(
        error,
        'Не удалось рассчитать оптимальный состав. Попробуйте изменить параметры.'
      );
    }
  },

  async saveRecommendation(
    healthRecordId: string,
    optimizationResult: OptimizationResult
  ): Promise<SavedRecommendation> {
    try {
      return await apiClient.post<SavedRecommendation>(
        `/api/v1/pets/health-records/${healthRecordId}/recommendation`,
        { payload: optimizationResult }
      );
    } catch (error) {
      raiseUserError(error, 'Не удалось сохранить рекомендацию');
    }
  },

  async getRecommendation(healthRecordId: string): Promise<SavedRecommendation> {
    try {
      return await apiClient.get<SavedRecommendation>(
        `/api/v1/pets/health-records/${healthRecordId}/recommendation`
      );
    } catch (error) {
      raiseUserError(error, 'Не удалось загрузить рекомендацию');
    }
  },
};
