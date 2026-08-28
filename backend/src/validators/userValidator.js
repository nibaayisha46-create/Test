import { body, param, query } from 'express-validator';

export const GENDERS = ['Male', 'Female', 'Other'];
export const STATUSES = ['Active', 'Inactive'];

// bcrypt only considers the first 72 bytes of a password.
const MAX_PASSWORD_LENGTH = 72;
const MIN_PASSWORD_LENGTH = 8;

const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]*$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{6,19}$/;

const nameRule = (field, label) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${label} must be between 2 and 50 characters`)
    .bail()
    .matches(NAME_PATTERN)
    .withMessage(`${label} may only contain letters, spaces, apostrophes, dots and hyphens`);

const emailRule = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Enter a valid email address')
    .bail()
    .isLength({ max: 150 })
    .withMessage('Email must not exceed 150 characters')
    .customSanitizer((value) => value.toLowerCase());

const phoneRule = () =>
  body('phone_number')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .bail()
    .matches(PHONE_PATTERN)
    .withMessage('Enter a valid phone number (7 to 20 digits, optional leading +)');

const dateOfBirthRule = () =>
  body('date_of_birth')
    .optional({ values: 'falsy' })
    .isISO8601({ strict: true })
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .bail()
    .custom((value) => {
      const dob = new Date(`${value}T00:00:00.000Z`);
      if (dob.getTime() > Date.now()) throw new Error('Date of birth cannot be in the future');
      if (dob.getUTCFullYear() < 1900) throw new Error('Date of birth must be after 1900');
      return true;
    })
    .customSanitizer((value) => (value ? String(value).slice(0, 10) : null));

const genderRule = () =>
  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required')
    .bail()
    .isIn(GENDERS)
    .withMessage(`Gender must be one of: ${GENDERS.join(', ')}`);

const addressRule = () =>
  body('address')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters');

const cityRule = () =>
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters');

const countryRule = () =>
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters');

const statusRule = () =>
  body('status')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(', ')}`);

const passwordRule = (optional) => {
  const rule = body('password');
  if (optional) {
    // On update an empty password means "keep the existing one".
    rule.optional({ values: 'falsy' });
  } else {
    rule.notEmpty().withMessage('Password is required').bail();
  }
  return rule
    .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
    .withMessage(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`)
    .bail()
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .bail()
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number');
};

const sharedFieldRules = () => [
  nameRule('first_name', 'First name'),
  nameRule('last_name', 'Last name'),
  emailRule(),
  phoneRule(),
  dateOfBirthRule(),
  genderRule(),
  addressRule(),
  cityRule(),
  countryRule(),
  statusRule(),
];

export const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('User id must be a positive integer').toInt(),
];

export const createUserRules = [...sharedFieldRules(), passwordRule(false)];

export const updateUserRules = [...idParamRule, ...sharedFieldRules(), passwordRule(true)];

/** Filters shared by the users table and the report table. */
export const listQueryRules = [
  query('search').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Search term is too long'),
  query('status').optional({ values: 'falsy' }).trim().isIn(STATUSES).withMessage('Invalid status filter'),
  query('gender').optional({ values: 'falsy' }).trim().isIn(GENDERS).withMessage('Invalid gender filter'),
  query('country').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Invalid country filter'),
  query('dateFrom')
    .optional({ values: 'falsy' })
    .isISO8601({ strict: true })
    .withMessage('dateFrom must be a valid date (YYYY-MM-DD)')
    .customSanitizer((value) => String(value).slice(0, 10)),
  query('dateTo')
    .optional({ values: 'falsy' })
    .isISO8601({ strict: true })
    .withMessage('dateTo must be a valid date (YYYY-MM-DD)')
    .customSanitizer((value) => String(value).slice(0, 10))
    .bail()
    .custom((value, { req }) => {
      const from = req.query.dateFrom;
      if (from && value < String(from).slice(0, 10)) {
        throw new Error('dateTo must be on or after dateFrom');
      }
      return true;
    }),
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('page must be 1 or greater').toInt(),
  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt(),
  query('sortBy').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
  query('sortOrder').optional({ values: 'falsy' }).trim().toLowerCase().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];
