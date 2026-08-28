import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config/env.js';

let db = null;

/** Lazily opens (and caches) the SQLite connection. */
export function getDb() {
  if (db) return db;

  if (!config.isMemoryDatabase) {
    fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
  }

  db = new Database(config.databaseFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
