import type { Config } from 'jest';

const config: Config = {
  displayName: 'e2e',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/apps/core-hub'],
  testMatch: ['**/*.e2e-spec.ts'],
  moduleNameMapper: {
    '^@madinatyai/common$': '<rootDir>/libs/common/src/index.ts',
    '^@madinatyai/prisma$': '<rootDir>/libs/prisma/src/index.ts',
    '^@madinatyai/tenancy$': '<rootDir>/libs/tenancy/src/index.ts',
    '^@madinatyai/ai-router$': '<rootDir>/libs/ai-router/src/index.ts',
    '^@madinatyai/kyc$': '<rootDir>/libs/kyc/src/index.ts',
    '^@madinatyai/trust-score$': '<rootDir>/libs/trust-score/src/index.ts',
    '^@madinatyai/events$': '<rootDir>/libs/events/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  testTimeout: 30000,
};

export default config;
