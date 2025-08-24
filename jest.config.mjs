// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  testEnvironment: 'jsdom', // Corrected to 'jsdom'
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // เพิ่มส่วนนี้เพื่อสร้าง Test Report ด้วย Jest-Junit และ LCOV
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  reporters: ['default', ['jest-junit', {
    outputDirectory: 'test-results',
    outputName: 'junit.xml',
  }]],
};

export default createJestConfig(customJestConfig);