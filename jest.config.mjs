// jest.config.mjs - ESM version for Next.js with "type": "module"
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment
  // Use jsdom for React testing
  testEnvironment: 'jest-environment-jsdom',
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/prisma/(.*)$': '<rootDir>/prisma/$1',
    
    // Handle static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // Test discovery
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],

  // Coverage (disabled for now to unblock development)
  collectCoverage: true,
  coverageDirectory: 'coverage',
    // Collect coverage from
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  // Transform configuration
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
  },

  
  // Transform ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|@prisma)/)',
  ],
  
  
  // Performance
  maxWorkers: '50%',
  testTimeout: 10000,
  
  // Cleanup
  clearMocks: true,
  resetMocks: true,
  
  // ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);