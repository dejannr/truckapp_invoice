const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export async function api(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!res.ok) throw await res.json().catch(() => ({ message: 'Request failed' }));
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res;
}
