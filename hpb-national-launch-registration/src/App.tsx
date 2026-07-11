import { useEffect, useState } from 'react';
import { SiteFooter, SiteHeader } from './components/Chrome';
import { eventDetails } from './data/event';
import { emptyForm, type RegistrationForm, type RegistrationSuccess } from './data/types';
import { useRouter, type Route } from './lib/router';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReviewPage } from './pages/ReviewPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { HelpPage, PrivacyPage } from './pages/InfoPages';

const TITLES: Record<Route, string> = {
  '/': `${eventDetails.title} | Registration`,
  '/register': `Register | ${eventDetails.title}`,
  '/review': `Review | ${eventDetails.title}`,
  '/confirmation': `Confirmation | ${eventDetails.title}`,
  '/privacy': `Privacy Notice | ${eventDetails.title}`,
  '/help': `Help | ${eventDetails.title}`,
};

export const App = () => {
  const { route } = useRouter();
  // Identity fields live only in memory here — never persisted to storage.
  const [form, setForm] = useState<RegistrationForm>({ ...emptyForm });
  const [success, setSuccess] = useState<RegistrationSuccess | null>(null);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main className="main" id="main" tabIndex={-1}>
        {route === '/' && <LandingPage />}
        {route === '/register' && (
          <RegisterPage form={form} setForm={setForm} onReview={() => undefined} />
        )}
        {route === '/review' && <ReviewPage form={form} onSuccess={setSuccess} />}
        {route === '/confirmation' && <ConfirmationPage result={success} />}
        {route === '/privacy' && <PrivacyPage />}
        {route === '/help' && <HelpPage />}
      </main>
      <SiteFooter />
    </div>
  );
};
