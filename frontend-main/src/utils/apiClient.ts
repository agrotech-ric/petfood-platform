const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000): Promise<Response> => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Запрос превысил время ожидания (${timeout/1000}s). Backend не отвечает.`);
    }

    throw error;
  }
};

export const apiClient = {
  get: async <T>(endpoint: string, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      },
      timeout
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  post: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      },
      timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  },

  patch: async <T>(endpoint: string, data: any, timeout = 15000): Promise<T> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      },
      timeout
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Update failed");
    }

    return response.json();
  },

  delete: async (endpoint: string, timeout = 15000): Promise<void> => {
    const fullUrl = `${apiBaseUrl}${endpoint}`;

    const response = await fetchWithTimeout(
      fullUrl,
      {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      },
      timeout
    );

    if (!response.ok) {
      throw new Error("Delete failed");
    }
  }
};