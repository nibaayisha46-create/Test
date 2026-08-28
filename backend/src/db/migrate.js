import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';

const currentFile = fileURLToPath(import.meta.url);
const schemaFile = path.join(path.dirname(currentFile), 'schema.sql');

/** Applies schema.sql. Safe to run repeatedly — every statement is IF NOT EXISTS. */
export function runMigrations() {
  const schema = fs.readFileSync(schemaFile, 'utf8');
  getDb().exec(schema);
}

// Allow `npm run migrate` to execute this file directly.
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runMigrations();
  console.log('Migration complete — the "users" table is ready.');
}
