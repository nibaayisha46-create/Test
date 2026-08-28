import { config } from '../config/env.js';
import * as userModel from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/password.js';

/** Pulls the validated filter/pagination options off the request query. */
export function parseListOptions(query = {}) {
  const { defaultLimit, maxLimit } = config.pagination;
  const limit = Math.min(Number(query.limit) || defaultLimit, maxLimit);
  const page = Number(query.page) || 1;

  return {
    filters: {
      search: query.search || undefined,
      status: query.status || undefined,
      gender: query.gender || undefined,
      country: query.country || undefined,
      dateFrom: query.dateFrom || undefined,
      dateTo: query.dateTo || undefined,
    },
    page,
    limit,
    sortBy: query.sortBy || 'created_date',
    sortOrder: query.sortOrder || 'desc',
  };
}

/** Maps validated request data onto the writable user columns. */
function toUserRecord(body) {
  return {
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone_number: body.phone_number,
    date_of_birth: body.date_of_birth || null,
    gender: body.gender,
    address: body.address || null,
    city: body.city,
    country: body.country,
    status: body.status || 'Active',
  };
}

export function buildPaginationMeta({ total, page, limit }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

/** GET /api/users */
export const listUsers = asyncHandler(async (req, res) => {
  const options = parseListOptions(req.query);
  const { rows, total } = userModel.findAll(options);

  res.json({
    success: true,
    data: rows,
    meta: buildPaginationMeta({ total, page: options.page, limit: options.limit }),
  });
});

/** GET /api/users/:id */
export const getUser = asyncHandler(async (req, res) => {
  const user = userModel.findById(req.params.id);
  if (!user) throw ApiError.notFound(`No user found with id ${req.params.id}`);

  res.json({ success: true, data: user });
});

/** POST /api/users */
export const createUser = asyncHandler(async (req, res) => {
  const record = toUserRecord(req.body);

  if (userModel.findByEmail(record.email)) {
    throw ApiError.conflict('A user with this email address already exists', [
      { field: 'email', message: 'This email address is already registered' },
    ]);
  }

  record.password = await hashPassword(req.body.password);
  const user = userModel.create(record);

  res.status(201).json({ success: true, message: 'User created successfully', data: user });
});

/** PUT /api/users/:id */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!userModel.findById(id)) throw ApiError.notFound(`No user found with id ${id}`);

  const record = toUserRecord(req.body);

  if (userModel.findByEmail(record.email, { excludeId: id })) {
    throw ApiError.conflict('A user with this email address already exists', [
      { field: 'email', message: 'This email address is already registered' },
    ]);
  }

  // An empty password on update means "keep the existing one".
  if (req.body.password) {
    record.password = await hashPassword(req.body.password);
  }

  const user = userModel.update(id, record);

  res.json({ success: true, message: 'User updated successfully', data: user });
});

/** DELETE /api/users/:id */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!userModel.remove(id)) throw ApiError.notFound(`No user found with id ${id}`);

  res.json({ success: true, message: 'User deleted successfully', data: { id: Number(id) } });
});
