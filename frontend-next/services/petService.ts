import { apiClient } from '../src/utils/apiClient'

const MAX_PUBLIC_PHOTO_UPLOAD_BYTES = 900 * 1024

const canvasToBlob = (canvas: HTMLCanvasElement, contentType: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to upload photo')),
      contentType,
      quality,
    )
  })

const preparePhotoForUpload = async (file: File, contentType: string): Promise<Blob> => {
  if (file.size <= MAX_PUBLIC_PHOTO_UPLOAD_BYTES) return file

  const image = await createImageBitmap(file)
  try {
    const longestSide = Math.max(image.width, image.height)
    let scale = Math.min(1, 2048 / longestSide)
    let quality = 0.88

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))

      const context = canvas.getContext('2d')
      if (!context) throw new Error('Failed to upload photo')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      const blob = await canvasToBlob(canvas, contentType, quality)
      if (blob.size <= MAX_PUBLIC_PHOTO_UPLOAD_BYTES) return blob

      scale *= 0.78
      quality = Math.max(0.55, quality - 0.06)
    }
  } finally {
    image.close()
  }

  throw new Error('Failed to upload photo')
}

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
    const uploadBody = await preparePhotoForUpload(file, contentType)
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': contentType },
      body: uploadBody,
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
