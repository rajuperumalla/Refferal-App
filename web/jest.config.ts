import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next/link$': '<rootDir>/__mocks__/next/link.tsx',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.ts',
    '\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.ts',
    '\\.(png|jpg|svg|ico)$': '<rootDir>/__mocks__/fileMock.ts',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: [
    'components/**/*.tsx',
    'app/**/*.tsx',
    'lib/**/*.ts',
    '!**/*.d.ts',
  ],
};

export default config;
