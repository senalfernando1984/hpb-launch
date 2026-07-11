import { AgendaButton } from '../components/Chrome';
import { eventDetails } from '../data/event';
import { Link } from '../lib/router';

// Configurable placeholders — set these before the event.
const PRIVACY_CONTACT_NAME = '<PRIVACY_CONTACT_NAME>';
const PRIVACY_CONTACT_EMAIL = '<PRIVACY_CONTACT_EMAIL>';
const DATA_RETENTION_DATE = '<DATA_RETENTION_DATE>';
const EVENT_CONTACT_NUMBER = '<EVENT_CONTACT_NUMBER>';

export const PrivacyPage = () => (
  <div className="shell stack">
    <div>
      <p className="eyebrow">Privacy notice</p>
      <h1 className="page-title">How your information is used</h1>
    </div>

    <section className="card">
      <h2 className="card__heading">Why we collect this information</h2>
      <p>
        The information you provide during registration is collected by the {eventDetails.organiser},{' '}
        {eventDetails.ministry}, to facilitate:
      </p>
      <ul style={{ marginTop: 12, paddingLeft: 20, display: 'grid', gap: 6 }}>
        <li>Advance registration</li>
        <li>Participant identification and verification at reception</li>
        <li>Admission and check-in</li>
        <li>Seating arrangements</li>
        <li>Attendance recording</li>
        <li>Communication relating to the event</li>
        <li>The smooth coordination of the programme</li>
      </ul>
    </section>

    <section className="card">
      <h2 className="card__heading">What we collect</h2>
      <p>
        Your name, title, identity-document type and number, mobile number, email address, official
        designation and institution. We do not collect date of birth, home address, medical
        information, photographs, or copies of identity documents through this form.
      </p>
    </section>

    <section className="card">
      <h2 className="card__heading">Who can access it</h2>
      <p>
        Only authorised event personnel of the {eventDetails.organiser} and the reception team can
        access your information, and only for the purposes listed above. Your information is stored
        privately and is not published, shared publicly, or used for advertising. There is no public
        participant directory.
      </p>
    </section>

    <section className="card">
      <h2 className="card__heading">How long we keep it</h2>
      <p>
        Your information will be retained until <strong>{DATA_RETENTION_DATE}</strong>, after which
        it will be archived or deleted in line with the organiser’s data-retention policy.
      </p>
    </section>

    <section className="card">
      <h2 className="card__heading">Your rights and corrections</h2>
      <p>
        You may request access to, or correction of, the information you provided. To do so, or if
        you have any questions about this notice, please contact:
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>{PRIVACY_CONTACT_NAME}</strong>
        <br />
        {PRIVACY_CONTACT_EMAIL}
        <br />
        {EVENT_CONTACT_NUMBER}
      </p>
    </section>

    <p className="field__hint">
      <Link to="/register">Return to registration</Link>
    </p>
  </div>
);

export const HelpPage = () => (
  <div className="shell stack">
    <div>
      <p className="eyebrow">Help</p>
      <h1 className="page-title">Registration help</h1>
    </div>

    <section className="card">
      <h2 className="card__heading">What to bring on the day</h2>
      <p>
        Please bring the original National Identity Card or passport corresponding to the
        identification number you enter during registration. This helps the reception team verify
        your registration quickly.
      </p>
    </section>

    <section className="card">
      <h2 className="card__heading">Arrival and programme times</h2>
      <p>
        Participants are kindly requested to arrive by <strong>{eventDetails.arrivalTime}</strong> on{' '}
        {eventDetails.date}. The official programme commences at{' '}
        <strong>{eventDetails.commenceTime}</strong> and concludes at{' '}
        <strong>{eventDetails.endTime}</strong>.
      </p>
    </section>

    <section className="card">
      <h2 className="card__heading">The programme agenda</h2>
      <p style={{ marginBottom: 16 }}>
        The full programme, technical sessions and expert-panel information are available in the
        separate programme-agenda application.
      </p>
      <AgendaButton />
    </section>

    <section className="card">
      <h2 className="card__heading">A registration may already exist</h2>
      <p>
        If you see a message that a registration may already exist using your information, please
        contact the event registration team for assistance rather than submitting again.
      </p>
    </section>
  </div>
);
