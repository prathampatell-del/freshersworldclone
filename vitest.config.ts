import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.test.ts'],
          setupFiles: ['./server/src/__tests__/setup.ts'],
          globals: false,
          testTimeout: 15000,
          hookTimeout: 30000,
          // Each suite drops/recreates its slice of schema, so run sequentially.
          fileParallelism: false,
        },
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./src/__tests__/setup.ts'],
          globals: false,
          css: false,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['server/src/**/*.ts', 'src/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**', '**/*.test.{ts,tsx}', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text', 'html'],
    },
  },
});
