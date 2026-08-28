import * as userModel from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, parseListOptions } from './userController.js';

/**
 * GET /api/reports/users
 * Filtered, paginated report rows plus the summary-card totals for the same
 * filter set, so the report page stays consistent in a single round trip.
 */
export const getUserReport = asyncHandler(async (req, res) => {
  const options = parseListOptions(req.query);
  const { rows, total } = userModel.findAll(options);

  res.json({
    success: true,
    data: rows,
    summary: userModel.summary(options.filters),
    meta: buildPaginationMeta({ total, page: options.page, limit: options.limit }),
  });
});

/** GET /api/reports/summary — summary cards only, honouring the same filters. */
export const getSummary = asyncHandler(async (req, res) => {
  const { filters } = parseListOptions(req.query);

  res.json({ success: true, data: userModel.summary(filters) });
});

/** GET /api/reports/filters — option lists for the report filter controls. */
export const getFilterOptions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      countries: userModel.distinctCountries(),
      statuses: ['Active', 'Inactive'],
      genders: ['Male', 'Female', 'Other'],
    },
  });
});
