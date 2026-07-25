import { useLicense } from '@/features/settings/hooks/useSettingsQueries';

/**
 * Frontend-only UX polish (Prompt 35 Part A) on top of Prompt 33's real
 * backend enforcement (EnsureLicenseActive) — the backend 403 remains the
 * actual security boundary; this just disables the button before the
 * click instead of surfacing the error after. Deliberately mirrors the
 * backend's exact trigger condition (`licenseStatus() === Expired`, not
 * Grace) — grace-period writes still work both here and on the backend.
 */
export const LICENSE_EXPIRED_MESSAGE = 'Action unavailable — subscription expired.';

export function useLicenseExpired(enabled = true): boolean {
  const licenseQuery = useLicense(enabled);
  return licenseQuery.data?.status === 'expired';
}
