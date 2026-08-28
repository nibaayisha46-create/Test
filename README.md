# User Management

A full-stack **Users Management** and **User Report** module: a REST API built with Express and
SQLite, and a React admin dashboard for managing user accounts and reporting on them.

The project was built from an empty repository, so it defines its own architecture and design
system rather than extending an existing one.

## Features

### Users module
- Full CRUD — create, view, edit and delete users
- Responsive users table: name, email, phone number, gender, city, country, status, created date,
  updated date and row actions
- Search across name, email, phone, city and country
- Status and gender filters, plus column sorting
- Server-side pagination with a configurable page size
- Client- and server-side form validation
- Confirmation dialog before any delete
- Passwords hashed with bcrypt and never returned by the API or shown in the UI

### User Report module
- Summary cards: total, active, inactive, male and female users
- Detailed report table: user name, email, phone number, gender, city, country, status, created date
- Filters for status, gender, country and a created-date range
- Search and pagination
- Summary totals always reflect the filters currently applied

## Technologies

| Layer | Stack |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, plain CSS design system (no UI framework) |
| Backend | Node.js 22, Express 4, express-validator |
| Database | SQLite via `better-sqlite3` (prepared, parameterized statements) |
| Security | `bcrypt` password hashing, CORS allow-list, JSON body-size limit |
| Testing | `node:test` for the API, Vitest + Testing Library for the UI |

**Why SQLite:** it needs no database server, so `npm run setup` produces a working, fully seeded
database on any machine. The data layer is plain SQL with bound parameters, so the queries port to
MySQL or Postgres with only the driver and connection module changing.

## Project structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/env.js            # Environment configuration
│   │   ├── controllers/             # Request handling (users, reports)
│   │   ├── db/                      # Connection, schema.sql, migrate, seed
│   │   ├── middleware/              # Validation results, error handler, 404
│   │   ├── models/userModel.js      # All SQL — parameterized queries only
│   │   ├── routes/                  # Route definitions
│   │   ├── utils/                   # ApiError, asyncHandler, password hashing
│   │   ├── validators/              # express-validator rule sets
│   │   ├── app.js                   # Express app factory
│   │   └── server.js                # Entry point
│   └── tests/api.test.js            # 28 API tests
├── frontend/
│   ├── src/
│   │   ├── api/                     # Typed fetch wrappers for the REST API
│   │   ├── components/              # Layout, modal, table chrome, toasts, form field
│   │   ├── hooks/                   # useDebouncedValue
│   │   ├── pages/                   # UsersPage, ReportsPage, form + details modals
│   │   ├── utils/                   # Formatting and client-side validation
│   │   └── index.css                # Design system (tokens, components, responsive)
│   └── tests/                       # 30 UI tests
└── package.json                     # Convenience scripts for both apps
```

## Database setup

The schema lives in `backend/src/db/schema.sql` and is applied automatically when the server
starts — no manual database creation is needed.

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password      TEXT NOT NULL,            -- bcrypt hash, never plain text
  phone_number  TEXT NOT NULL,
  date_of_birth TEXT,
  gender        TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  address       TEXT,
  city          TEXT NOT NULL,
  country       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_date  TEXT NOT NULL,
  updated_date  TEXT NOT NULL
);
```

Indexes are created on `email`, `status`, `gender`, `country` and `created_date` to keep the list
and report queries fast.

The database file is written to `backend/data/users.db` and is gitignored.

```bash
npm run migrate           # create the table and indexes
npm run seed              # insert 26 sample users
npm run seed -- --force   # wipe and re-seed
```

Every seeded account uses the password `Password123`.

## Environment variables

Copy the templates, then adjust if needed. The defaults work as-is.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### `backend/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | Environment name. Stack traces are only returned in `development`. |
| `PORT` | `5000` | Port the API listens on. |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated list of allowed browser origins. |
| `DATABASE_FILE` | `data/users.db` | SQLite file, relative to `backend/`. Use `:memory:` for a throwaway database. |
| `BCRYPT_SALT_ROUNDS` | `10` | bcrypt cost factor. |

### `frontend/.env`

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | _(unset)_ | Absolute API URL. Leave unset in development to use the dev-server proxy. |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Where the dev server forwards `/api` requests. |

## Installation

Requires **Node.js 18+** (built and tested on Node 22).

