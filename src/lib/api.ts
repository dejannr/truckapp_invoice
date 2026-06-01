import { clearCookie, getCookie } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export async function api(path: string, options: RequestInit = {}) {
  const token = getCookie('auth_token');
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    if (res.status === 401 && typeof window !== 'undefined') {
      clearCookie('auth_token');
      clearCookie('company_name');
      throw { ...err, message: 'Session expired. Please log in again.', statusCode: 401 };
    }
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res;
}
