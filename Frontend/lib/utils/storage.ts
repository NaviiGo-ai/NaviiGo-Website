/**
 * Safe Browser Storage Utility
 * Handles QuotaExceededError, private browsing restrictions, and null references.
 */

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[storage] Error reading localStorage key "${key}":`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[storage] Error setting localStorage key "${key}":`, e);
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[storage] Error removing localStorage key "${key}":`, e);
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn(`[storage] Error reading sessionStorage key "${key}":`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[storage] Error setting sessionStorage key "${key}":`, e);
      safeSessionStorage.evictOldItineraries();
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[storage] Error removing sessionStorage key "${key}":`, e);
    }
  },

  evictOldItineraries: (): void => {
    try {
      if (typeof window === 'undefined') return;
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('navii_itin_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
      console.warn('[storage] Error evicting old itineraries from sessionStorage:', e);
    }
  },
};
