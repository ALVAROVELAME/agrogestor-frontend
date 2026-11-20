import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], maxWorkers: 2, testTimeout: 10000, env: { VITE_API_URL: 'http://localhost:3000' } },
});
