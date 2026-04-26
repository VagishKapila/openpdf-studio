/** Authenticated user returned by the backend. */
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  emailVerified: boolean;
  isSuperAdmin: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Backend response shape for all auth endpoints.
 * NOTE: tokens are NESTED under `tokens`, not flat.
 * Shape: { user: {...}, tokens: { accessToken, refreshToken } }
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
