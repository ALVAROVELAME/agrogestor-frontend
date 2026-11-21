import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    maxWorkers: 2,
    testTimeout: 10000,
    env: { VITE_API_URL: 'http://localhost:3000' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/types/**'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