```bash
git clone <repository-url>
cd test

npm run install:all       # installs root, backend and frontend dependencies
npm run setup             # creates the database and seeds sample data
```

## Running the app

Run both apps together from the project root:

```bash
npm run dev
```

- API → http://localhost:5000
- UI → http://localhost:5173

### Backend only

```bash
cd backend
npm run dev     # auto-restarting development server
npm start       # production mode
```

### Frontend only

```bash
cd frontend
npm run dev     # Vite dev server on http://localhost:5173
npm run build   # production build to frontend/dist
npm run preview # preview the production build
```

The dev server proxies `/api` to the backend, so the browser stays same-origin and no CORS
configuration is required during development.

## Tests

```bash
npm test                      # API tests (28)
npm test --prefix frontend    # UI tests (30)
```

The API suite runs against a real in-memory SQLite database and covers every endpoint, the
validation rules, password hashing, email uniqueness and the report aggregations. The UI suite
mounts the real pages and covers the table, filters, pagination, form validation and the
create/edit/delete flows.

## API endpoints

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/users` | Create a user |
| `GET` | `/users` | List users — filtered, sorted, paginated |
| `GET` | `/users/:id` | Fetch a single user |
| `PUT` | `/users/:id` | Update a user |
| `DELETE` | `/users/:id` | Delete a user |
| `GET` | `/reports/users` | Report rows plus summary totals for the same filters |
| `GET` | `/reports/summary` | Summary-card totals only |
| `GET` | `/reports/filters` | Distinct countries, statuses and genders for the filter controls |

### Query parameters

`GET /users`, `GET /reports/users` and `GET /reports/summary` all accept:

| Parameter | Values | Description |
| --- | --- | --- |
| `search` | text | Matches name, email, phone, city or country |
| `status` | `Active`, `Inactive` | Status filter |
| `gender` | `Male`, `Female`, `Other` | Gender filter |
| `country` | text | Exact country, case-insensitive |
| `dateFrom` / `dateTo` | `YYYY-MM-DD` | Created-date range (inclusive) |
| `page` | integer ≥ 1 | Page number (default `1`) |
| `limit` | 1–100 | Page size (default `10`) |
| `sortBy` | `name`, `email`, `gender`, `city`, `country`, `status`, `created_date`, `updated_date` | Sort column (whitelisted) |
| `sortOrder` | `asc`, `desc` | Sort direction (default `desc`) |

### Request body

`POST /users` and `PUT /users/:id`:

```json
{
  "first_name": "Grace",
  "last_name": "Mwangi",
  "email": "grace.mwangi@example.com",
  "password": "Password123",
  "phone_number": "+254 722 118 440",
  "date_of_birth": "1999-01-09",
  "gender": "Female",
  "address": "Ngong Road 88",
  "city": "Nairobi",
  "country": "Kenya",
  "status": "Active"
}
```

Required: `first_name`, `last_name`, `email`, `phone_number`, `gender`, `city`, `country`.
Optional: `date_of_birth`, `address`, `status` (defaults to `Active`).
`password` is required on create; on update, send an empty value to keep the existing password.

### Responses

Success:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": { "id": 27, "first_name": "Grace", "...": "..." }
}
```

List responses add pagination metadata, and report responses add summary totals:

```json
{
  "success": true,
  "data": [],
  "summary": { "totalUsers": 26, "activeUsers": 19, "inactiveUsers": 7, "maleUsers": 12, "femaleUsers": 13 },
  "meta": { "page": 1, "limit": 10, "total": 26, "totalPages": 3, "hasPreviousPage": false, "hasNextPage": true }
}
```

Errors carry a message and, for validation failures, per-field details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}
```

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | User created |
| `400` | Malformed request body |
| `404` | User or route not found |
| `409` | Email address already registered |
| `422` | Validation failed |
| `500` | Unexpected server error |

## Security notes

- Passwords are hashed with bcrypt before storage and are never selected into any API response,
  the users table or the report.
- On update, a blank password field leaves the stored hash untouched.
- Every SQL statement uses bound parameters; the only interpolated values are sort columns, which
  are resolved through a whitelist.
- Email uniqueness is enforced both by a pre-check and a case-insensitive unique index.
- Request bodies are capped at 100 kB, and CORS is restricted to the configured origins.
