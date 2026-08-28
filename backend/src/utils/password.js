import bcrypt from 'bcrypt';
import { config } from '../config/env.js';

/** Hashes a plain-text password with bcrypt (a unique salt per password). */
export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.bcryptSaltRounds);
}

/** Compares a plain-text password against a stored bcrypt hash. */
export function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}
