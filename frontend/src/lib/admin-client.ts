'use client';

const TOKEN_KEY = 'vnl_admin_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) { sessionStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = getToken();
  const r = await fetch('/api' + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(t ? { authorization: `Bearer ${t}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (r.status === 401) { clearToken(); window.location.href = '/admin/login'; throw new Error('401'); }
  if (!r.ok) throw new Error('API ' + r.status);
  return r.json();
}
