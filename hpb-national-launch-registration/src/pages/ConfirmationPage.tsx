import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AgendaButton, CalendarActions } from '../components/Chrome';
import { PrinterIcon } from '../components/Icons';
import { eventDetails } from '../data/event';
import type { RegistrationSuccess } from '../data/types';
import { useRouter } from '../lib/router';

interface Props {
  result: RegistrationSuccess | null;
}

export const ConfirmationPage = ({ result }: Props) => {
  const { navigate } = useRouter();
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (!result) return;
    // The QR encodes ONLY the registration reference (+ optional signed token).
    // No NIC, passport, email, mobile or personal record is ever included.
    const payload = result.verificationToken
      ? `HPB2026|${result.reference}|${result.verificationToken}`
      : `HPB2026|${result.reference}`;
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 640,
      color: { dark: '#010A2BFF', light: '#FFFFFFFF' },
    })
      .then(setQr)
      .catch(() => setQr(''));
  }, [result]);

  if (!result) {
    return (
      <div className="shell stack">
        <div className="alert alert--info" role="status">
          We could not find a recent registration in this session. If you have already registered,
          please check your confirmation email.
        </div>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
          Return to the start
        </button>
      </div>
    );
  }

  return (
    <div className="shell stack">
      <section className="confirm-banner">
        <p className="eyebrow" style={{ color: 'var(--gold-light)' }}>
          Registration successfully submitted
        </p>
        <h1>Thank you{result.displayName ? `, ${result.displayName}` : ''}</h1>
        <span className="confirm-banner__ref">{result.reference}</span>
      </section>

      <section className="card">
        <p>
          Your advance registration has been successfully submitted. Please arrive at{' '}
          <strong>{eventDetails.venue}</strong> by <strong>{eventDetails.arrivalTime}</strong> on{' '}
          <strong>{eventDetails.date}</strong> to facilitate a smooth registration process and
          seating arrangements.
        </p>
        <p style={{ marginTop: 12 }}>
          The official programme will commence at <strong>{eventDetails.commenceTime}</strong>.
        </p>
        <p style={{ marginTop: 12 }}>
          Please bring the original National Identity Card or passport corresponding to the
          identification number provided during registration.
        </p>
      </section>

      <section className="card" aria-labelledby="qr-heading">
        <h2 className="card__heading" id="qr-heading">
          Your check-in code
        </h2>
        <p className="field__hint" style={{ marginBottom: 16 }}>
          Present this code at the reception for faster check-in. It contains only your registration
          reference — no personal information.
        </p>
        {qr && (
          <div className="qr-frame">
            <img src={qr} alt={`Check-in QR code for registration ${result.reference}`} />
          </div>
        )}
      </section>

      <section aria-labelledby="next-heading">
        <h2 id="next-heading" className="card__heading">
          Save the event
        </h2>
        <div className="action-panel action-panel--inline">
          <AgendaButton />
          <CalendarActions reference={result.reference} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn--outline btn--block" onClick={() => window.print()}>
            <PrinterIcon />
            Save or print confirmation
          </button>
        </div>
      </section>

      <p className="field__hint">
        View the complete programme agenda, technical sessions and expert-panel information using the
        button above.
      </p>
    </div>
  );
};
