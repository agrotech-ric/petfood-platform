import { apiClient } from '../src/utils/apiClient'

export type Pet = {
  id: string
  name: string
  breedName?: string
  [key: string]: unknown
}

export const petService = {
  createPet: (data: Record<string, unknown>) =>
    apiClient.post<Pet>('/api/v1/pets', data),

  getPhotoUploadUrl: (fileName: string, contentType: string) =>
    apiClient.post<{ url: string; objectKey: string }>('/api/v1/pets/photos/upload-url', {
      fileName,
      contentType,
    }),

  uploadPhotoToStorage: async (url: string, file: File, contentType: string) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    })
    if (!res.ok) throw new Error('Failed to upload photo')
  },

  createHealthRecord: (petId: string, data: Record<string, unknown>) =>
    apiClient.post(`/api/v1/pets/${petId}/health-records`, data),
}
