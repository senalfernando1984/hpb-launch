import { AgendaButton, CalendarActions, EventDetailsCard } from '../components/Chrome';
import { ArrowRightIcon } from '../components/Icons';
import { eventDetails } from '../data/event';
import { Link } from '../lib/router';

export const LandingPage = () => (
  <div className="shell stack">
    <section className="hero" aria-labelledby="page-title">
      <div className="hero__arcs" aria-hidden="true" />
      <div className="hero__inner">
        <h1 className="hero__title" id="page-title">
          <span>{eventDetails.campaign.titleTop}</span>
          <span className="is-gold">{eventDetails.campaign.titleBottom}</span>
        </h1>
        <p className="hero__year">{eventDetails.campaign.year}</p>

        <div className="hero__theme">
          <p className="hero__theme-line">
            <span>{eventDetails.campaign.themeFrom}</span>
            <span className="hero__arrow" aria-hidden="true" />
            <span className="is-gold">{eventDetails.campaign.themeTo}</span>
          </p>
        </div>
      </div>
    </section>

    <section>
      <p className="eyebrow">Advance registration required</p>
      <h2 className="page-title" style={{ fontSize: '1.5rem', marginTop: 8 }}>
        Registration for the National Launch
      </h2>
      <p className="lead">
        All invited participants are kindly requested to complete this registration in advance, to
        support a smooth registration process, participant identification at reception, seating
        arrangements and the efficient coordination of the programme.
      </p>
    </section>

    <section aria-labelledby="register-heading">
      <h2 id="register-heading" className="sr-only">
        Register
      </h2>
      <div className="actions">
        <Link to="/register" className="btn btn--primary btn--block">
          Register for the Event
          <ArrowRightIcon />
        </Link>
      </div>
    </section>

    <EventDetailsCard />

    <section className="card card--notice" aria-labelledby="note-heading">
      <h2 id="note-heading" className="card__heading" style={{ fontSize: '1rem' }}>
        Please note
      </h2>
      <ul className="point-list">
        <li>
          Arrive at <strong>{eventDetails.venue}</strong> by{' '}
          <strong>{eventDetails.arrivalTime}</strong> on <strong>{eventDetails.date}</strong>.
        </li>
        <li>
          The official programme commences at <strong>{eventDetails.commenceTime}</strong>.
        </li>
        <li>
          Bring the original National Identity Card or passport matching the number you enter in the
          form.
        </li>
        <li>
          Registering in advance lets the reception team verify you quickly and guide you to your
          seating area.
        </li>
      </ul>
    </section>

    <section aria-labelledby="save-heading">
      <h2 id="save-heading" className="sr-only">
        Programme and calendar
      </h2>
      <p className="lead" style={{ marginBottom: 12, fontSize: '0.9rem' }}>
        You may also review the programme agenda or save the event and requested arrival time to your
        calendar.
      </p>
      <div className="action-panel action-panel--inline">
        <AgendaButton />
        <CalendarActions />
      </div>
      <p className="field__hint" style={{ marginTop: 8 }}>
        View the complete programme agenda, technical sessions and expert-panel information.
      </p>
    </section>

    <p className="field__hint">
      Read our <Link to="/privacy">privacy notice</Link> to understand how your information is used,
      or visit <Link to="/help">Help</Link> if you have questions.
    </p>
  </div>
);
