import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDir, '..', '..');

const MEMORY_DB = ':memory:';

function resolveDatabaseFile() {
  const configured = process.env.DATABASE_FILE?.trim() || 'data/users.db';
  if (configured === MEMORY_DB) return MEMORY_DB;
  return path.isAbsolute(configured) ? configured : path.join(backendRoot, configured);
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: toPositiveInt(process.env.PORT, 5000),
  databaseFile: resolveDatabaseFile(),
  isMemoryDatabase: resolveDatabaseFile() === MEMORY_DB,
  bcryptSaltRounds: toPositiveInt(process.env.BCRYPT_SALT_ROUNDS, 10),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};

export { backendRoot };
