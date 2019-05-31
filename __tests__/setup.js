import mockAsyncStorage from '@react-native-community/async-storage/jest/async-storage-mock';

global.navigator = {
  geolocation: {
    clearWatch: jest.fn(),
    // eslint-disable-next-line no-unused-vars
    getCurrentPosition: jest.fn((success, failure, options) => {
      success({
        coords: {
          longitude: 60,
          latitude: 60,
        },
      });
    }),
    stopObserving: jest.fn(),
    watchPosition: jest.fn(),
  },
};

global.FormData = function() {
  this.append = jest.fn();
};

jest.mock('NativeAnimatedHelper');

jest.mock('@pusher/chatkit-client', () => {
  class ChatManager {
    connect = jest.fn(() => Promise.resolve({}));
  }
  class TokenProvider {}
  return { ChatManager, TokenProvider };
});

jest.mock('react-native-modal-datetime-picker');

const mockNativeModules = {
  AlertManager: {
    alertWithArgs: jest.fn(),
  },
  AppState: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  AsyncLocalStorage: {
    multiGet: jest.fn((keys, callback) => process.nextTick(() => callback(null, []))),
    multiSet: jest.fn((entries, callback) => process.nextTick(() => callback(null))),
    multiRemove: jest.fn((keys, callback) => process.nextTick(() => callback(null))),
    multiMerge: jest.fn((entries, callback) => process.nextTick(() => callback(null))),
    clear: jest.fn(callback => process.nextTick(() => callback(null))),
    getAllKeys: jest.fn(callback => process.nextTick(() => callback(null, []))),
  },
};

Object.keys(mockNativeModules).forEach(module => {
  try {
    jest.doMock(module, () => mockNativeModules[module]); // needed by FacebookSDK-test
  } catch (e) {
    jest.doMock(module, () => mockNativeModules[module], { virtual: true });
  }
});

jest.doMock('NativeModules', () => mockNativeModules);
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
    View,
    Extrapolate: { CLAMP: jest.fn() },
    Transition: {
      Together: 'Together',
      Out: 'Out',
      In: 'In',
    },
    Easing: {
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
  };
});

jest.mock('@react-native-community/async-storage', () => mockAsyncStorage);
