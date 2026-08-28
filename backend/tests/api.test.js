/**
 * End-to-end API tests. They boot the real Express app against a throwaway
 * in-memory SQLite database and drive it over real HTTP.
 */
process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';
process.env.BCRYPT_SALT_ROUNDS = '4'; // keep the suite fast

import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';

const { createApp } = await import('../src/app.js');
const { runMigrations } = await import('../src/db/migrate.js');
const { getDb, closeDb } = await import('../src/db/connection.js');
const { verifyPassword } = await import('../src/utils/password.js');

let server;
let baseUrl;

const validUser = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test.user@example.com',
  password: 'Password123',
  phone_number: '+91 98450 11223',
  date_of_birth: '1995-04-12',
  gender: 'Female',
  address: '14 Brigade Road',
  city: 'Bengaluru',
  country: 'India',
  status: 'Active',
};

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

const createUser = (overrides = {}) =>
  api('/api/users', { method: 'POST', body: { ...validUser, ...overrides } });

before(async () => {
  runMigrations();
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
});

beforeEach(() => {
  getDb().prepare('DELETE FROM users').run();
});

test('GET /api/health reports the API is up', async () => {
  const { status, body } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
});

test('POST /api/users creates a user and never returns the password', async () => {
  const { status, body } = await createUser();

  assert.equal(status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.email, 'test.user@example.com');
  assert.equal(body.data.status, 'Active');
  assert.ok(body.data.id > 0);
  assert.ok(body.data.created_date);
  assert.ok(body.data.updated_date);
  assert.equal(body.data.password, undefined, 'password must never be serialised');
});

test('POST /api/users stores a bcrypt hash, not the plain password', async () => {
  const { body } = await createUser();

  const stored = getDb().prepare('SELECT password FROM users WHERE id = ?').get(body.data.id);
  assert.notEqual(stored.password, validUser.password);
  assert.match(stored.password, /^\$2[aby]\$\d{2}\$/, 'must be a bcrypt hash');
  assert.equal(await verifyPassword(validUser.password, stored.password), true);
});

test('POST /api/users rejects a duplicate email (case-insensitive) with 409', async () => {
  await createUser();
  const { status, body } = await createUser({ email: 'TEST.USER@EXAMPLE.COM' });

  assert.equal(status, 409);
  assert.equal(body.success, false);
  assert.equal(body.errors[0].field, 'email');
});

test('POST /api/users rejects missing required fields with 422', async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const body = await response.json();

  assert.equal(response.status, 422);
  const fields = body.errors.map((error) => error.field);
  for (const required of ['first_name', 'last_name', 'email', 'password', 'phone_number', 'gender', 'city', 'country']) {
    assert.ok(fields.includes(required), `expected a validation error for ${required}`);
  }
});

test('POST /api/users rejects an invalid email format', async () => {
  const { status, body } = await createUser({ email: 'not-an-email' });

  assert.equal(status, 422);
  assert.ok(body.errors.some((error) => error.field === 'email'));
});

test('POST /api/users rejects a weak password', async () => {
  const { status, body } = await createUser({ password: 'short' });

  assert.equal(status, 422);
  assert.ok(body.errors.some((error) => error.field === 'password'));
});

test('POST /api/users rejects an invalid gender and status', async () => {
  const genderResult = await createUser({ gender: 'Unknown' });
  assert.equal(genderResult.status, 422);

  const statusResult = await createUser({ email: 'a@b.com', status: 'Archived' });
  assert.equal(statusResult.status, 422);
});

test('GET /api/users paginates and reports accurate meta', async () => {
  for (let index = 0; index < 12; index += 1) {
    await createUser({ email: `user${index}@example.com` });
  }

  const { status, body } = await api('/api/users?page=2&limit=5');

  assert.equal(status, 200);
  assert.equal(body.data.length, 5);
  assert.equal(body.meta.total, 12);
  assert.equal(body.meta.page, 2);
  assert.equal(body.meta.totalPages, 3);
  assert.equal(body.meta.hasNextPage, true);
  assert.equal(body.meta.hasPreviousPage, true);
  assert.ok(body.data.every((user) => user.password === undefined));
});

