/**
 * Jest Configuration for Functional Testing
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/functional/**/*.test.js',
    '**/tests/functional/**/*.spec.js'
  ],
  setupFilesAfterEnv: [],
  testTimeout: 60000, // 60 seconds for functional tests
  verbose: true,
  maxWorkers: 2,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverage: false, // Disable coverage for functional tests
  roots: ['<rootDir>/tests/functional'],
  moduleFileExtensions: ['js', 'json']
};
