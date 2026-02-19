const DEFAULT_API_BASE = '/api';

export function getApiBase(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  const base = raw?.trim();
  const effective = base && base.length > 0 ? base : DEFAULT_API_BASE;
  return effective.replace(/\/+$/, '');
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base}/${normalizedPath}`;
  return fetch(url, options);
}

export async function pingBackend(): Promise<Response> {
  // Simple health check for troubleshooting
  return apiFetch('health', { method: 'GET' });
}
