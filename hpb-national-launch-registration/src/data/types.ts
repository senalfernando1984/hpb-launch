export type IdType = 'nic' | 'passport';

export interface RegistrationForm {
  title: string;
  titleOther: string;
  givenName: string;
  surname: string;
  fullName: string;
  idType: IdType;
  idNumber: string;
  issuingCountry: string;
  mobile: string;
  email: string;
  designation: string;
  institution: string;
  attendanceConfirmed: boolean;
  accuracyConfirmed: boolean;
  privacyAcknowledged: boolean;
  /** Anti-spam honeypot; must stay empty. */
  website: string;
}

export const emptyForm: RegistrationForm = {
  title: '',
  titleOther: '',
  givenName: '',
  surname: '',
  fullName: '',
  idType: 'nic',
  idNumber: '',
  issuingCountry: '',
  mobile: '',
  email: '',
  designation: '',
  institution: '',
  attendanceConfirmed: false,
  accuracyConfirmed: false,
  privacyAcknowledged: false,
  website: '',
};

export const TITLE_OPTIONS = [
  'Prof.',
  'Dr.',
  'Mr.',
  'Mrs.',
  'Ms.',
  'Rev.',
  'Ven.',
  'Hon.',
  'Other',
] as const;

export interface RegistrationSuccess {
  reference: string;
  displayName: string;
  verificationToken?: string;
}

export type FieldErrors = Partial<Record<keyof RegistrationForm, string>>;
