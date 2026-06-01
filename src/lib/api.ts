const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export async function api(path: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers: { ...(options.headers || {}) } });
  } catch {
    throw new Error('Network error. API is unreachable.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    const asError = (payload: any, fallback: string) => {
      const error = new Error(payload?.message || fallback) as Error & { statusCode?: number; missingFields?: string[]; payload?: any };
      error.statusCode = payload?.statusCode;
      error.missingFields = payload?.missingFields;
      error.payload = payload;
      return error;
    };
    if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/refresh')) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        const retryRes = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers: { ...(options.headers || {}) } });
        if (retryRes.ok) {
          const retryCt = retryRes.headers.get('content-type') || '';
          return retryCt.includes('application/json') ? retryRes.json() : retryRes;
        }
      }
      throw asError({ ...err, message: 'Session expired. Please log in again.', statusCode: 401 }, 'Unauthorized');
    }
    throw asError(err, 'Request failed');
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res;
}
