import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiRequestError } from '../src/api/client.js';
import * as usersApi from '../src/api/users.js';
import { ToastProvider } from '../src/components/Toast.jsx';
import { UsersPage } from '../src/pages/UsersPage.jsx';

vi.mock('../src/api/users.js', () => ({
  fetchUsers: vi.fn(),
  fetchUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

const sampleUser = {
  id: 1,
  first_name: 'Aisha',
  last_name: 'Rahman',
  email: 'aisha.rahman@example.com',
  phone_number: '+91 98450 11223',
  date_of_birth: '1995-04-12',
  gender: 'Female',
  address: '14 Brigade Road',
  city: 'Bengaluru',
  country: 'India',
  status: 'Active',
  created_date: '2025-01-10T09:30:00.000Z',
  updated_date: '2025-02-02T11:00:00.000Z',
};

const secondUser = {
  ...sampleUser,
  id: 2,
  first_name: 'Daniel',
  last_name: 'Okonkwo',
  email: 'daniel.okonkwo@example.com',
  gender: 'Male',
  city: 'Lagos',
  country: 'Nigeria',
  status: 'Inactive',
};

function listResponse(data = [sampleUser, secondUser], overrides = {}) {
  return {
    success: true,
    data,
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

const renderPage = () =>
  render(
    <ToastProvider>
      <UsersPage />
    </ToastProvider>,
  );

/** Last set of query params the page sent to the API. */
const lastQuery = () => usersApi.fetchUsers.mock.calls.at(-1)[0];

beforeEach(() => {
  usersApi.fetchUsers.mockResolvedValue(listResponse());
});

describe('Users table', () => {
  test('renders every required column and the user rows', async () => {
    renderPage();

    expect(await screen.findByText('Aisha Rahman')).toBeInTheDocument();

    for (const column of [
      'Name',
      'Email',
      'Phone number',
      'Gender',
      'City',
      'Country',
      'Status',
      'Created date',
      'Updated date',
      'Actions',
    ]) {
      expect(screen.getByRole('columnheader', { name: new RegExp(column, 'i') })).toBeInTheDocument();
    }

    const row = screen.getByText('Aisha Rahman').closest('tr');
    expect(within(row).getByText('aisha.rahman@example.com')).toBeInTheDocument();
    expect(within(row).getByText('+91 98450 11223')).toBeInTheDocument();
    expect(within(row).getByText('Female')).toBeInTheDocument();
    expect(within(row).getByText('Bengaluru')).toBeInTheDocument();
    expect(within(row).getByText('India')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
  });

  test('never renders a password value', async () => {
    renderPage();
    await screen.findByText('Aisha Rahman');

    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
  });

  test('shows an empty state when there are no users', async () => {
    usersApi.fetchUsers.mockResolvedValue(listResponse([], { total: 0, totalPages: 0 }));
    renderPage();

    expect(await screen.findByText('No users yet')).toBeInTheDocument();
  });

  test('shows an error state and can retry when the API fails', async () => {
    usersApi.fetchUsers.mockRejectedValueOnce(new ApiRequestError('Unable to reach the server.', { status: 0 }));
    renderPage();

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();

    usersApi.fetchUsers.mockResolvedValue(listResponse());
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Aisha Rahman')).toBeInTheDocument();
  });
});

describe('Search, filters and pagination', () => {
  test('sends the debounced search term to the API', async () => {
    renderPage();
    await screen.findByText('Aisha Rahman');

    await userEvent.type(screen.getByLabelText(/search/i), 'Daniel');

    await waitFor(() => expect(lastQuery().search).toBe('Daniel'), { timeout: 2000 });
  });

  test('applies the status and gender filters', async () => {
    renderPage();
    await screen.findByText('Aisha Rahman');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Inactive');
    await waitFor(() => expect(lastQuery().status).toBe('Inactive'));

    await userEvent.selectOptions(screen.getByLabelText('Gender'), 'Male');
    await waitFor(() => expect(lastQuery().gender).toBe('Male'));

    // Filtering resets back to the first page.
    expect(lastQuery().page).toBe(1);
  });

  test('clear filters resets the query', async () => {
    renderPage();
    await screen.findByText('Aisha Rahman');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Active');
    await waitFor(() => expect(lastQuery().status).toBe('Active'));

    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    await waitFor(() => expect(lastQuery().status).toBe(''));
  });

  test('requests the next page when a page button is clicked', async () => {
    usersApi.fetchUsers.mockResolvedValue(
      listResponse([sampleUser], { total: 25, totalPages: 3, hasNextPage: true }),
    );
    renderPage();
    await screen.findByText('Aisha Rahman');

    await userEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => expect(lastQuery().page).toBe(2));
  });

  test('sorting a column flips the sort order', async () => {
    renderPage();
    await screen.findByText('Aisha Rahman');

    await userEvent.click(screen.getByRole('columnheader', { name: /email/i }));
    await waitFor(() => expect(lastQuery().sortBy).toBe('email'));
    expect(lastQuery().sortOrder).toBe('asc');

    await userEvent.click(screen.getByRole('columnheader', { name: /email/i }));
    await waitFor(() => expect(lastQuery().sortOrder).toBe('desc'));
  });
});

describe('View user', () => {
  test('opens the details dialog without exposing a password', async () => {
    renderPage();
    await screen.findByText('Aisha Rahman');

    await userEvent.click(screen.getByRole('button', { name: /view aisha rahman/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('14 Brigade Road')).toBeInTheDocument();
    expect(within(dialog).getByText('aisha.rahman@example.com')).toBeInTheDocument();
    expect(within(dialog).queryByText(/password/i)).not.toBeInTheDocument();
  });
});

describe('Create user', () => {
  /** The page and the dialog both have Gender/Status controls, so scope to the dialog. */
  async function fillValidForm(user) {
    const form = within(screen.getByRole('dialog'));
    await user.type(form.getByLabelText(/first name/i), 'Grace');
    await user.type(form.getByLabelText(/last name/i), 'Mwangi');
    await user.type(form.getByLabelText(/email address/i), 'grace.mwangi@example.com');
    await user.selectOptions(form.getByLabelText(/gender/i), 'Female');
    await user.type(form.getByLabelText('Password*'), 'Password123');
    await user.type(form.getByLabelText(/confirm password/i), 'Password123');
    await user.type(form.getByLabelText(/phone number/i), '+254 722 118 440');
    await user.type(form.getByLabelText(/^city/i), 'Nairobi');
    await user.type(form.getByLabelText(/^country/i), 'Kenya');
  }

  test('blocks submission and reports required fields when the form is empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(usersApi.createUser).not.toHaveBeenCalled();
  });

  test('rejects an invalid email format', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(usersApi.createUser).not.toHaveBeenCalled();
  });

  test('rejects a weak password and a mismatched confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    await user.type(screen.getByLabelText('Password*'), 'abc');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText(/password must be between 8 and 72 characters/i)).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(usersApi.createUser).not.toHaveBeenCalled();
  });

  test('submits a valid form and confirms with a toast', async () => {
    const user = userEvent.setup();
    usersApi.createUser.mockResolvedValue({
      success: true,
      data: { ...sampleUser, id: 3, first_name: 'Grace', last_name: 'Mwangi' },
    });

    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => expect(usersApi.createUser).toHaveBeenCalledTimes(1));

    const payload = usersApi.createUser.mock.calls[0][0];
    expect(payload).toMatchObject({
      first_name: 'Grace',
      last_name: 'Mwangi',
      email: 'grace.mwangi@example.com',
      gender: 'Female',
      city: 'Nairobi',
      country: 'Kenya',
      status: 'Active',
      password: 'Password123',
    });
    // The confirmation field is a UI-only concern.
    expect(payload.confirm_password).toBeUndefined();

    expect(await screen.findByText(/grace mwangi was created successfully/i)).toBeInTheDocument();
  });

  test('surfaces a duplicate-email conflict from the API on the email field', async () => {
    const user = userEvent.setup();
    usersApi.createUser.mockRejectedValue(
      new ApiRequestError('A user with this email address already exists', {
        status: 409,
        errors: [{ field: 'email', message: 'This email address is already registered' }],
      }),
    );

    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /add user/i }));
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    expect(await screen.findByText('This email address is already registered')).toBeInTheDocument();
    // The dialog stays open so the user can correct the value.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Edit user', () => {
  test('pre-fills the form and sends the changes', async () => {
    const user = userEvent.setup();
    usersApi.updateUser.mockResolvedValue({
      success: true,
      data: { ...sampleUser, city: 'Chennai' },
    });

    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /edit aisha rahman/i }));

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Aisha');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('aisha.rahman@example.com');
    expect(screen.getByLabelText(/^city/i)).toHaveValue('Bengaluru');

    const cityInput = screen.getByLabelText(/^city/i);
    await user.clear(cityInput);
    await user.type(cityInput, 'Chennai');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(usersApi.updateUser).toHaveBeenCalledTimes(1));

    const [id, payload] = usersApi.updateUser.mock.calls[0];
    expect(id).toBe(1);
    expect(payload.city).toBe('Chennai');
    // A blank password field must not send a password at all.
    expect(payload.password).toBeUndefined();

    expect(await screen.findByText(/was updated successfully/i)).toBeInTheDocument();
  });

  test('sends a new password only when one is typed', async () => {
    const user = userEvent.setup();
    usersApi.updateUser.mockResolvedValue({ success: true, data: sampleUser });

    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /edit aisha rahman/i }));
    await user.type(screen.getByLabelText('Password'), 'BrandNew456');
    await user.type(screen.getByLabelText(/confirm password/i), 'BrandNew456');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(usersApi.updateUser).toHaveBeenCalledTimes(1));
    expect(usersApi.updateUser.mock.calls[0][1].password).toBe('BrandNew456');
  });
});

