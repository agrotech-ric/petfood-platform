const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
  const controller = new AbortController()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error?.name === 'AbortError') {
      throw new Error(`Запрос превысил время ожидания (${timeout / 1000}s). Backend не отвечает.`)
    }

    throw error
  }
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  if (!text.trim()) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

export const apiClient = {
  get: async <T>(endpoint: string, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      },
      timeout,
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return parseJsonBody<T>(response)
  },

  post: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      timeout,
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    return parseJsonBody<T>(response)
  },

  patch: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      timeout,
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Update failed')
    }

    return parseJsonBody<T>(response)
  },

  put: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      timeout,
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Update failed')
    }

    return parseJsonBody<T>(response)
  },

  delete: async (endpoint: string, timeout = 15000): Promise<void> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      },
      timeout,
    )

    if (!response.ok) {
      throw new Error('Delete failed')
    }
  },
}
