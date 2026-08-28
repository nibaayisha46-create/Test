import { GENDERS, STATUSES } from './format.js';

/**
 * Client-side mirror of the server validation rules (backend/src/validators).
 * The API remains the source of truth — this only gives instant feedback.
 */
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{6,19}$/;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

function validateName(value, label) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < 2 || trimmed.length > 50) return `${label} must be between 2 and 50 characters`;
  if (!NAME_PATTERN.test(trimmed)) {
    return `${label} may only contain letters, spaces, apostrophes, dots and hyphens`;
  }
  return undefined;
}

function validatePassword(value) {
  if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) {
    return `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`;
  }
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
  return undefined;
}

/**
 * @param {object} values  Raw form values.
 * @param {{ isEdit?: boolean }} options  On edit, a blank password keeps the current one.
 * @returns {Record<string, string>} Errors keyed by field name.
 */
export function validateUserForm(values, { isEdit = false } = {}) {
  const errors = {};

  const firstNameError = validateName(values.first_name, 'First name');
  if (firstNameError) errors.first_name = firstNameError;

  const lastNameError = validateName(values.last_name, 'Last name');
  if (lastNameError) errors.last_name = lastNameError;

  const email = (values.email ?? '').trim();
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';
  else if (email.length > 150) errors.email = 'Email must not exceed 150 characters';

  const password = values.password ?? '';
  if (!isEdit && !password) {
    errors.password = 'Password is required';
  } else if (password) {
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
  }

  if (values.confirm_password !== undefined && password && values.confirm_password !== password) {
    errors.confirm_password = 'Passwords do not match';
  }

  const phone = (values.phone_number ?? '').trim();
  if (!phone) errors.phone_number = 'Phone number is required';
  else if (!PHONE_PATTERN.test(phone)) {
    errors.phone_number = 'Enter a valid phone number (7 to 20 digits, optional leading +)';
  }

  if (values.date_of_birth) {
    const dob = new Date(`${values.date_of_birth}T00:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) errors.date_of_birth = 'Enter a valid date';
    else if (dob.getTime() > Date.now()) errors.date_of_birth = 'Date of birth cannot be in the future';
    else if (dob.getUTCFullYear() < 1900) errors.date_of_birth = 'Date of birth must be after 1900';
  }

  if (!values.gender) errors.gender = 'Gender is required';
  else if (!GENDERS.includes(values.gender)) errors.gender = 'Select a valid gender';

  if ((values.address ?? '').length > 255) errors.address = 'Address must not exceed 255 characters';

  const city = (values.city ?? '').trim();
  if (!city) errors.city = 'City is required';
  else if (city.length < 2 || city.length > 100) errors.city = 'City must be between 2 and 100 characters';

  const country = (values.country ?? '').trim();
  if (!country) errors.country = 'Country is required';
  else if (country.length < 2 || country.length > 100) {
    errors.country = 'Country must be between 2 and 100 characters';
  }

  if (!values.status) errors.status = 'Status is required';
  else if (!STATUSES.includes(values.status)) errors.status = 'Select a valid status';

  return errors;
}
