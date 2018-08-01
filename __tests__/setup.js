import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

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
