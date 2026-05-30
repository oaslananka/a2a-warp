import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@oaslananka/a2a-warp-core': path.resolve(__dirname, 'packages/core-types/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    env: {
      LOG_LEVEL: 'silent',
    },
    setupFiles: ['./tests/setup/logging.ts'],
    pool: 'forks',
    maxWorkers: 4,
    testTimeout: 15000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary', 'html'],
      include: [
        'packages/core/src/**/*.ts',
        'packages/adapters/src/**/*.ts',
        'packages/client/src/**/*.ts',
        'packages/transport-ws/src/**/*.ts',
        'packages/transport-grpc/src/**/*.ts',
        'packages/create-a2a-agent/src/**/*.ts',
        'packages/registry/src/**/*.ts',
        'packages/testing/src/**/*.ts',
        'cli/src/**/*.ts',
      ],
      exclude: [
        'apps/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/index.ts',
        '**/dist/**',
        'packages/core/src/storage/ITaskStorage.ts',
        'packages/core/src/types/auth.ts',
        'packages/core/src/types/extensions.ts',
        'packages/core/src/types/task.ts',
        'packages/registry/src/storage/IAgentStorage.ts',
      ],
      thresholds: {
        statements: 87,
        branches: 77,
        functions: 90,
        lines: 88,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/*/tests/**/*.test.ts', 'cli/tests/**/*.test.ts'],
          exclude: ['tests/integration/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 15000,
        },
      },
      {
        extends: true,
        test: {
          name: 'transport-contract',
          include: ['tests/transport-contract/**/*.test.ts'],
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 15000,
        },
      },
      {
        extends: true,
        test: {
          name: 'conformance',
          include: ['tests/conformance/**/*.test.ts'],
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 15000,
        },
      },
    ],
  },
});
