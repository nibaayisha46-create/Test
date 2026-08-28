import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiRequestError } from '../src/api/client.js';
import * as reportsApi from '../src/api/reports.js';
import { ReportsPage } from '../src/pages/ReportsPage.jsx';

vi.mock('../src/api/reports.js', () => ({
  fetchUserReport: vi.fn(),
  fetchSummary: vi.fn(),
  fetchFilterOptions: vi.fn(),
}));

const reportRow = {
  id: 1,
  first_name: 'Aisha',
  last_name: 'Rahman',
  email: 'aisha.rahman@example.com',
  phone_number: '+91 98450 11223',
  gender: 'Female',
  city: 'Bengaluru',
  country: 'India',
  status: 'Active',
  created_date: '2025-01-10T09:30:00.000Z',
  updated_date: '2025-01-10T09:30:00.000Z',
};

const summary = {
  totalUsers: 26,
  activeUsers: 19,
  inactiveUsers: 7,
  maleUsers: 12,
  femaleUsers: 13,
  otherUsers: 1,
};

function reportResponse(data = [reportRow], overrides = {}) {
  return {
    success: true,
    data,
    summary,
    meta: {
      page: 1,
      limit: 10,
      total: data.length,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      ...overrides,
    },
  };
}

const lastQuery = () => reportsApi.fetchUserReport.mock.calls.at(-1)[0];

/** Reads the number rendered on a summary card by its label. */
function cardValue(label) {
  const card = screen.getByText(label).closest('.summary-card');
  return within(card).getByText(/^[\d,]+$/).textContent;
}

beforeEach(() => {
  reportsApi.fetchUserReport.mockResolvedValue(reportResponse());
  reportsApi.fetchFilterOptions.mockResolvedValue({
    success: true,
    data: { countries: ['India', 'Kenya', 'Nigeria'], statuses: ['Active', 'Inactive'], genders: ['Male', 'Female', 'Other'] },
  });
});

describe('Summary cards', () => {
  test('renders all five totals from the API', async () => {
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    expect(cardValue('Total users')).toBe('26');
    expect(cardValue('Active users')).toBe('19');
    expect(cardValue('Inactive users')).toBe('7');
    expect(cardValue('Male users')).toBe('12');
    expect(cardValue('Female users')).toBe('13');
  });

  test('recalculates when a filter narrows the report', async () => {
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    reportsApi.fetchUserReport.mockResolvedValue({
      ...reportResponse(),
      summary: { ...summary, totalUsers: 5, activeUsers: 5, inactiveUsers: 0, maleUsers: 0, femaleUsers: 5 },
    });

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Active');

    await waitFor(() => expect(cardValue('Total users')).toBe('5'));
    expect(cardValue('Inactive users')).toBe('0');
  });
});

describe('Report table', () => {
  test('renders the required report columns', async () => {
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    for (const column of ['User name', 'Email', 'Phone number', 'Gender', 'City', 'Country', 'Status', 'Created date']) {
      expect(screen.getByRole('columnheader', { name: new RegExp(`^${column}$`, 'i') })).toBeInTheDocument();
    }

    // The report must not expose password data.
    expect(screen.queryByRole('columnheader', { name: /password/i })).not.toBeInTheDocument();
  });

  test('shows an empty state when nothing matches', async () => {
    reportsApi.fetchUserReport.mockResolvedValue(reportResponse([], { total: 0, totalPages: 0 }));
    render(<ReportsPage />);

    expect(await screen.findByText('No records match this report')).toBeInTheDocument();
  });

  test('shows an error state when the report fails to load', async () => {
    reportsApi.fetchUserReport.mockRejectedValue(new ApiRequestError('Unable to reach the server.', { status: 0 }));
    render(<ReportsPage />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });
});

describe('Report filters', () => {
  test('populates the country filter from the API', async () => {
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    await waitFor(() =>
      expect(within(screen.getByLabelText('Country')).getByRole('option', { name: 'Kenya' })).toBeInTheDocument(),
    );
  });

  test('sends status, gender, country and date range to the API', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    await user.selectOptions(screen.getByLabelText('Status'), 'Inactive');
    await waitFor(() => expect(lastQuery().status).toBe('Inactive'));

    await user.selectOptions(screen.getByLabelText('Gender'), 'Male');
    await waitFor(() => expect(lastQuery().gender).toBe('Male'));

    await waitFor(() =>
      expect(within(screen.getByLabelText('Country')).getByRole('option', { name: 'India' })).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText('Country'), 'India');
    await waitFor(() => expect(lastQuery().country).toBe('India'));

    await user.type(screen.getByLabelText(/created from/i), '2025-01-01');
    await waitFor(() => expect(lastQuery().dateFrom).toBe('2025-01-01'));

    await user.type(screen.getByLabelText(/created to/i), '2025-12-31');
    await waitFor(() => expect(lastQuery().dateTo).toBe('2025-12-31'));
  });

  test('sends the debounced search term', async () => {
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    await userEvent.type(screen.getByLabelText(/search/i), 'Rahman');

    await waitFor(() => expect(lastQuery().search).toBe('Rahman'), { timeout: 2000 });
  });

  test('clear filters resets every control', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    await user.selectOptions(screen.getByLabelText('Status'), 'Active');
    await waitFor(() => expect(lastQuery().status).toBe('Active'));

    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => expect(lastQuery().status).toBe(''));
    expect(screen.getByLabelText('Status')).toHaveValue('');
  });

  test('flags a reversed date range instead of querying the API', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    await user.type(screen.getByLabelText(/created from/i), '2025-06-01');
    await waitFor(() => expect(lastQuery().dateFrom).toBe('2025-06-01'));

    const callsBefore = reportsApi.fetchUserReport.mock.calls.length;
    await user.type(screen.getByLabelText(/created to/i), '2025-01-01');

    expect(await screen.findByText(/must be on or after the start date/i)).toBeInTheDocument();
    expect(reportsApi.fetchUserReport.mock.calls.length).toBe(callsBefore);
  });

  test('paginates the report rows', async () => {
    reportsApi.fetchUserReport.mockResolvedValue(
      reportResponse([reportRow], { total: 30, totalPages: 3, hasNextPage: true }),
    );
    render(<ReportsPage />);
    await screen.findByText('Aisha Rahman');

    await userEvent.click(screen.getByRole('button', { name: '3' }));

    await waitFor(() => expect(lastQuery().page).toBe(3));
  });
});
