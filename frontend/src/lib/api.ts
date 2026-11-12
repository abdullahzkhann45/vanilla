// Thin API client. In production the browser calls /api/* which rewrites to NestJS.
// Server components can hit API_URL directly, bypassing the rewrite.
const BROWSER_BASE = '/api';

function serverBase(): string {
  const v = process.env.API_URL;
  if (!v) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_URL is required in production');
    }
    return 'http://localhost:4000';
  }
  return v.replace(/\/$/, '');
}

export function apiBase() {
  return typeof window === 'undefined' ? serverBase() : BROWSER_BASE;
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
