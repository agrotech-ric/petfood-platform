const configuredApiBase = import.meta.env.VITE_API_BASE_URL
export const apiBaseUrl = configuredApiBase?.trim()
  ? configuredApiBase.trim().replace(/\/$/, '')
  : (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, ''))

export const AUTH_UNAUTHORIZED_EVENT = 'petfood:auth-unauthorized'

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

    if (response.status === 401) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }

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

async function requireOk(response: Response): Promise<Response> {
  if (response.ok) return response
  const errorText = await response.text()
  const error = new Error(`API Error: ${response.status} - ${errorText}`) as Error & { status?: number }
  error.status = response.status
  throw error
}

export type DownloadedFile = {
  blob: Blob
  filename?: string
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

  getWithHeaders: async <T>(
    endpoint: string,
    headers: Record<string, string>,
    timeout = 15000,
  ): Promise<T> => {
    const response = await fetchWithTimeout(
      `${apiBaseUrl}${endpoint}`,
      { method: 'GET', credentials: 'include', headers: { Accept: 'application/json', ...headers } },
      timeout,
    )
    await requireOk(response)
    return parseJsonBody<T>(response)
  },

  download: async (
    endpoint: string,
    headers: Record<string, string> = {},
    timeout = 30000,
  ): Promise<DownloadedFile> => {
    const response = await fetchWithTimeout(
      `${apiBaseUrl}${endpoint}`,
      { method: 'GET', credentials: 'include', headers: { Accept: 'application/pdf,image/*', ...headers } },
      timeout,
    )
    await requireOk(response)
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
    const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1]
    let filename: string | undefined
    try {
      filename = encoded ? decodeURIComponent(encoded) : plain
    } catch {
      filename = plain
    }
    return { blob: await response.blob(), filename }
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
      const errorMessage = errorData.message
        || errorData.error
        || (typeof errorData.detail === 'string' ? errorData.detail : null)
        || `Request failed with status ${response.status}`
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
