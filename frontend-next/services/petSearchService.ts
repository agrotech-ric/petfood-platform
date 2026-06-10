import { apiClient } from '../src/utils/apiClient'
import type { PetDashboardFilters } from '../src/types/petDashboardFilters'

export type PetListItem = {
  id: string
  name: string
  breedName: string
  birthDate: string
  photoObjectKey?: string
  photo?: string
  favorite?: boolean
  hasRecommendation?: boolean
}

type SearchPage = {
  content: PetListItem[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function appendList(params: URLSearchParams, key: string, values: (string | number)[]) {
  for (const v of values) {
    params.append(key, String(v))
  }
}

export function buildPetSearchQuery(
  q: string,
  filters: PetDashboardFilters,
  page = 0,
  size = 50
): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  const trimmed = q.trim()
  if (trimmed) params.set('q', trimmed)

  appendList(params, 'genders', filters.genders)
  appendList(params, 'ageGroups', filters.ageGroups)
  if (filters.minWeight != null) params.set('minWeight', String(filters.minWeight))
  if (filters.maxWeight != null) params.set('maxWeight', String(filters.maxWeight))
  appendList(params, 'breedIds', filters.breedIds)
  appendList(params, 'sizeCategories', filters.sizeCategories)
  appendList(params, 'reproductiveStatusIds', filters.reproductiveStatusIds)
  appendList(params, 'activityTypeIds', filters.activityTypeIds)
  appendList(params, 'symptomIds', filters.symptomIds)
  appendList(params, 'healthConditionCodes', filters.healthConditionCodes)
  if (filters.favorite !== 'all') params.set('favorite', filters.favorite)
  if (filters.recipeStatus !== 'all') params.set('recipeStatus', filters.recipeStatus)

  return params.toString()
}

export const petSearchService = {
  search: (q: string, filters: PetDashboardFilters, page = 0, size = 50) => {
    const query = buildPetSearchQuery(q, filters, page, size)
    return apiClient.get<SearchPage>(`/api/v1/pets/me/search?${query}`)
  },

  addFavorite: (petId: string) =>
    apiClient.post<void>(`/api/v1/pets/${petId}/favorite`, {}),

  removeFavorite: (petId: string) =>
    apiClient.delete(`/api/v1/pets/${petId}/favorite`),
}
