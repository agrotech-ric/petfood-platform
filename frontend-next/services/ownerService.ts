import { apiClient } from '../src/utils/apiClient'
import type { PetProfileData } from './petService'

export type PetOwner = {
  id: string
  fullName: string
  country?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  telegram?: string
  avatarObjectKey?: string
  placeholder: boolean
  petCount: number
  activeRecordCount: number
  createdAt?: string
  updatedAt?: string
}

export type PetOwnerInput = Omit<PetOwner, 'id' | 'placeholder' | 'petCount' | 'activeRecordCount' | 'createdAt' | 'updatedAt'>

export type PetOwnerRecord = {
  id: string
  ownerId: string
  ownerName: string
  topic: string
  recordDate: string
  recordTime: string
  message: string
  useEmail: boolean
  useSms: boolean
  useTelegram: boolean
  email?: string
  phone?: string
  telegram?: string
  status: 'active' | 'archived'
  archivedAt?: string
}

export type PetOwnerRecordInput = Pick<PetOwnerRecord, 'topic' | 'recordDate' | 'recordTime' | 'message' | 'useEmail' | 'useSms' | 'useTelegram'>

export const ownerService = {
  search: (query = '') => apiClient.get<PetOwner[]>(`/api/v1/pet-owners?q=${encodeURIComponent(query)}`),
  get: (id: string) => apiClient.get<PetOwner>(`/api/v1/pet-owners/${id}`),
  create: (data: PetOwnerInput) => apiClient.post<PetOwner>('/api/v1/pet-owners', data),
  update: (id: string, data: PetOwnerInput) => apiClient.patch<PetOwner>(`/api/v1/pet-owners/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/v1/pet-owners/${id}`),
  pets: (id: string) => apiClient.get<PetProfileData[]>(`/api/v1/pet-owners/${id}/pets`),
  unassignedPets: () => apiClient.get<PetProfileData[]>('/api/v1/pet-owners/unassigned-pets'),
  attachPet: (ownerId: string, petId: string) => apiClient.post<PetProfileData>(`/api/v1/pet-owners/${ownerId}/pets/${petId}`, {}),
  detachPet: (ownerId: string, petId: string) => apiClient.delete(`/api/v1/pet-owners/${ownerId}/pets/${petId}`),
  records: (ownerId: string, status: 'active' | 'archived') => apiClient.get<PetOwnerRecord[]>(`/api/v1/pet-owners/${ownerId}/records?status=${status}`),
  record: (ownerId: string, recordId: string) => apiClient.get<PetOwnerRecord>(`/api/v1/pet-owners/${ownerId}/records/${recordId}`),
  createRecord: (ownerId: string, data: PetOwnerRecordInput) => apiClient.post<PetOwnerRecord>(`/api/v1/pet-owners/${ownerId}/records`, data),
  updateRecord: (ownerId: string, recordId: string, data: PetOwnerRecordInput) => apiClient.patch<PetOwnerRecord>(`/api/v1/pet-owners/${ownerId}/records/${recordId}`, data),
  archiveRecord: (ownerId: string, recordId: string) => apiClient.post<PetOwnerRecord>(`/api/v1/pet-owners/${ownerId}/records/${recordId}/archive`, {}),
  restoreRecord: (ownerId: string, recordId: string) => apiClient.post<PetOwnerRecord>(`/api/v1/pet-owners/${ownerId}/records/${recordId}/restore`, {}),
  deleteRecord: (ownerId: string, recordId: string) => apiClient.delete(`/api/v1/pet-owners/${ownerId}/records/${recordId}`),
  clearArchive: (ownerId: string) => apiClient.delete(`/api/v1/pet-owners/${ownerId}/records/archive`),
  avatarUploadUrl: (ownerId: string, file: File) => apiClient.post<{ url: string; objectKey: string }>(`/api/v1/pet-owners/${ownerId}/avatar/upload-url`, { fileName: file.name, contentType: file.type }),
  avatarDownloadUrl: (ownerId: string) => apiClient.get<{ url: string; objectKey: string }>(`/api/v1/pet-owners/${ownerId}/avatar/download-url`),
  uploadAvatar: async (url: string, file: File) => {
    const response = await fetch(url, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': file.type }, body: file })
    if (!response.ok) throw new Error('Avatar upload failed')
  },
}
