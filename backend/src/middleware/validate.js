import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs after a set of express-validator rules and turns any failures into a
 * single 422 response of the shape { field, message } the frontend expects.
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path ?? error.param,
    message: error.msg,
  }));

  return next(new ApiError(422, 'Validation failed', errors));
}
