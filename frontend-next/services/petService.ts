import { apiClient } from '../src/utils/apiClient'

export type Pet = {
  id: string
  name: string
  breedName?: string
  [key: string]: unknown
}

export type PetProfileData = {
  id: string
  ownerId: string
  speciesId?: number
  speciesName?: string
  breedId?: number
  breedName?: string
  name: string
  gender: 'male' | 'female' | string
  colorId?: number
  colorName?: string
  birthDate?: string
  passportId?: string
  weightKg?: number
  reproductiveStatusId?: number
  reproductiveStatusName?: string
  reproductiveSubStatusId?: number
  reproductiveSubStatusName?: string
  puppiesCount?: number
  createdAt?: string
  updatedAt?: string
  photoObjectKey?: string
  comments?: string
}

export type HealthRecord = {
  id: string
  petId: string
  ownerId: string
  activityTypeId?: number
  activityTypeName?: string
  symptoms?: string[]
  conditionName?: string
  conditionStatus?: 'current' | 'history' | string
  createdAt: string
  recordDate?: string
  petName?: string
  speciesId?: number
  speciesName?: string
  breedId?: number
  breedName?: string
  gender?: string
  colorId?: number
  colorName?: string
  birthDate?: string
  passportId?: string
  weightKg?: number
  activityHours?: number
  photoObjectKey?: string
  comments?: string
  ownerName?: string
}

export type PetFood = {
  id: string
  petId: string
  name: string
  type: string
  format: string
  calories: number
  updatedAt: string
}

export type PetContraindications = {
  petId: string
  ingredients: string[]
  description: string
}

export const petService = {
  getPet: (id: string) =>
    apiClient.get<PetProfileData>(`/api/v1/pets/${id}`),

  createPet: (data: Record<string, unknown>) =>
    apiClient.post<Pet>('/api/v1/pets', data),

  updatePet: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<PetProfileData>(`/api/v1/pets/${id}`, data),

  deletePet: (id: string) =>
    apiClient.delete(`/api/v1/pets/${id}`),

  getPhotoUploadUrl: (fileName: string, contentType: string) =>
    apiClient.post<{ url: string; objectKey: string }>('/api/v1/pets/photos/upload-url', {
      fileName,
      contentType,
    }),

  getPhotoDownloadUrl: (objectKey: string) =>
    apiClient.get<{ url: string; objectKey: string }>(
      `/api/v1/pets/photos/download-url?objectKey=${encodeURIComponent(objectKey)}`,
    ),

  uploadPhotoToStorage: async (url: string, file: File, contentType: string) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    })
    if (!res.ok) throw new Error('Failed to upload photo')
  },

  createHealthRecord: (petId: string, data: Record<string, unknown>) =>
    apiClient.post<HealthRecord>(`/api/v1/pets/${petId}/health-records`, data),

  getHealthRecords: (petId: string) =>
    apiClient.get<HealthRecord[]>(`/api/v1/pets/${petId}/health-records`),

  getPetFoods: (petId: string) =>
    apiClient.get<PetFood[]>(`/api/v1/pets/${petId}/foods`),

  getContraindications: (petId: string) =>
    apiClient.get<PetContraindications>(`/api/v1/pets/${petId}/contraindications`),

  updateContraindications: (petId: string, data: { ingredients: string[]; description: string }) =>
    apiClient.put<PetContraindications>(`/api/v1/pets/${petId}/contraindications`, data),

  updateHealthRecord: (petId: string, healthRecordId: string, data: Record<string, unknown>) =>
    apiClient.patch<HealthRecord>(`/api/v1/pets/${petId}/health-records/${healthRecordId}`, data),

  deleteHealthRecord: (petId: string, healthRecordId: string) =>
    apiClient.delete(`/api/v1/pets/${petId}/health-records/${healthRecordId}`),

  getFavoriteStatus: (petId: string) =>
    apiClient.get<{ favorite: boolean }>(`/api/v1/pets/${petId}/favorite`),

  addFavorite: (petId: string) =>
    apiClient.post<void>(`/api/v1/pets/${petId}/favorite`, {}),

  removeFavorite: (petId: string) =>
    apiClient.delete(`/api/v1/pets/${petId}/favorite`),
}
