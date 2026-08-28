import { getDb } from '../db/connection.js';

/**
 * Every column except `password`. The bcrypt hash must never leave the model
 * layer, so no read helper selects it apart from findByIdWithPassword().
 */
const PUBLIC_COLUMNS = [
  'id',
  'first_name',
  'last_name',
  'email',
  'phone_number',
  'date_of_birth',
  'gender',
  'address',
  'city',
  'country',
  'status',
  'created_date',
  'updated_date',
].join(', ');

/**
 * Whitelist of sortable columns. A column name cannot be bound as a SQL
 * parameter, so an unrecognised value must never reach the query string.
 */
const SORTABLE_COLUMNS = new Map([
  ['id', 'id'],
  ['name', 'first_name'],
  ['first_name', 'first_name'],
  ['last_name', 'last_name'],
  ['email', 'email'],
  ['phone_number', 'phone_number'],
  ['gender', 'gender'],
  ['city', 'city'],
  ['country', 'country'],
  ['status', 'status'],
  ['created_date', 'created_date'],
  ['updated_date', 'updated_date'],
]);

const WRITABLE_COLUMNS = [
  'first_name',
  'last_name',
  'email',
  'password',
  'phone_number',
  'date_of_birth',
  'gender',
  'address',
  'city',
  'country',
  'status',
];

function nowIso() {
  return new Date().toISOString();
}

/**
 * Turns the request filters into a WHERE clause plus bound parameters.
 * Every user-supplied value is bound, never concatenated into the SQL.
 */
function buildWhereClause({ search, status, gender, country, dateFrom, dateTo } = {}) {
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push(`(
      first_name LIKE @search
      OR last_name LIKE @search
      OR (first_name || ' ' || last_name) LIKE @search
      OR email LIKE @search
      OR phone_number LIKE @search
      OR city LIKE @search
      OR country LIKE @search
    )`);
    params.search = `%${search}%`;
  }
  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }
  if (gender) {
    conditions.push('gender = @gender');
    params.gender = gender;
  }
  if (country) {
    conditions.push('country = @country COLLATE NOCASE');
    params.country = country;
  }
  if (dateFrom) {
    conditions.push('created_date >= @dateFrom');
    params.dateFrom = `${dateFrom}T00:00:00.000Z`;
  }
  if (dateTo) {
    conditions.push('created_date <= @dateTo');
    params.dateTo = `${dateTo}T23:59:59.999Z`;
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

/** Paginated, filtered, sorted list of users. Never returns password hashes. */
export function findAll({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'created_date',
  sortOrder = 'desc',
} = {}) {
  const db = getDb();
  const { where, params } = buildWhereClause(filters);

  const column = SORTABLE_COLUMNS.get(String(sortBy).toLowerCase()) ?? 'created_date';
  const direction = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM users ${where}`).get(params);

  const rows = db
    .prepare(
      `SELECT ${PUBLIC_COLUMNS}
         FROM users
         ${where}
        ORDER BY ${column} ${direction}, id ${direction}
        LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit, offset: (page - 1) * limit });

  return { rows, total };
}

export function findById(id) {
  return getDb().prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id);
}

/** Only for authentication flows — this one does include the bcrypt hash. */
export function findByIdWithPassword(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/** Case-insensitive lookup used to enforce unique e-mail addresses. */
export function findByEmail(email, { excludeId } = {}) {
  if (excludeId) {
    return getDb()
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id <> ?')
      .get(email, excludeId);
  }
  return getDb().prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
}

/** Inserts a user. `data.password` must already be a bcrypt hash. */
export function create(data) {
  const timestamp = nowIso();
  const record = { created_date: timestamp, updated_date: timestamp };

  for (const column of WRITABLE_COLUMNS) {
    record[column] = data[column] ?? null;
  }

  const columns = Object.keys(record);
  const result = getDb()
    .prepare(
      `INSERT INTO users (${columns.join(', ')})
       VALUES (${columns.map((column) => `@${column}`).join(', ')})`,
    )
    .run(record);

  return findById(result.lastInsertRowid);
}

/** Updates only the supplied columns and always refreshes updated_date. */
export function update(id, data) {
  const record = { id, updated_date: nowIso() };

  for (const column of WRITABLE_COLUMNS) {
    if (data[column] !== undefined) record[column] = data[column];
  }

  const assignments = Object.keys(record)
    .filter((column) => column !== 'id')
    .map((column) => `${column} = @${column}`);

  const result = getDb()
    .prepare(`UPDATE users SET ${assignments.join(', ')} WHERE id = @id`)
    .run(record);

  return result.changes > 0 ? findById(id) : undefined;
}

export function remove(id) {
  return getDb().prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
}

/** Aggregate counts for the report summary cards, honouring the active filters. */
export function summary(filters = {}) {
  const { where, params } = buildWhereClause(filters);

  return getDb()
    .prepare(
      `SELECT
         COUNT(*) AS totalUsers,
         COALESCE(SUM(CASE WHEN status = 'Active'   THEN 1 END), 0) AS activeUsers,
         COALESCE(SUM(CASE WHEN status = 'Inactive' THEN 1 END), 0) AS inactiveUsers,
         COALESCE(SUM(CASE WHEN gender = 'Male'     THEN 1 END), 0) AS maleUsers,
         COALESCE(SUM(CASE WHEN gender = 'Female'   THEN 1 END), 0) AS femaleUsers,
         COALESCE(SUM(CASE WHEN gender = 'Other'    THEN 1 END), 0) AS otherUsers
       FROM users
       ${where}`,
    )
    .get(params);
}

/** Distinct countries, used to populate the report's country filter. */
export function distinctCountries() {
  return getDb()
    .prepare(
      `SELECT DISTINCT country
         FROM users
        WHERE country IS NOT NULL AND TRIM(country) <> ''
        ORDER BY country COLLATE NOCASE ASC`,
    )
    .all()
    .map((row) => row.country);
}

export function countAll() {
  return getDb().prepare('SELECT COUNT(*) AS total FROM users').get().total;
}
