import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckboxField, Field } from '../components/Field';
import { AgendaButton } from '../components/Chrome';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/Icons';
import { eventDetails, registrationOpen } from '../data/event';
import { TITLE_OPTIONS, emptyForm, type FieldErrors, type RegistrationForm } from '../data/types';
import { STEP_FIELDS, validateForm, validateStep } from '../lib/validation';
import { clearDraft, loadDraft, saveDraft } from '../lib/api';
import { useRouter } from '../lib/router';

const STEP_TITLES = [
  'Personal information',
  'Identity document',
  'Contact & professional',
  'Confirmation & declaration',
];

const FIELD_LABELS: Partial<Record<keyof RegistrationForm, string>> = {
  title: 'Title', titleOther: 'Title', givenName: 'Given name', surname: 'Surname',
  fullName: 'Full name', idNumber: 'Identity number', mobile: 'Mobile number', email: 'Email',
  designation: 'Designation', institution: 'Institution',
  attendanceConfirmed: 'Attendance confirmation', accuracyConfirmed: 'Accuracy declaration',
  privacyAcknowledged: 'Privacy acknowledgement',
};

interface Props {
  form: RegistrationForm;
  setForm: (updater: (prev: RegistrationForm) => RegistrationForm) => void;
  onReview: () => void;
}

