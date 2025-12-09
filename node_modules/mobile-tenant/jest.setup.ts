import '@testing-library/jest-native/extend-expect';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
jest.mock('expo-camera', () => require('expo-camera/mockCamera')); 
jest.mock('expo-file-system', () => ({
  uploadAsync: jest.fn(() => Promise.resolve({ status: 200, body: '{}' })),
}));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
