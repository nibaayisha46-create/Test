import { buildQuery, request } from './client.js';

/** GET /api/users — paginated + filtered list. */
export function fetchUsers(params, { signal } = {}) {
  return request(`/users${buildQuery(params)}`, { signal });
}

/** GET /api/users/:id */
export function fetchUser(id, { signal } = {}) {
  return request(`/users/${id}`, { signal });
}

/** POST /api/users */
export function createUser(payload) {
  return request('/users', { method: 'POST', body: payload });
}

/** PUT /api/users/:id */
export function updateUser(id, payload) {
  return request(`/users/${id}`, { method: 'PUT', body: payload });
}

/** DELETE /api/users/:id */
export function deleteUser(id) {
  return request(`/users/${id}`, { method: 'DELETE' });
}
