/**
 * Client helper for the iSusuPro NestJS API (mini-services/isusu-api).
 * All calls are proxied through the Next.js route /api/nest/* which
 * forwards to the NestJS service on localhost:4000 server-side.
 * This works from every origin (localhost, Caddy gateway, production).
 */

export const NESTJS_PORT = 4000;

export function apiUrl(path: string): string {
  return path.replace(/^\/api\/v1/, '/api/nest');
}

/** Quick check whether the NestJS backend is reachable. */
export async function isBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/v1/health'), { signal: AbortSignal.timeout(1200), cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ask the Next.js server to (re)start the NestJS API and wait until healthy.
 * Used for self-healing in the sandbox where the API is supervised by the dev server.
 */
export async function ensureBackendStarted(): Promise<boolean> {
  try {
    const res = await fetch('/api/backend', { cache: 'no-store' });
    const data = await res.json();
    return !!data.running;
  } catch {
    return false;
  }
}

interface ApiError extends Error {
  status?: number;
}

/** Typed error so callers can distinguish 401 (bad credentials) from network failure. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, signal: AbortSignal.timeout(8000), cache: 'no-store' });
  } catch {
    const err: ApiError = new Error('NETWORK');
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = new Error(typeof data.message === 'string' ? data.message : `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data as T;
}
