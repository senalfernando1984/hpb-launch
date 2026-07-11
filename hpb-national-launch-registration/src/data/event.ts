export const AGENDA_URL =
  (import.meta.env.VITE_AGENDA_URL as string | undefined)?.trim() ||
  'https://national-launch-agenda.netlify.app';

export const siteUrl = (): string => {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (configured && configured.trim()) return configured.trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

export const TURNSTILE_SITE_KEY = (
  import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
)?.trim();

export const COLOMBO_OFFSET = '+05:30';

export const eventDetails = {
  title: 'HPB National Launch 2026',
  organiser: 'Health Promotion Bureau',
  ministry: 'Ministry of Health and Mass Media',
  theme: ['Advocate', 'Empower', 'Transform'],
  campaign: {
    titleTop: 'National',
    titleBottom: 'Launch',
    year: '2026',
    themeFrom: 'From Evidence',
    themeTo: 'to Action',
  },
  date: '15 July 2026',
  isoDate: '2026-07-15',
  /** Participants are requested to arrive by this time. */
  arrivalTime: '1.00 p.m.',
  /** The official programme commences at this time. */
  commenceTime: '1.30 p.m.',
  endTime: '5.30 p.m.',
  /** Calendar spans arrival → end. */
  calendarStart: `2026-07-15T13:00:00${COLOMBO_OFFSET}`,
  calendarEnd: `2026-07-15T17:30:00${COLOMBO_OFFSET}`,
  timezone: 'Asia/Colombo',
  venue: 'Jasmine Hall, BMICH',
  chiefGuest: {
    name: 'Hon. Dr. Harini Amarasuriya',
    designation: 'Prime Minister of Sri Lanka',
    organisation: 'Minister of Education, Higher Education and Vocational Education',
  },
  guestOfHonour: {
    name: 'Hon. Dr. Nalinda Jayatissa',
    designation: 'Minister of Health and Mass Media',
  },
} as const;

/** Toggle set from a public env var; the server remains the source of truth. */
export const registrationOpen = (): boolean => {
  const value = import.meta.env.VITE_REGISTRATION_OPEN as string | undefined;
  if (value === undefined) return true;
  return value !== 'false' && value !== '0';
};
