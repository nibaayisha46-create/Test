/**
 * Thin fetch wrapper around the REST API.
 *
 * In development the Vite dev server proxies `/api` to the Express backend, so
 * the default base URL is relative. Set VITE_API_BASE_URL to point at a
 * different host (for example when the API runs on another domain).
 */
const BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

/** Error thrown for any non-2xx response, carrying the API's field errors. */
export class ApiRequestError extends Error {
  constructor(message, { status, errors = [] } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
  }

  /** Field errors keyed by field name, ready to merge into form state. */
  get fieldErrors() {
    return this.errors.reduce((accumulator, error) => {
      if (error.field) accumulator[error.field] = error.message;
      return accumulator;
    }, {});
  }
}

/** Builds a query string, dropping empty values so filters stay clean. */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiRequestError(
      'Unable to reach the server. Check that the backend is running.',
      { status: 0 },
    );
  }

  // 204 and other empty bodies still need to resolve cleanly.
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(payload?.message ?? `Request failed with status ${response.status}`, {
      status: response.status,
      errors: payload?.errors ?? [],
    });
  }

  return payload;
}