export const RegisterPage = ({ form, setForm, onReview }: Props) => {
  const { navigate } = useRouter();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showSummary, setShowSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore non-sensitive fields once on mount.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setForm((prev) => ({ ...prev, ...draft }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist non-sensitive fields as the participant types.
  useEffect(() => {
    saveDraft(form);
  }, [form]);

  // Warn before leaving if sensitive unsaved data is present.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.idNumber.trim()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form.idNumber]);

  const update = <K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isLastStep = step === STEP_TITLES.length - 1;

  const goNext = () => {
    const stepErrors = validateStep(form, step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      setShowSummary(true);
      focusFirstError(stepErrors);
      return;
    }
    setShowSummary(false);
    if (isLastStep) {
      const all = validateForm(form);
      if (Object.keys(all).length > 0) {
        setErrors(all);
        setShowSummary(true);
        return;
      }
      onReview();
      navigate('/review');
      return;
    }
    setStep((s) => s + 1);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const goBack = () => {
    if (step === 0) {
      navigate('/');
      return;
    }
    setStep((s) => s - 1);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const focusFirstError = (errs: FieldErrors) => {
    requestAnimationFrame(() => {
      const first = (STEP_FIELDS[step] ?? []).find((f) => errs[f]);
      if (first) {
        const el = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
        el?.focus();
      }
      summaryRef.current?.focus();
    });
  };

  const clearAll = () => {
    if (!window.confirm('Clear all information entered so far?')) return;
    setForm(() => ({ ...emptyForm }));
    clearDraft();
    setErrors({});
    setShowSummary(false);
    setStep(0);
  };

  const summaryItems = useMemo(
    () => Object.entries(errors).filter(([, v]) => Boolean(v)) as [keyof RegistrationForm, string][],
    [errors],
  );

  if (!registrationOpen()) {
    return (
      <div className="shell stack">
        <div className="alert alert--info" role="status">
          Registration for {eventDetails.title} is not currently open. Please check back later or
          contact the event registration team.
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <p className="eyebrow">Advance registration</p>
      <h1 className="page-title" tabIndex={-1} ref={headingRef}>
        {STEP_TITLES[step]}
      </h1>

      <div className="progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEP_TITLES.length} aria-label={`Step ${step + 1} of ${STEP_TITLES.length}`}>
        {STEP_TITLES.map((title, i) => (
          <span
            key={title}
            className={`progress__step ${i < step ? 'progress__step--done' : i === step ? 'progress__step--current' : ''}`}
          />
        ))}
      </div>
      <p className="progress__label">
        Step {step + 1} of {STEP_TITLES.length}
      </p>

      {showSummary && summaryItems.length > 0 && (
        <div className="error-summary" tabIndex={-1} ref={summaryRef} role="alert">
          <h2>Please check the following</h2>
          <ul>
            {summaryItems.map(([field, message]) => (
              <li key={field}>
                {FIELD_LABELS[field] ?? field}: {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Honeypot — must remain empty */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update('website', e.target.value)}
        />
      </div>

      {step === 0 && (
        <fieldset className="fieldset">
          <legend className="sr-only">Personal information</legend>
          <Field label="Title or salutation" error={errors.title}>
            {({ id, invalid, describedBy }) => (
              <select
                id={id}
                data-field="title"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
              >
                <option value="">Please select…</option>
                {TITLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {form.title === 'Other' && (
            <Field label="Please specify your title" error={errors.titleOther}>
              {({ id, invalid, describedBy }) => (
                <input
                  id={id}
                  data-field="titleOther"
                  className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                  aria-describedby={describedBy}
                  value={form.titleOther}
                  onChange={(e) => update('titleOther', e.target.value)}
                />
              )}
            </Field>
          )}

          <Field label="Given name" error={errors.givenName}>
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="givenName"
                autoComplete="given-name"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.givenName}
                onChange={(e) => update('givenName', e.target.value)}
              />
            )}
          </Field>

          <Field label="Surname or family name" error={errors.surname}>
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="surname"
                autoComplete="family-name"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.surname}
                onChange={(e) => update('surname', e.target.value)}
              />
            )}
          </Field>

          <Field
            label="Full name as shown on NIC or passport"
            hint="Enter your name exactly as printed on your identity document."
            error={errors.fullName}
          >
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="fullName"
                autoComplete="name"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
              />
            )}
          </Field>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="fieldset">
          <legend className="sr-only">Identity document</legend>
          <Field label="Identification type" error={errors.idType}>
            {({ id, describedBy }) => (
              <select
                id={id}
                data-field="idType"
                className="field__control"
                aria-describedby={describedBy}
                value={form.idType}
                onChange={(e) => update('idType', e.target.value as RegistrationForm['idType'])}
              >
                <option value="nic">Sri Lankan National Identity Card</option>
                <option value="passport">Passport</option>
              </select>
            )}
          </Field>

          <Field
            label={form.idType === 'nic' ? 'NIC number' : 'Passport number'}
            hint="Enter the number of the identity document that you will bring to the event."
            error={errors.idNumber}
          >
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="idNumber"
                inputMode={form.idType === 'nic' ? 'text' : 'text'}
                autoComplete="off"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.idNumber}
                onChange={(e) => update('idNumber', e.target.value)}
                placeholder={form.idType === 'nic' ? 'e.g. 199212345678 or 921234567V' : 'e.g. N1234567'}
              />
            )}
          </Field>

          <p className="field__hint">
            Please bring the original {form.idType === 'nic' ? 'National Identity Card' : 'passport'}{' '}
            corresponding to this number for verification at the reception.
          </p>

          {form.idType === 'passport' && (
            <Field label="Issuing country (optional)">
              {({ id, describedBy }) => (
                <input
                  id={id}
                  data-field="issuingCountry"
                  autoComplete="country-name"
                  className="field__control"
                  aria-describedby={describedBy}
                  value={form.issuingCountry}
                  onChange={(e) => update('issuingCountry', e.target.value)}
                />
              )}
            </Field>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="fieldset">
          <legend className="sr-only">Contact and professional information</legend>
          <Field label="Mobile contact number" error={errors.mobile}>
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="mobile"
                type="tel"
                autoComplete="tel"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="e.g. 0771234567 or +94771234567"
              />
            )}
          </Field>

          <Field label="Email address" error={errors.email}>
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="email"
                type="email"
                autoComplete="email"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            )}
          </Field>

          <Field
            label="Official designation or job title"
            hint="For example: Consultant Community Physician, Director of Education, Medical Officer."
            error={errors.designation}
          >
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="designation"
                autoComplete="organization-title"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.designation}
                onChange={(e) => update('designation', e.target.value)}
              />
            )}
          </Field>

          <Field label="Institution or organisation" error={errors.institution}>
            {({ id, invalid, describedBy }) => (
              <input
                id={id}
                data-field="institution"
                autoComplete="organization"
                className={`field__control${invalid ? ' field__control--invalid' : ''}`}
                aria-describedby={describedBy}
                value={form.institution}
                onChange={(e) => update('institution', e.target.value)}
              />
            )}
          </Field>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="fieldset">
          <legend className="sr-only">Attendance confirmation and declaration</legend>
          <CheckboxField
            checked={form.attendanceConfirmed}
            onChange={(v) => update('attendanceConfirmed', v)}
            error={errors.attendanceConfirmed}
          >
            I confirm that I plan to attend the HPB National Launch 2026 on {eventDetails.date}.
          </CheckboxField>

          <CheckboxField
            checked={form.accuracyConfirmed}
            onChange={(v) => update('accuracyConfirmed', v)}
            error={errors.accuracyConfirmed}
          >
            I confirm that the information provided is accurate. I understand that it will be used by
            authorised event personnel for advance registration, participant verification at
            reception, admission, seating arrangements, attendance management and event coordination.
          </CheckboxField>

          <CheckboxField
            checked={form.privacyAcknowledged}
            onChange={(v) => update('privacyAcknowledged', v)}
            error={errors.privacyAcknowledged}
          >
            I have read the{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              privacy notice
            </a>
            .
          </CheckboxField>
        </fieldset>
      )}

      <div className="form-nav">
        <button type="button" className="btn btn--quiet" onClick={goBack}>
          <ArrowLeftIcon />
          {step === 0 ? 'Home' : 'Back'}
        </button>
        <button type="button" className="btn btn--primary" onClick={goNext}>
          {isLastStep ? 'Review' : 'Continue'}
          <ArrowRightIcon />
        </button>
      </div>

      <div className="btn-row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
        <button type="button" className="btn btn--quiet" onClick={clearAll}>
          Clear Form
        </button>
        <AgendaButton block={false} />
      </div>
    </div>
  );
};
