import type { Config } from 'jest';

const config: Config = {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@madinatyai/common$': '<rootDir>/libs/common/src/index.ts',
    '^@madinatyai/prisma$': '<rootDir>/libs/prisma/src/index.ts',
    '^@madinatyai/tenancy$': '<rootDir>/libs/tenancy/src/index.ts',
    '^@madinatyai/ai-router$': '<rootDir>/libs/ai-router/src/index.ts',
    '^@madinatyai/kyc$': '<rootDir>/libs/kyc/src/index.ts',
    '^@madinatyai/trust-score$': '<rootDir>/libs/trust-score/src/index.ts',
    '^@madinatyai/events$': '<rootDir>/libs/events/src/index.ts',
    '^@madinatyai/tokens$': '<rootDir>/libs/tokens/src/index.ts',
    '^@madinatyai/business$': '<rootDir>/libs/business/src/index.ts',
    '^@madinatyai/logging$': '<rootDir>/libs/logging/src/index.ts',
    '^@madinatyai/logging/nest$': '<rootDir>/libs/logging/src/nest/index.ts',
    '^@madinatyai/logging/next$': '<rootDir>/libs/logging/src/next/index.ts',
    '^@madinatyai/gateway$': '<rootDir>/libs/gateway/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  collectCoverageFrom: ['libs/**/*.ts', 'apps/**/*.ts', '!**/*.spec.ts', '!**/index.ts'],
  coverageDirectory: '<rootDir>/coverage',
};

export default config;
