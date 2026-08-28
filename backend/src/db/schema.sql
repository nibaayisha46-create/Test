-- Users Management Module schema
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password      TEXT NOT NULL,
  phone_number  TEXT NOT NULL,
  date_of_birth TEXT,
  gender        TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  address       TEXT,
  city          TEXT NOT NULL,
  country       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_date  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_date  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email   ON users (email COLLATE NOCASE);
CREATE INDEX        IF NOT EXISTS idx_users_status  ON users (status);
CREATE INDEX        IF NOT EXISTS idx_users_gender  ON users (gender);
CREATE INDEX        IF NOT EXISTS idx_users_country ON users (country);
CREATE INDEX        IF NOT EXISTS idx_users_created ON users (created_date);