test('GET /api/users filters by status, gender and search term', async () => {
  await createUser({ email: 'active.male@example.com', gender: 'Male', status: 'Active', first_name: 'Arjun' });
  await createUser({ email: 'inactive.female@example.com', gender: 'Female', status: 'Inactive', first_name: 'Bina' });
  await createUser({ email: 'active.female@example.com', gender: 'Female', status: 'Active', first_name: 'Chitra' });

  const byStatus = await api('/api/users?status=Active');
  assert.equal(byStatus.body.meta.total, 2);

  const byGender = await api('/api/users?gender=Female');
  assert.equal(byGender.body.meta.total, 2);

  const combined = await api('/api/users?status=Active&gender=Female');
  assert.equal(combined.body.meta.total, 1);
  assert.equal(combined.body.data[0].first_name, 'Chitra');

  const bySearch = await api('/api/users?search=Bina');
  assert.equal(bySearch.body.meta.total, 1);

  const byEmailSearch = await api('/api/users?search=active.male');
  assert.equal(byEmailSearch.body.meta.total, 1);
});

test('GET /api/users rejects an invalid filter value', async () => {
  const { status } = await api('/api/users?status=Deleted');
  assert.equal(status, 422);
});

test('GET /api/users ignores an unknown sort column instead of breaking', async () => {
  await createUser();
  const { status, body } = await api('/api/users?sortBy=password;DROP TABLE users&sortOrder=asc');

  assert.equal(status, 200);
  assert.equal(body.meta.total, 1);
  assert.equal(getDb().prepare('SELECT COUNT(*) AS total FROM users').get().total, 1);
});

test('GET /api/users/:id returns one user, or 404 when missing', async () => {
  const { body: created } = await createUser();

  const found = await api(`/api/users/${created.data.id}`);
  assert.equal(found.status, 200);
  assert.equal(found.body.data.email, validUser.email);
  assert.equal(found.body.data.password, undefined);

  const missing = await api('/api/users/999999');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.success, false);
});

test('GET /api/users/:id rejects a non-numeric id', async () => {
  const { status } = await api('/api/users/abc');
  assert.equal(status, 422);
});

test('PUT /api/users/:id updates fields and refreshes updated_date', async () => {
  const { body: created } = await createUser();

  const { status, body } = await api(`/api/users/${created.data.id}`, {
    method: 'PUT',
    body: { ...validUser, password: '', first_name: 'Updated', city: 'Chennai', status: 'Inactive' },
  });

  assert.equal(status, 200);
  assert.equal(body.data.first_name, 'Updated');
  assert.equal(body.data.city, 'Chennai');
  assert.equal(body.data.status, 'Inactive');
  assert.equal(body.data.created_date, created.data.created_date, 'created_date must not change');
  assert.ok(body.data.updated_date >= created.data.updated_date);
  assert.equal(body.data.password, undefined);
});

test('PUT /api/users/:id keeps the old password when the field is left blank', async () => {
  const { body: created } = await createUser();
  const before = getDb().prepare('SELECT password FROM users WHERE id = ?').get(created.data.id).password;

  await api(`/api/users/${created.data.id}`, {
    method: 'PUT',
    body: { ...validUser, password: '' },
  });

  const afterUpdate = getDb().prepare('SELECT password FROM users WHERE id = ?').get(created.data.id).password;
  assert.equal(afterUpdate, before);
});

test('PUT /api/users/:id re-hashes when a new password is supplied', async () => {
  const { body: created } = await createUser();
  const before = getDb().prepare('SELECT password FROM users WHERE id = ?').get(created.data.id).password;

  await api(`/api/users/${created.data.id}`, {
    method: 'PUT',
    body: { ...validUser, password: 'BrandNew456' },
  });

  const afterUpdate = getDb().prepare('SELECT password FROM users WHERE id = ?').get(created.data.id).password;
  assert.notEqual(afterUpdate, before);
  assert.equal(await verifyPassword('BrandNew456', afterUpdate), true);
});

test('PUT /api/users/:id blocks taking another user email but allows keeping your own', async () => {
  const { body: first } = await createUser({ email: 'first@example.com' });
  const { body: second } = await createUser({ email: 'second@example.com' });

  const conflict = await api(`/api/users/${second.data.id}`, {
    method: 'PUT',
    body: { ...validUser, email: 'first@example.com', password: '' },
  });
  assert.equal(conflict.status, 409);

  const sameEmail = await api(`/api/users/${first.data.id}`, {
    method: 'PUT',
    body: { ...validUser, email: 'first@example.com', password: '', city: 'Pune' },
  });
  assert.equal(sameEmail.status, 200);
  assert.equal(sameEmail.body.data.city, 'Pune');
});

