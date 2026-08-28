import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../api/client.js';
import { fetchFilterOptions, fetchUserReport } from '../api/reports.js';
import { GenderBadge, StatusBadge } from '../components/Badge.jsx';
import {
  FemaleIcon,
  MaleIcon,
  SearchIcon,
  UserCheckIcon,
  UserOffIcon,
  UsersIcon,
} from '../components/Icons.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateBlock.jsx';
import { SummaryCard } from '../components/SummaryCard.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { GENDERS, STATUSES, formatDate, fullName, initials, orDash } from '../utils/format.js';

const EMPTY_SUMMARY = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  maleUsers: 0,
  femaleUsers: 0,
};

const INITIAL_FILTERS = {
  search: '',
  status: '',
  gender: '',
  country: '',
  dateFrom: '',
  dateTo: '',
};

export function ReportsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [meta, setMeta] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const debouncedSearch = useDebouncedValue(filters.search);

  const setFilter = (key) => (event) => {
    const { value } = event.target;
    setFilters((current) => ({ ...current, [key]: value }));
  };

  // Country list only changes when users change, so it loads once.
  useEffect(() => {
    const controller = new AbortController();
    fetchFilterOptions({ signal: controller.signal })
      .then((response) => setCountries(response.data.countries))
      .catch(() => {
        /* The country filter simply stays empty if this call fails. */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.gender, filters.country, filters.dateFrom, filters.dateTo, limit]);

  const loadReport = useCallback(
    async (signal) => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetchUserReport(
          {
            search: debouncedSearch,
            status: filters.status,
            gender: filters.gender,
            country: filters.country,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            page,
            limit,
            sortBy: 'created_date',
            sortOrder: 'desc',
          },
          { signal },
        );
        setRows(response.data);
        setSummary(response.summary ?? EMPTY_SUMMARY);
        setMeta(response.meta);
      } catch (error) {
        if (error.name === 'AbortError') return;
        setLoadError(error instanceof ApiRequestError ? error.message : 'Unable to load the report.');
        setRows([]);
        setSummary(EMPTY_SUMMARY);
        setMeta(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debouncedSearch, filters.status, filters.gender, filters.country, filters.dateFrom, filters.dateTo, page, limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadReport(controller.signal);
    return () => controller.abort();
  }, [loadReport]);

  const hasFilters = Object.values(filters).some(Boolean);
  const clearFilters = () => setFilters(INITIAL_FILTERS);

  // A reversed range is rejected by the API, so flag it before sending.
  const invalidRange = Boolean(filters.dateFrom && filters.dateTo && filters.dateTo < filters.dateFrom);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>User Reports</h1>
          <p>Summary statistics and a detailed breakdown of every user account.</p>
        </div>
      </div>

      <div className="summary-grid">
        <SummaryCard
          label="Total users"
          value={summary.totalUsers}
          icon={<UsersIcon />}
          tone="brand"
          loading={loading}
        />
        <SummaryCard
          label="Active users"
          value={summary.activeUsers}
          icon={<UserCheckIcon />}
          tone="success"
          loading={loading}
        />
        <SummaryCard
          label="Inactive users"
          value={summary.inactiveUsers}
          icon={<UserOffIcon />}
          tone="danger"
          loading={loading}
        />
        <SummaryCard
          label="Male users"
          value={summary.maleUsers}
          icon={<MaleIcon />}
          tone="brand"
          loading={loading}
        />
        <SummaryCard
          label="Female users"
          value={summary.femaleUsers}
          icon={<FemaleIcon />}
          tone="info"
          loading={loading}
        />
      </div>

      <section className="card">
        <div className="card__header">
          <span className="card__title">Detailed user report</span>
          {meta ? <span className="text-muted">{meta.total} matching record(s)</span> : null}
        </div>

        <div className="toolbar">
          <div className="filter-field">
            <label htmlFor="report-search">Search</label>
            <div className="search-input">
              <SearchIcon />
              <input
                id="report-search"
                type="search"
                className="input"
                placeholder="Search by name, email, phone…"
                value={filters.search}
                onChange={setFilter('search')}
              />
            </div>
          </div>

          <div className="filter-field">
            <label htmlFor="report-status">Status</label>
            <select id="report-status" className="select" value={filters.status} onChange={setFilter('status')}>
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="report-gender">Gender</label>
            <select id="report-gender" className="select" value={filters.gender} onChange={setFilter('gender')}>
              <option value="">All genders</option>
              {GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="report-country">Country</label>
            <select id="report-country" className="select" value={filters.country} onChange={setFilter('country')}>
              <option value="">All countries</option>
              {countries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="report-date-from">Created from</label>
            <input
              id="report-date-from"
              type="date"
              className="input"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={setFilter('dateFrom')}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="report-date-to">Created to</label>
            <input
              id="report-date-to"
              type="date"
              className={`input${invalidRange ? ' has-error' : ''}`}
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={setFilter('dateTo')}
            />
            {invalidRange ? <span className="field__error">Must be on or after the start date</span> : null}
          </div>

          <div className="toolbar__actions">
            <button type="button" className="btn btn--secondary" onClick={clearFilters} disabled={!hasFilters}>
              Clear filters
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Building report…" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={() => loadReport()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No records match this report"
            message={hasFilters ? 'Try widening the filters or the date range.' : 'There are no users to report on yet.'}
            action={
              hasFilters ? (
                <button type="button" className="btn btn--secondary btn--sm" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>User name</th>
                  <th>Email</th>
                  <th>Phone number</th>
                  <th>Gender</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Created date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-user">
                        <span className="avatar">{initials(user)}</span>
                        <span className="cell-user__name">{fullName(user)}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{orDash(user.phone_number)}</td>
                    <td>
                      <GenderBadge gender={user.gender} />
                    </td>
                    <td>{orDash(user.city)}</td>
                    <td>{orDash(user.country)}</td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="text-muted numeric">{formatDate(user.created_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !loadError && meta && meta.total > 0 ? (
          <Pagination
            meta={meta}
            pageSize={limit}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
            itemLabel="records"
          />
        ) : null}
      </section>
    </>
  );
}
