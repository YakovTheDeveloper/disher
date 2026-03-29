import { create } from 'zustand';
import { API_BASE, loginWithToken, logout as sessionLogout, getCurrentUserId } from '@/api/triplit/session';

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

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  isLoggedIn: !!localStorage.getItem('triplit_token'),
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
      await loginWithToken(token);
      set({ isLoggedIn: true, email, userId, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e instanceof Error ? e.message : 'Ошибка' });
    }
  },

  logout: async () => {
    localStorage.removeItem(AUTH_EMAIL_KEY);
    await sessionLogout();
    set({ isLoggedIn: false, email: null, userId: null });
  },

  checkAuth: () => {
    const token = localStorage.getItem('triplit_token');
    const email = localStorage.getItem(AUTH_EMAIL_KEY);
    if (token) {
      set({ isLoggedIn: true, email, userId: getCurrentUserId() });
    }
  },
}));
