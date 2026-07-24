import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    // each test should run one after the other; else setup.ts will be called multiple times which could interfere with test result
    fileParallelism:false
  },
});
