import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Fail loudly if 5173 is taken instead of silently moving to 5174 —
    // a second dev server on a different port still passes CORS preflight
    // for scripts *served from* that port, but the backend's CORS config
    // only allows 5173, so login fails with a confusing, unexplained
    // network error. Better to refuse to start at all.
    strictPort: true,
  },
});
