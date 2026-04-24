import { apiClient } from '../src/utils/apiClient';
import type {
  Species,
  Breed,
  Color,
  Symptom,
  ActivityType,
  ReproductiveStatus,
  ReproductiveSubStatus
} from '../context/PetContext/types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const referenceService = {
  async fetchSpecies(): Promise<Species[]> {
    return apiClient.get<Species[]>('/api/v1/pets/ref/species');
  },

  async fetchColors(): Promise<Color[]> {
    return apiClient.get<Color[]>('/api/v1/pets/ref/colors');
  },

  async fetchSymptoms(): Promise<Symptom[]> {
    return apiClient.get<Symptom[]>('/api/v1/pets/ref/symptoms');
  },

  async fetchActivityTypes(): Promise<ActivityType[]> {
    return apiClient.get<ActivityType[]>('/api/v1/pets/ref/activity-types');
  },

  async fetchReproductiveStatuses(gender: string): Promise<ReproductiveStatus[]> {
    return apiClient.get<ReproductiveStatus[]>(
      `/api/v1/pets/ref/reproductive-statuses?gender=${gender}`
    );
  },

  async fetchReproductiveSubStatuses(statusId: number): Promise<ReproductiveSubStatus[]> {
    return apiClient.get<ReproductiveSubStatus[]>(
      `/api/v1/pets/ref/reproductive-sub-statuses?statusId=${statusId}`
    );
  },

  async fetchBreedsBySpeciesId(speciesId: number): Promise<Breed[]> {
    try {
      const data = await apiClient.get<Breed[]>(
        `/api/v1/pets/ref/breeds?speciesId=${speciesId}`
      );

      if (Array.isArray(data) && data.length > 0 && data[0].id !== undefined) {
        return data;
      }
    } catch (error) {
      console.warn('Primary breeds API failed, trying fallback...', error);

      try {
        const response = await fetch(`${apiBaseUrl}/breeds`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
          const data = await response.json();

          if (data.breeds && Array.isArray(data.breeds)) {
            return data.breeds.map((name: string, index: number) => ({
              id: index + 1,
              speciesId: speciesId,
              name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
            }));
          }
        }
      } catch (fallbackError) {
        console.error('Fallback breeds fetch failed:', fallbackError);
      }
    }

    return [];
  },

  async fetchAllBreeds(): Promise<string[]> {
    try {
      const response = await fetch(`${apiBaseUrl}/breeds`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();

        if (data.breeds && Array.isArray(data.breeds)) {
          return data.breeds;
        }
      }

      throw new Error('Failed to fetch breeds');
    } catch (error) {
      console.error('Failed to fetch all breeds:', error);
      return [];
    }
  }
};