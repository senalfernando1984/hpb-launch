import { AGENDA_URL, eventDetails } from '../data/event';
import { downloadIcs, googleCalendarUrl } from '../lib/calendar';
import { Link, type Route } from '../lib/router';
import { CalendarIcon, ClockIcon, DownloadIcon, ExternalIcon, PinIcon } from './Icons';

const EMBLEM_ALT = 'Government of Sri Lanka emblem';
const HPB_ALT = 'Health Promotion Bureau logo';

export const Crests = ({ height = 52 }: { height?: number }) => (
  <div className="crest-row">
    <img src="/assets/government-emblem.png" alt={EMBLEM_ALT} style={{ height }} />
    <img src="/assets/hpb-logo.png" alt={HPB_ALT} style={{ height }} />
  </div>
);

export const SiteHeader = () => (
  <header className="site-header">
    <div className="site-header__inner">
      <Crests />
      <p className="site-header__bureau">{eventDetails.organiser}</p>
      <p className="site-header__ministry">{eventDetails.ministry}</p>
      <p className="site-header__theme">{eventDetails.theme.join(' · ')}</p>
    </div>
  </header>
);

/** Opens the separate agenda app; never carries registration data. */
export const AgendaButton = ({ block = true }: { block?: boolean }) => (
  <a
    className={`btn btn--outline${block ? ' btn--block' : ''}`}
    href={AGENDA_URL}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ExternalIcon />
    View Programme Agenda
  </a>
);

/** Add-to-calendar + ICS. An optional reference personalises the entry only. */
export const CalendarActions = ({
  reference,
  inline = false,
}: {
  reference?: string;
  inline?: boolean;
}) => (
  <div className={`action-panel${inline ? ' action-panel--inline' : ''}`}>
    <a
      className="btn btn--outline btn--block"
      href={googleCalendarUrl(reference)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <CalendarIcon />
      Add to Google Calendar
    </a>
    <button type="button" className="btn btn--outline btn--block" onClick={() => downloadIcs(reference)}>
      <DownloadIcon />
      Download Calendar File
    </button>
  </div>
);

export const EventDetailsCard = () => (
  <section className="card" aria-labelledby="event-details-heading">
    <h2 className="card__heading" id="event-details-heading">
      Event details
    </h2>
    <div className="detail-strip">
      <div className="detail-strip__row">
        <CalendarIcon style={{ width: 20, height: 20, color: 'var(--gold)' }} />
        <span className="detail-strip__label">Date</span>
        <span className="detail-strip__value">{eventDetails.date}</span>
      </div>
      <div className="detail-strip__row">
        <ClockIcon style={{ width: 20, height: 20, color: 'var(--gold)' }} />
        <span className="detail-strip__label">Requested arrival</span>
        <span className="detail-strip__value">{eventDetails.arrivalTime}</span>
      </div>
      <div className="detail-strip__row">
        <ClockIcon style={{ width: 20, height: 20, color: 'var(--gold)' }} />
        <span className="detail-strip__label">Programme commences</span>
        <span className="detail-strip__value">{eventDetails.commenceTime}</span>
      </div>
      <div className="detail-strip__row">
        <PinIcon style={{ width: 20, height: 20, color: 'var(--gold)' }} />
        <span className="detail-strip__label">Venue</span>
        <span className="detail-strip__value">{eventDetails.venue}</span>
      </div>
    </div>
    <hr className="rule" />
    <div className="dignitaries">
      <div>
        <span className="dignitary__badge">Chief Guest</span>
        <p className="dignitary__name">{eventDetails.chiefGuest.name}</p>
        <p className="dignitary__role">{eventDetails.chiefGuest.designation}</p>
        <p className="dignitary__role">{eventDetails.chiefGuest.organisation}</p>
      </div>
      <div>
        <span className="dignitary__badge">Guest of Honour</span>
        <p className="dignitary__name">{eventDetails.guestOfHonour.name}</p>
        <p className="dignitary__role">{eventDetails.guestOfHonour.designation}</p>
      </div>
    </div>
  </section>
);

const FOOTER_LINKS: { to: Route; label: string }[] = [
  { to: '/register', label: 'Register' },
  { to: '/privacy', label: 'Privacy Notice' },
  { to: '/help', label: 'Help' },
];

export const SiteFooter = () => (
  <footer className="footer">
    <div className="shell footer__inner">
      <p className="footer__bureau">{eventDetails.organiser}</p>
      <p className="footer__ministry">{eventDetails.ministry}</p>
      <ul className="footer__links">
        {FOOTER_LINKS.map(({ to, label }) => (
          <li key={to}>
            <Link to={to}>{label}</Link>
          </li>
        ))}
        <li>
          <a href={AGENDA_URL} target="_blank" rel="noopener noreferrer">
            Programme Agenda
          </a>
        </li>
      </ul>
      <p className="footer__note">
        {eventDetails.title} · {eventDetails.date} · {eventDetails.venue}
      </p>
    </div>
  </footer>
);
