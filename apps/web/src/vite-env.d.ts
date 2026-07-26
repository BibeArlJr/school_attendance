/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK_NOTIFICATIONS: string;
  readonly VITE_USE_MOCK_GATE_FEED: string;
  /** Empty/unset = Sentry.init() is never called (Prompt 45). */
  readonly VITE_SENTRY_DSN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
