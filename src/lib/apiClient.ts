export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('token='));

  return match ? match.slice('token='.length) : null;
}

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(endpoint, { ...options, headers });
  } catch {
    throw new Error(`Network error while calling ${endpoint}`);
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    const message = (data as { error?: string }).error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}
