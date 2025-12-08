module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  modulePaths: ['<rootDir>/src'],
  coverageDirectory: './coverage'
};
