/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: false,
          skipLibCheck: true,
        },
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.js',
    '^react-native/(.*)$': '<rootDir>/src/__tests__/__mocks__/react-native.js',
    '^expo-constants$': '<rootDir>/src/__tests__/__mocks__/expo-constants.js',
    '^expo-router$': '<rootDir>/src/__tests__/__mocks__/expo-router.js',
    '^@react-native-google-signin/google-signin$': '<rootDir>/src/__tests__/__mocks__/google-signin.js',
    '^zustand$': '<rootDir>/src/__tests__/__mocks__/zustand.js',
    '^zustand/(.*)$': '<rootDir>/src/__tests__/__mocks__/zustand.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
