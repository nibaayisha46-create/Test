import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError } from '../api/client.js';
import { deleteUser, fetchUsers } from '../api/users.js';
import { GenderBadge, StatusBadge } from '../components/Badge.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from '../components/Icons.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateBlock.jsx';
import { useToast } from '../components/Toast.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { GENDERS, STATUSES, formatDate, fullName, initials, orDash } from '../utils/format.js';
import { UserDetailsModal } from './UserDetailsModal.jsx';
import { UserFormModal } from './UserFormModal.jsx';

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone_number', label: 'Phone number', sortable: false },
  { key: 'gender', label: 'Gender', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_date', label: 'Created date', sortable: true },
  { key: 'updated_date', label: 'Updated date', sortable: true },
];

export function UsersPage() {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState({ by: 'created_date', order: 'desc' });

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [formUser, setFormUser] = useState(null); // user object, or `true` for "add"
  const [detailsUser, setDetailsUser] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  // Any filter change puts us back on the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, gender, limit]);

  const loadUsers = useCallback(
    async (signal) => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetchUsers(
          {
            search: debouncedSearch,
            status,
            gender,
            page,
            limit,
            sortBy: sort.by,
            sortOrder: sort.order,
          },
          { signal },
        );
        setUsers(response.data);
        setMeta(response.meta);
      } catch (error) {
        if (error.name === 'AbortError') return;
        setLoadError(error instanceof ApiRequestError ? error.message : 'Unable to load users.');
        setUsers([]);
        setMeta(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [debouncedSearch, status, gender, page, limit, sort],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const refresh = () => loadUsers();

  const toggleSort = (key) => {
    setSort((current) =>
      current.by === key
        ? { by: key, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { by: key, order: 'asc' },
    );
  };

  const handleSaved = (savedUser, wasEdit) => {
    setFormUser(null);
    toast.success(
      wasEdit
        ? `${fullName(savedUser)} was updated successfully.`
        : `${fullName(savedUser)} was created successfully.`,
    );
    // A new user lands at the top of the default sort; jump back to page one.
    if (!wasEdit) setPage(1);
    refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(pendingDelete.id);
      toast.success(`${fullName(pendingDelete)} was deleted.`);
      setPendingDelete(null);

      // Step back a page if we just removed the only row on the last page.
      const isLastRowOnPage = users.length === 1 && page > 1;
      if (isLastRowOnPage) setPage((current) => current - 1);
      else refresh();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : 'Unable to delete this user.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(debouncedSearch || status || gender);

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setGender('');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Create, view, edit and remove user accounts.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setFormUser(true)}>
          <PlusIcon />
          Add user
        </button>
      </div>

      <section className="card">
        <div className="toolbar">
          <div className="filter-field">
            <label htmlFor="user-search">Search</label>
            <div className="search-input">
              <SearchIcon />
              <input
                id="user-search"
                type="search"
                className="input"
                placeholder="Search by name, email, phone, city…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="filter-field">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="gender-filter">Gender</label>
            <select
              id="gender-filter"
              className="select"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">All genders</option>
              {GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Clear filters
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState label="Loading users…" />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={refresh} />
        ) : users.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No users match your filters' : 'No users yet'}
            message={
              hasFilters
                ? 'Try a different search term or clear the filters.'
                : 'Get started by adding your first user.'
            }
            action={
              hasFilters ? (
                <button type="button" className="btn btn--secondary btn--sm" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setFormUser(true)}>
                  <PlusIcon />
                  Add user
                </button>
              )
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={column.sortable ? 'table__sortable' : undefined}
                      onClick={column.sortable ? () => toggleSort(column.key) : undefined}
                      aria-sort={
                        sort.by === column.key
                          ? sort.order === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                    >
                      {column.label}
                      {sort.by === column.key ? (
                        <span className="table__sort-icon">
                          {sort.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        </span>
                      ) : null}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
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
                    <td className="text-muted numeric">{formatDate(user.updated_date)}</td>
                    <td>
                      <div className="cell-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setDetailsUser(user)}
                          aria-label={`View ${fullName(user)}`}
                          title="View"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setFormUser(user)}
                          aria-label={`Edit ${fullName(user)}`}
                          title="Edit"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setPendingDelete(user)}
                          aria-label={`Delete ${fullName(user)}`}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
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
          />
        ) : null}
      </section>

      {formUser ? (
        <UserFormModal
          user={formUser === true ? null : formUser}
          onClose={() => setFormUser(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {detailsUser ? (
        <UserDetailsModal
          user={detailsUser}
          onClose={() => setDetailsUser(null)}
          onEdit={(user) => {
            setDetailsUser(null);
            setFormUser(user);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete user"
          message={
            <>
              Are you sure you want to delete <strong>{fullName(pendingDelete)}</strong>? This action
              cannot be undone.
            </>
          }
          confirmLabel="Delete user"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </>
  );
}
