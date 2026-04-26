import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens, AuthStatus } from '@/types/auth';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  status: AuthStatus;
  /** Email/password sign-in. */
  login: (email: string, password: string) => Promise<void>;
  /** Email/password registration. */
  register: (email: string, password: string, name?: string) => Promise<void>;
  /** Google OAuth sign-in (implicit flow access_token). */
  loginWithGoogle: (accessToken: string) => Promise<void>;
  /** Sign out — clears local state regardless of server response. */
  logout: () => Promise<void>;
  /**
   * Verify the persisted access token is still valid via GET /auth/me.
   * Call once on app mount; sets status to 'authenticated' or 'unauthenticated'.
   */
  hydrate: () => Promise<void>;
  /** Used by api.ts token refresh to sync refreshed tokens into the store. */
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      status: 'idle',

      login: async (email, password) => {
        set({ status: 'loading' });
        try {
          const { user, tokens } = await authApi.login(email, password);
          set({ user, tokens, status: 'authenticated' });
        } catch (err) {
          set({ status: 'unauthenticated' });
          throw err;
        }
      },

      register: async (email, password, name) => {
        set({ status: 'loading' });
        try {
          const { user, tokens } = await authApi.register(email, password, name);
          set({ user, tokens, status: 'authenticated' });
        } catch (err) {
          set({ status: 'unauthenticated' });
          throw err;
        }
      },

      loginWithGoogle: async (accessToken) => {
        set({ status: 'loading' });
        try {
          const { user, tokens } = await authApi.loginWithGoogle(accessToken);
          set({ user, tokens, status: 'authenticated' });
        } catch (err) {
          set({ status: 'unauthenticated' });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // best-effort — clear local state regardless
        }
        set({ user: null, tokens: null, status: 'unauthenticated' });
      },

      hydrate: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          set({ status: 'unauthenticated' });
          return;
        }
        set({ status: 'loading' });
        try {
          const { user } = await authApi.me();
          set({ user, status: 'authenticated' });
        } catch {
          // Token invalid or expired; api.ts may have already tried refresh
          set({ user: null, tokens: null, status: 'unauthenticated' });
        }
      },

      setTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'formiq-auth-v1',
      // Only persist user + tokens — not transient status
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
    },
  ),
);

/**
 * Re-exported as `useAuth` so COWORK-41.A components can import from
 * '@/stores/auth' without an extra indirection layer.
 */
export const useAuth = useAuthStore;

// Sync refreshed tokens from api.ts back into in-memory store state
if (typeof window !== 'undefined') {
  window.addEventListener('formiq:tokens-refreshed', () => {
    try {
      const raw = localStorage.getItem('formiq-auth-v1');
      if (!raw) {
        useAuthStore.setState({ user: null, tokens: null, status: 'unauthenticated' });
        return;
      }
      const parsed = JSON.parse(raw) as { state?: { tokens?: AuthTokens } };
      const tokens = parsed?.state?.tokens;
      if (tokens) useAuthStore.setState({ tokens });
    } catch {
      /* ignore */
    }
  });
}
