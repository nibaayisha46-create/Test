import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/* eslint-disable no-unused-vars -- Express identifies error middleware by arity. */
export function errorHandler(error, req, res, next) {
  let statusCode = 500;
  let message = 'Something went wrong. Please try again.';
  let errors = [];

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errors = error.errors ?? [];
  } else if (error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    // Safety net for a unique-index race that slipped past the pre-check.
    statusCode = 409;
    message = 'A user with this email address already exists';
    errors = [{ field: 'email', message: 'This email address is already registered' }];
  } else if (error?.code === 'SQLITE_CONSTRAINT_CHECK') {
    statusCode = 422;
    message = 'One or more fields contain an unsupported value';
  } else if (error?.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
  }

  const payload = { success: false, message };
  if (errors.length) payload.errors = errors;
  if (config.env === 'development' && statusCode >= 500) payload.stack = error?.stack;

  res.status(statusCode).json(payload);
}
