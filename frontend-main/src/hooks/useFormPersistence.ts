import { useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting form data to localStorage
 * @param key - Unique key for localStorage
 * @param data - Form data to persist
 * @param enabled - Whether persistence is enabled (useful for edit mode)
 */
export const useFormPersistence = <T extends Record<string, any>>(
  key: string,
  data: T,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const timeoutId = setTimeout(() => {
      try {
        const serializable = Object.entries(data).reduce((acc, [k, v]) => {
          if (v instanceof File) {
            acc[k] = null;
          } else if (v !== undefined) {
            acc[k] = v;
          }
          return acc;
        }, {} as Record<string, any>);

        localStorage.setItem(key, JSON.stringify(serializable));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [key, data, enabled]);

  const loadPersistedData = useCallback((): Partial<T> | null => {
    if (!enabled) return null;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  }, [key, enabled]);

  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [key]);

  return {
    loadPersistedData,
    clearPersistedData,
  };
};