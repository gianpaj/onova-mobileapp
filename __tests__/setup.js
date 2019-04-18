global.navigator = {
  geolocation: {
    clearWatch: jest.fn(),
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
