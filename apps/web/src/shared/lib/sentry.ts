import * as Sentry from '@sentry/react';

/**
 * Error monitoring (Prompt 45) — same disabled-when-unconfigured pattern
 * as the mock-service convention (docs/architecture/service-pattern.md):
 * an empty/unset VITE_SENTRY_DSN means Sentry.init() is simply never
 * called, so the SDK stays fully inert — no network calls, no console
 * noise, nothing to break. No real Sentry account configured yet.
 *
 * Call this once, as early as possible (main.tsx), before the app tree
 * renders — Sentry.ErrorBoundary/RouteErrorBoundary reporting downstream
 * only works if the SDK is already initialized by the time they run.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({ dsn });
}