test('PUT /api/users/:id returns 404 for a missing user', async () => {
  const { status } = await api('/api/users/999999', {
    method: 'PUT',
    body: { ...validUser, password: '' },
  });
  assert.equal(status, 404);
});

test('DELETE /api/users/:id removes the row, and 404s the second time', async () => {
  const { body: created } = await createUser();

  const deleted = await api(`/api/users/${created.data.id}`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.success, true);

  assert.equal(getDb().prepare('SELECT COUNT(*) AS total FROM users').get().total, 0);

  const again = await api(`/api/users/${created.data.id}`, { method: 'DELETE' });
  assert.equal(again.status, 404);
});

test('GET /api/reports/summary returns the summary-card totals', async () => {
  await createUser({ email: 'a@example.com', gender: 'Male', status: 'Active' });
  await createUser({ email: 'b@example.com', gender: 'Male', status: 'Inactive' });
  await createUser({ email: 'c@example.com', gender: 'Female', status: 'Active' });
  await createUser({ email: 'd@example.com', gender: 'Other', status: 'Active' });

  const { status, body } = await api('/api/reports/summary');

  assert.equal(status, 200);
  assert.deepEqual(
    {
      totalUsers: body.data.totalUsers,
      activeUsers: body.data.activeUsers,
      inactiveUsers: body.data.inactiveUsers,
      maleUsers: body.data.maleUsers,
      femaleUsers: body.data.femaleUsers,
    },
    { totalUsers: 4, activeUsers: 3, inactiveUsers: 1, maleUsers: 2, femaleUsers: 1 },
  );
});

test('GET /api/reports/summary honours the active filters', async () => {
  await createUser({ email: 'a@example.com', gender: 'Male', status: 'Active', country: 'India' });
  await createUser({ email: 'b@example.com', gender: 'Female', status: 'Inactive', country: 'Kenya' });

  const { body } = await api('/api/reports/summary?country=India');
  assert.equal(body.data.totalUsers, 1);
  assert.equal(body.data.maleUsers, 1);
  assert.equal(body.data.femaleUsers, 0);
});

test('GET /api/reports/users returns rows, summary and pagination together', async () => {
  await createUser({ email: 'a@example.com', country: 'India', status: 'Active' });
  await createUser({ email: 'b@example.com', country: 'Kenya', status: 'Inactive' });

  const { status, body } = await api('/api/reports/users?limit=1');

  assert.equal(status, 200);
  assert.equal(body.data.length, 1);
  assert.equal(body.meta.total, 2);
  assert.equal(body.summary.totalUsers, 2);
  assert.ok(body.data.every((user) => user.password === undefined));
});

test('GET /api/reports/users filters by country and date range', async () => {
  await createUser({ email: 'a@example.com', country: 'India' });
  await createUser({ email: 'b@example.com', country: 'Kenya' });

  const byCountry = await api('/api/reports/users?country=India');
  assert.equal(byCountry.body.meta.total, 1);

  const today = new Date().toISOString().slice(0, 10);
  const inRange = await api(`/api/reports/users?dateFrom=${today}&dateTo=${today}`);
  assert.equal(inRange.body.meta.total, 2);

  const outOfRange = await api('/api/reports/users?dateFrom=2000-01-01&dateTo=2000-01-31');
  assert.equal(outOfRange.body.meta.total, 0);
  assert.equal(outOfRange.body.summary.totalUsers, 0);
});

test('GET /api/reports/users rejects a reversed date range', async () => {
  const { status } = await api('/api/reports/users?dateFrom=2025-05-01&dateTo=2025-01-01');
  assert.equal(status, 422);
});

test('GET /api/reports/filters lists the distinct countries', async () => {
  await createUser({ email: 'a@example.com', country: 'Kenya' });
  await createUser({ email: 'b@example.com', country: 'India' });
  await createUser({ email: 'c@example.com', country: 'India' });

  const { status, body } = await api('/api/reports/filters');

  assert.equal(status, 200);
  assert.deepEqual(body.data.countries, ['India', 'Kenya']);
  assert.deepEqual(body.data.statuses, ['Active', 'Inactive']);
});

test('unknown routes return a JSON 404', async () => {
  const { status, body } = await api('/api/does-not-exist');
  assert.equal(status, 404);
  assert.equal(body.success, false);
});

test('malformed JSON returns a JSON 400 rather than an HTML error page', async () => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
});
