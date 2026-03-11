require('dotenv').config({ path: '.env.test' });
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  openHandlesTimeout: 5000,
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^react$': '<rootDir>/__mocks__/react.js',
    '^expo(-.*)?$': '<rootDir>/__mocks__/expo.js',
    '^react-native-url-polyfill/auto$': '<rootDir>/__mocks__/react-native-url-polyfill.js',
  },
};
