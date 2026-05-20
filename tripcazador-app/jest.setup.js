/* eslint-disable */
// Mock expo-localization para que getLocales devuelva es-ES en tests.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'es-ES', languageCode: 'es' }],
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '0.1.0',
      ios: { buildNumber: '1' },
      android: { versionCode: 1 },
      extra: {},
    },
  },
}));

// Mock SecureStore + AsyncStorage para no fallar en imports
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => null),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => null),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async () => null),
  getItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => null),
}));
