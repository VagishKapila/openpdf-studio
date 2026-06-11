/**
 * FormIQ API client.
 * Handles Bearer auth headers, 401 → refresh → retry, and typed wrappers
 * for all backend auth endpoints.
 *
 * Token strategy: reads/writes from the same localStorage key used by the
 * Zustand persist middleware ('formiq-auth-v1'). This avoids circular imports
 * between api.ts and stores/auth.ts.
 */
import type { AuthResponse, User } from '@/types/auth';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const STORAGE_KEY = 'formiq-auth-v1';

// ── ApiError ──────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────

function readTokens(): { accessToken: string; refreshToken: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { tokens?: { accessToken: string; refreshToken: string } } };
    return parsed?.state?.tokens ?? null;
  } catch {
    return null;
  }
}

/**
 * Write refreshed tokens back to localStorage so subsequent api calls pick
 * them up without needing the Zustand store to re-hydrate first.
 * Also fires 'formiq:tokens-refreshed' so the store can sync in-memory state.
 */
function persistTokens(tokens: { accessToken: string; refreshToken: string }): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = raw ? (JSON.parse(raw) as { state: Record<string, unknown> }) : { state: {} };
    state.state.tokens = tokens;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('formiq:tokens-refreshed'));
  } catch {
    /* storage may be unavailable in some contexts */
  }
}

function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('formiq:tokens-refreshed'));
}

// ── Refresh (deduplicated) ────────────────────────────────────────────────────

let _refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const current = readTokens();
    if (!current?.refreshToken) {
      clearStoredAuth();
      throw new ApiError(401, 'Session expired — please sign in again');
    }
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    if (!res.ok) {
      clearStoredAuth();
      throw new ApiError(401, 'Session expired — please sign in again');
    }
    const data = (await res.json()) as AuthResponse;
    persistTokens(data.tokens);
    return data.tokens.accessToken;
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

// ── Core fetch ────────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  /** Set false to skip the Authorization header (login/register/google). */
  auth?: boolean;
  _retried?: boolean;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, _retried = false, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const tokens = readTokens();
    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  // 401 → try a token refresh once, then retry the original request
  if (res.status === 401 && auth && !_retried) {
    const newToken = await doRefresh(); // throws ApiError(401) if refresh fails
    headers['Authorization'] = `Bearer ${newToken}`;
    const retried = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    if (!retried.ok) {
      const body = (await retried.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(retried.status, body.error ?? retried.statusText);
    }
    if (retried.status === 204) return undefined as unknown as T;
    return retried.json() as Promise<T>;
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Typed auth wrappers ───────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    }),

  register: (email: string, password: string, name?: string) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      auth: false,
    }),

  loginWithGoogle: (accessToken: string) =>
    apiFetch<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
      auth: false,
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<{ user: User }>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiFetch<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      auth: false,
    }),
} as const;
