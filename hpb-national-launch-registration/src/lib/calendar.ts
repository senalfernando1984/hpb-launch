import { AGENDA_URL, eventDetails } from '../data/event';

const CAL_DESCRIPTION = (reference?: string): string => {
  const lines = [
    'HPB National Launch 2026, organised by the Health Promotion Bureau, Ministry of Health and Mass Media.',
    '',
    'Participants are kindly requested to arrive by 1.00 p.m. to facilitate registration and seating arrangements.',
    'The official programme commences at 1.30 p.m.',
    '',
    'Please bring the original National Identity Card or passport corresponding to the identification number provided during registration.',
    '',
    `Programme agenda: ${AGENDA_URL}`,
  ];
  if (reference) {
    lines.push('', `Registration reference: ${reference}`);
  }
  return lines.join('\n');
};

const pad = (n: number): string => String(n).padStart(2, '0');

const utcStamp = (iso: string): string => {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
};

/** Google Calendar template link. Dates are given in UTC (Z) which Google honours. */
export const googleCalendarUrl = (reference?: string): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventDetails.title,
    dates: `${utcStamp(eventDetails.calendarStart)}/${utcStamp(eventDetails.calendarEnd)}`,
    location: eventDetails.venue,
    details: CAL_DESCRIPTION(reference),
    ctz: eventDetails.timezone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const fold = (line: string): string => {
  if (line.length <= 74) return line;
  const parts = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    parts.push(' ' + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  if (rest.length) parts.push(' ' + rest);
  return parts.join('\r\n');
};

const esc = (v: string): string =>
  v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export const buildIcs = (reference?: string): string => {
  const uid = `hpb-national-launch-2026-${reference ?? 'event'}@hpb.health.gov.lk`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Health Promotion Bureau//HPB National Launch 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Colombo',
    'BEGIN:STANDARD',
    'DTSTART:19960525T003000',
    'TZOFFSETFROM:+0630',
    'TZOFFSETTO:+0530',
    'TZNAME:+0530',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    'DTSTART;TZID=Asia/Colombo:20260715T130000',
    'DTEND;TZID=Asia/Colombo:20260715T173000',
    fold(`SUMMARY:${esc(eventDetails.title)}`),
    fold(`LOCATION:${esc(eventDetails.venue)}`),
    fold(`DESCRIPTION:${esc(CAL_DESCRIPTION(reference))}`),
    fold(`URL:${AGENDA_URL}`),
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:HPB National Launch 2026 is tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Please arrive at Jasmine Hall, BMICH by 1.00 p.m.',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n');
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadIcs = (reference?: string): void => {
  downloadBlob(
    new Blob([buildIcs(reference)], { type: 'text/calendar;charset=utf-8' }),
    'HPB_National_Launch_2026.ics',
  );
};
