jest.mock('react-native-firebase', () => {
  return {
    messaging: jest.fn(() => {
      return {
        hasPermission: jest.fn(() => Promise.resolve(true)),
        requestPermission: jest.fn(() => Promise.resolve(true)),
        subscribeToTopic: jest.fn(),
        unsubscribeFromTopic: jest.fn(),
        getToken: jest.fn(() => Promise.resolve('myMockToken')),
        onTokenRefresh: jest.fn(() => Promise.resolve('myMockTokenRefresh')),
      };
    }),
    notifications: jest.fn(() => {
      return {
        onNotification: jest.fn(),
        displayNotification: jest.fn(),
        removeDeliveredNotification: jest.fn(),
        setBadge: jest.fn(),
        getInitialNotification: jest.fn(),
        onNotificationOpened: jest.fn(),
      };
    }),
  };
});
