// Session storage only - All application data is persisted exclusively in Supabase
const SESSION_STORAGE_KEY = 'fatfx_session_user_id';

export const StorageService = {
  getCurrentUserId: (): string | null => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  setCurrentUserId: (id: string | null): void => {
    try {
      if (id) {
        localStorage.setItem(SESSION_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  },
};
