import { apiClient } from '../src/utils/apiClient'

export type RefItem = {
  id: number
  name?: string
  nameRu?: string
  nameEn?: string
  code?: string
}

export type Species = RefItem & { code?: string }
export type Breed = RefItem & { speciesId?: number }
export type Color = RefItem
export type ActivityType = RefItem & { description?: string }
export type ReproductiveStatus = RefItem & {
  gender?: string
  requiresSubstatus?: boolean
}
export type Symptom = RefItem
export type HealthCondition = RefItem & { code: string; nameRu: string }

export const referenceService = {
  fetchSpecies: () => apiClient.get<Species[]>('/api/v1/pets/ref/species'),
  fetchColors: () => apiClient.get<Color[]>('/api/v1/pets/ref/colors'),
  fetchSymptoms: () => apiClient.get<Symptom[]>('/api/v1/pets/ref/symptoms'),
  fetchActivityTypes: () => apiClient.get<ActivityType[]>('/api/v1/pets/ref/activity-types'),
  fetchReproductiveStatuses: (gender: string) =>
    apiClient.get<ReproductiveStatus[]>(
      `/api/v1/pets/ref/reproductive-statuses?gender=${gender}`
    ),
  fetchBreedsBySpeciesId: (speciesId: number) =>
    apiClient.get<Breed[]>(`/api/v1/pets/ref/breeds?speciesId=${speciesId}`),
  fetchHealthConditions: () =>
    apiClient.get<HealthCondition[]>('/api/v1/pets/ref/health-conditions'),
}
