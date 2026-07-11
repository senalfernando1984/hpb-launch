import type { FieldErrors, RegistrationForm } from '../data/types';

/**
 * Sri Lankan NIC:
 *  - Old format: 9 digits followed by V or X (e.g. 921234567V)
 *  - New format: 12 digits (e.g. 199212345678)
 * Normalisation strips spaces/hyphens and upper-cases the trailing letter.
 */
export const normaliseNic = (raw: string): string =>
  raw.replace(/[\s-]/g, '').toUpperCase();

export const isValidNic = (raw: string): boolean => {
  const nic = normaliseNic(raw);
  return /^[0-9]{9}[VX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
};

export const normalisePassport = (raw: string): string =>
  raw.replace(/\s/g, '').toUpperCase();

/** Deliberately permissive: passports vary worldwide. */
export const isValidPassport = (raw: string): boolean => {
  const p = normalisePassport(raw);
  return /^[A-Z0-9]{5,15}$/.test(p);
};

/** Keeps a leading + and digits; preserves country codes, strips separators. */
export const normaliseMobile = (raw: string): string => {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/[^\d]/g, '');
};

export const isValidMobile = (raw: string): boolean => {
  const m = normaliseMobile(raw);
  if (m.startsWith('+')) return /^\+\d{9,15}$/.test(m);
  return /^\d{9,12}$/.test(m);
};

export const normaliseEmail = (raw: string): string => raw.trim().toLowerCase();

export const isValidEmail = (raw: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normaliseEmail(raw));

export const isNonEmpty = (value: string, min = 1, max = 200): boolean => {
  const v = value.trim();
  return v.length >= min && v.length <= max;
};

export interface NormalisedRegistration {
  title: string;
  givenName: string;
  surname: string;
  fullName: string;
  idType: 'nic' | 'passport';
  idNumber: string;
  issuingCountry: string;
  mobile: string;
  email: string;
  designation: string;
  institution: string;
  attendanceConfirmed: boolean;
  accuracyConfirmed: boolean;
  privacyAcknowledged: boolean;
}

/** Produces the cleaned record. Assumes the input already passed validation. */
export const normaliseRegistration = (form: RegistrationForm): NormalisedRegistration => {
  const title = form.title === 'Other' ? form.titleOther.trim() : form.title;
  return {
    title,
    givenName: form.givenName.trim(),
    surname: form.surname.trim(),
    fullName: form.fullName.trim(),
    idType: form.idType,
    idNumber:
      form.idType === 'nic' ? normaliseNic(form.idNumber) : normalisePassport(form.idNumber),
    issuingCountry: form.idType === 'passport' ? form.issuingCountry.trim() : '',
    mobile: normaliseMobile(form.mobile),
    email: normaliseEmail(form.email),
    designation: form.designation.trim(),
    institution: form.institution.trim(),
    attendanceConfirmed: form.attendanceConfirmed,
    accuracyConfirmed: form.accuracyConfirmed,
    privacyAcknowledged: form.privacyAcknowledged,
  };
};

export const STEP_FIELDS: (keyof RegistrationForm)[][] = [
  ['title', 'titleOther', 'givenName', 'surname', 'fullName'],
  ['idType', 'idNumber', 'issuingCountry'],
  ['mobile', 'email', 'designation', 'institution'],
  ['attendanceConfirmed', 'accuracyConfirmed', 'privacyAcknowledged'],
];

export const validateForm = (form: RegistrationForm): FieldErrors => {
  const errors: FieldErrors = {};

  if (!form.title) errors.title = 'Please select a title.';
  if (form.title === 'Other' && !isNonEmpty(form.titleOther))
    errors.titleOther = 'Please enter your title.';
  if (!isNonEmpty(form.givenName)) errors.givenName = 'Please enter your given name.';
  if (!isNonEmpty(form.surname)) errors.surname = 'Please enter your surname.';
  if (!isNonEmpty(form.fullName, 2))
    errors.fullName = 'Please enter your full name as shown on your NIC or passport.';

  if (form.idType === 'nic') {
    if (!isNonEmpty(form.idNumber)) errors.idNumber = 'Please enter your NIC number.';
    else if (!isValidNic(form.idNumber))
      errors.idNumber = 'Please enter a valid Sri Lankan NIC number.';
  } else {
    if (!isNonEmpty(form.idNumber)) errors.idNumber = 'Please enter your passport number.';
    else if (!isValidPassport(form.idNumber))
      errors.idNumber = 'Please enter a valid passport number.';
  }

  if (!isNonEmpty(form.mobile)) errors.mobile = 'Please enter a mobile contact number.';
  else if (!isValidMobile(form.mobile))
    errors.mobile = 'Please enter a valid mobile number, including the country code if abroad.';

  if (!isNonEmpty(form.email)) errors.email = 'Please enter your email address.';
  else if (!isValidEmail(form.email)) errors.email = 'Please enter a valid email address.';

  if (!isNonEmpty(form.designation)) errors.designation = 'Please enter your official designation.';
  if (!isNonEmpty(form.institution)) errors.institution = 'Please enter your institution.';

  if (!form.attendanceConfirmed)
    errors.attendanceConfirmed = 'Please confirm that you plan to attend.';
  if (!form.accuracyConfirmed)
    errors.accuracyConfirmed = 'Please confirm the accuracy and data-use declaration.';
  if (!form.privacyAcknowledged)
    errors.privacyAcknowledged = 'Please acknowledge that you have read the privacy notice.';

  return errors;
};

export const validateStep = (form: RegistrationForm, step: number): FieldErrors => {
  const all = validateForm(form);
  const fields = STEP_FIELDS[step] ?? [];
  const scoped: FieldErrors = {};
  for (const field of fields) {
    if (all[field]) scoped[field] = all[field];
  }
  return scoped;
};
