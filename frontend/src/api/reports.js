import { buildQuery, request } from './client.js';

/** GET /api/reports/users — report rows, summary totals and pagination in one call. */
export function fetchUserReport(params, { signal } = {}) {
  return request(`/reports/users${buildQuery(params)}`, { signal });
}

/** GET /api/reports/summary — summary-card totals only. */
export function fetchSummary(params, { signal } = {}) {
  return request(`/reports/summary${buildQuery(params)}`, { signal });
}

/** GET /api/reports/filters — option lists for the filter controls. */
export function fetchFilterOptions({ signal } = {}) {
  return request('/reports/filters', { signal });
}
