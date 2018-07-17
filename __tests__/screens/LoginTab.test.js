// @flow

import React from 'react';
import { shallow } from 'enzyme';

import { LoginTabContainer } from '../../src/screens/LoginTab';

describe('LoginTab screen', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(
      <LoginTabContainer dispatch={jest.fn()} loading={false} />
    );
  });

  it('at the beginning the Login button should NOT be enabled', () => {
    expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(true);
  });

  it('the Login button should be enabled after the email and password is entered', () => {
    wrapper.setState({ emailAddress: 'asdf@gmail.com', password: 'ab' });
    expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(false);
  });

  it('should be able to request a password reset entering a valid email address', () => {
    wrapper.setState({ emailAddress: 'asdf@gmail.com' });
    wrapper.find('[testID="openPwdResetModalButton"]').simulate('press');
    expect(wrapper.find('[testID="PwdResetModal"]').prop('visible')).toBe(true);
    expect(wrapper.find('[testID="ResetButton"]').prop('disabled')).toBe(false);
  });

  it('should NOT be able to request a password reset entering an invalid email address', () => {
    wrapper.setState({ emailAddress: 'asdf' });
    expect(wrapper.find('[testID="ResetButton"]').prop('disabled')).toBe(true);
  });
});
