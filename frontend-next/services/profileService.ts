import { apiClient } from '../src/utils/apiClient'
import { petService } from './petService'

export type ProfileData = {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string
  country?: string
  city?: string
  avatarUrl?: string | null
  language?: string | null
  role?: string
  createdAt?: string
}

export type ActivityItem = {
  id: string
  createdAt: string
  eventType: string
  description: string
}

type ActivityPage = {
  items: ActivityItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const profileService = {
  getProfile: () => apiClient.get<ProfileData>('/api/v1/account/profile/me'),

  getActivity: (page = 0, size = 10) =>
    apiClient.get<ActivityPage>(
      `/api/v1/account/profile/me/activity?page=${page}&size=${size}`,
    ),

  updateProfile: (data: Record<string, unknown>) =>
    apiClient.patch<ProfileData>('/api/v1/account', data),

  getAvatarDownloadUrl: async (objectKey: string): Promise<string> => {
    try {
      const res = await apiClient.get<{ url: string }>(
        `/api/v1/pets/photos/download-url?objectKey=${encodeURIComponent(objectKey)}`,
      )
      return res.url
    } catch {
      return ''
    }
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const ext = file.type.split('/')[1] || 'jpg'
    const fileName = `avatar-${Date.now()}.${ext}`
    const { url, objectKey } = await petService.getPhotoUploadUrl(fileName, file.type)
    await petService.uploadPhotoToStorage(url, file, file.type)
    return objectKey
  },
}
