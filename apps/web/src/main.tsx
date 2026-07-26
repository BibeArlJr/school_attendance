import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initSentry } from './shared/lib/sentry';
import './styles/globals.css';

// No-op with no VITE_SENTRY_DSN configured (Prompt 45) — must run before
// the app tree renders so RouteErrorBoundary's Sentry.captureException
// calls have an initialized SDK to report into.
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
