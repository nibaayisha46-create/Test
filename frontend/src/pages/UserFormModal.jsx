import { useState } from 'react';
import { ApiRequestError } from '../api/client.js';
import { createUser, updateUser } from '../api/users.js';
import { Field } from '../components/Field.jsx';
import { AlertIcon } from '../components/Icons.jsx';
import { Modal } from '../components/Modal.jsx';
import { GENDERS, STATUSES, toDateInputValue } from '../utils/format.js';
import { validateUserForm } from '../utils/validateUser.js';

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirm_password: '',
  phone_number: '',
  date_of_birth: '',
  gender: '',
  address: '',
  city: '',
  country: '',
  status: 'Active',
};

function toFormValues(user) {
  if (!user) return EMPTY_FORM;
  return {
    ...EMPTY_FORM,
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    email: user.email ?? '',
    phone_number: user.phone_number ?? '',
    date_of_birth: toDateInputValue(user.date_of_birth),
    gender: user.gender ?? '',
    address: user.address ?? '',
    city: user.city ?? '',
    country: user.country ?? '',
    status: user.status ?? 'Active',
  };
}

/** Create / edit form. `user` is null when adding. */
export function UserFormModal({ user, onClose, onSaved }) {
  const isEdit = Boolean(user);

  const [values, setValues] = useState(() => toFormValues(user));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => {
      const next = { ...current, [field]: value };
      // Re-validate a field that has already been flagged, so the error clears live.
      if (touched[field] || errors[field]) {
        const fieldErrors = validateUserForm(next, { isEdit });
        setErrors((currentErrors) => ({ ...currentErrors, [field]: fieldErrors[field] }));
      }
      return next;
    });
  };

  const handleBlur = (field) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
    const fieldErrors = validateUserForm(values, { isEdit });
    setErrors((current) => ({ ...current, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const validationErrors = validateUserForm(values, { isEdit });
    const invalidFields = Object.keys(validationErrors).filter((key) => validationErrors[key]);

    if (invalidFields.length > 0) {
      setErrors(validationErrors);
      setTouched(Object.fromEntries(invalidFields.map((field) => [field, true])));
      document.getElementById(invalidFields[0])?.focus();
      return;
    }

    const payload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      phone_number: values.phone_number.trim(),
      date_of_birth: values.date_of_birth || null,
      gender: values.gender,
      address: values.address.trim() || null,
      city: values.city.trim(),
      country: values.country.trim(),
      status: values.status,
    };

    // On edit an untouched password field means "keep the existing password".
    if (values.password) payload.password = values.password;

    setSaving(true);
    try {
      const response = isEdit ? await updateUser(user.id, payload) : await createUser(payload);
      onSaved(response.data, isEdit);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const fieldErrors = error.fieldErrors;
        if (Object.keys(fieldErrors).length > 0) setErrors((current) => ({ ...current, ...fieldErrors }));
        setFormError(error.message);
      } else {
        setFormError('Unexpected error. Please try again.');
      }
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit user' : 'Add user'}
      subtitle={
        isEdit
          ? `Update the details for ${user.first_name} ${user.last_name}`
          : 'Fill in the details below to create a new user account'
      }
      size="lg"
      onClose={saving ? () => {} : onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal__body">
          {formError ? (
            <div className="alert alert--danger" style={{ marginBottom: 18 }} role="alert">
              <AlertIcon size={16} />
              <span>{formError}</span>
            </div>
          ) : null}

          <div className="form-grid">
            <span className="fieldset-legend" style={{ marginTop: 0 }}>
              Personal details
            </span>

            <Field
              id="first_name"
              label="First name"
              required
              value={values.first_name}
              onChange={setField('first_name')}
              onBlur={handleBlur('first_name')}
              error={errors.first_name}
              placeholder="Jane"
              autoComplete="given-name"
              maxLength={50}
            />

            <Field
              id="last_name"
              label="Last name"
              required
              value={values.last_name}
              onChange={setField('last_name')}
              onBlur={handleBlur('last_name')}
              error={errors.last_name}
              placeholder="Doe"
              autoComplete="family-name"
              maxLength={50}
            />

            <Field
              id="date_of_birth"
              label="Date of birth"
              type="date"
              value={values.date_of_birth}
              onChange={setField('date_of_birth')}
              onBlur={handleBlur('date_of_birth')}
              error={errors.date_of_birth}
              max={new Date().toISOString().slice(0, 10)}
            />

            <Field
              id="gender"
              label="Gender"
              as="select"
              required
              placeholder="Select gender"
              options={GENDERS}
              value={values.gender}
              onChange={setField('gender')}
              onBlur={handleBlur('gender')}
              error={errors.gender}
            />

            <span className="fieldset-legend">Account</span>

            <Field
              id="email"
              label="Email address"
              type="email"
              required
              value={values.email}
              onChange={setField('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              placeholder="jane.doe@example.com"
              autoComplete="email"
              maxLength={150}
            />

            <Field
              id="status"
              label="Status"
              as="select"
              required
              options={STATUSES}
              value={values.status}
              onChange={setField('status')}
              onBlur={handleBlur('status')}
              error={errors.status}
            />

            <Field
              id="password"
              label="Password"
              type="password"
              required={!isEdit}
              value={values.password}
              onChange={setField('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              hint={
                isEdit
                  ? 'Leave blank to keep the current password'
                  : 'At least 8 characters, including a letter and a number'
              }
              placeholder={isEdit ? '••••••••' : ''}
              autoComplete="new-password"
            />

            <Field
              id="confirm_password"
              label="Confirm password"
              type="password"
              required={!isEdit}
              value={values.confirm_password}
              onChange={setField('confirm_password')}
              onBlur={handleBlur('confirm_password')}
              error={errors.confirm_password}
              autoComplete="new-password"
            />

            <span className="fieldset-legend">Contact</span>

            <Field
              id="phone_number"
              label="Phone number"
              required
              value={values.phone_number}
              onChange={setField('phone_number')}
              onBlur={handleBlur('phone_number')}
              error={errors.phone_number}
              placeholder="+91 98450 11223"
              autoComplete="tel"
            />

            <Field
              id="city"
              label="City"
              required
              value={values.city}
              onChange={setField('city')}
              onBlur={handleBlur('city')}
              error={errors.city}
              placeholder="Bengaluru"
              maxLength={100}
            />

            <Field
              id="country"
              label="Country"
              required
              value={values.country}
              onChange={setField('country')}
              onBlur={handleBlur('country')}
              error={errors.country}
              placeholder="India"
              maxLength={100}
            />

            <Field
              id="address"
              label="Address"
              as="textarea"
              full
              value={values.address}
              onChange={setField('address')}
              onBlur={handleBlur('address')}
              error={errors.address}
              placeholder="Street, building, landmark…"
              maxLength={255}
            />
          </div>
        </div>

        <footer className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <span className="spinner spinner--sm" /> : null}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
