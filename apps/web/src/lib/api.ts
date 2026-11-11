// Thin API client. In production the browser calls /api/* which rewrites to NestJS.
// Server components can hit API_URL directly.
const BROWSER_BASE = '/api';
const SERVER_BASE = process.env.API_URL || 'http://localhost:4000';

export function apiBase() {
  return typeof window === 'undefined' ? SERVER_BASE : BROWSER_BASE;
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = apiBase() + path;
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}
