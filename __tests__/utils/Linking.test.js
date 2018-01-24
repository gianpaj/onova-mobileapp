import { call } from '../../src/utils/linking';

const callMock = jest.fn(phone => call(phone));

describe('Helper function: Linking', () => {
  // it('call() operates correctly', () => {
  //   callMock(/asdf/);
  //   expect(callMock).toHaveBeenCalledTimes(1);
  // });
});
