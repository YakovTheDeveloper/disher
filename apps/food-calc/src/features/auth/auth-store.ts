import { create } from 'zustand';
import { API_BASE } from '@/shared/lib/api/base';
import { getCurrentUserId } from '@/shared/lib/user';

type AuthState = {
  isLoggedIn: boolean;
  email: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
};

type AuthActions = {
  login: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
};

const AUTH_EMAIL_KEY = 'auth_email';
const AUTH_TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  isLoggedIn: !!localStorage.getItem(AUTH_TOKEN_KEY),
  email: localStorage.getItem(AUTH_EMAIL_KEY),
  userId: null,
  isLoading: false,
  error: null,

  login: async (email: string, name?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...(name ? { name } : {}) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка входа');
      }

      const { token, userId } = await res.json();
      localStorage.setItem(AUTH_EMAIL_KEY, email);
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      set({ isLoggedIn: true, email, userId, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Ошибка' });
    }
  },

  logout: async () => {
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    set({ isLoggedIn: false, email: null, userId: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const email = localStorage.getItem(AUTH_EMAIL_KEY);
    if (token) {
      set({ isLoggedIn: true, email, userId: getCurrentUserId() });
    }
  },
}));