describe('Delete user', () => {
  test('asks for confirmation and does nothing when cancelled', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /delete aisha rahman/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /^cancel$/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(usersApi.deleteUser).not.toHaveBeenCalled();
  });

  test('deletes the user on confirmation and reloads the list', async () => {
    const user = userEvent.setup();
    usersApi.deleteUser.mockResolvedValue({ success: true, data: { id: 1 } });

    renderPage();
    await screen.findByText('Aisha Rahman');
    const callsBefore = usersApi.fetchUsers.mock.calls.length;

    await user.click(screen.getByRole('button', { name: /delete aisha rahman/i }));
    await user.click(await screen.findByRole('button', { name: /delete user/i }));

    await waitFor(() => expect(usersApi.deleteUser).toHaveBeenCalledWith(1));
    expect(await screen.findByText(/aisha rahman was deleted/i)).toBeInTheDocument();
    await waitFor(() => expect(usersApi.fetchUsers.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  test('reports a failed delete without closing the list', async () => {
    const user = userEvent.setup();
    usersApi.deleteUser.mockRejectedValue(new ApiRequestError('No user found with id 1', { status: 404 }));

    renderPage();
    await screen.findByText('Aisha Rahman');

    await user.click(screen.getByRole('button', { name: /delete aisha rahman/i }));
    await user.click(await screen.findByRole('button', { name: /delete user/i }));

    expect(await screen.findByText('No user found with id 1')).toBeInTheDocument();
  });
});
