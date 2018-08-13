// @flow

import React from 'react';
import { shallow } from 'enzyme';
// import moxios from 'moxios';

import { LoginTabContainer } from '../../src/screens/LoginTab';

describe('LoginTab screen', () => {
  let wrapper;
  const dispatch = jest.fn(() => Promise.resolve({}));
  beforeEach(() => {
    wrapper = shallow(
      <LoginTabContainer dispatch={dispatch} loading={false} />
    );
  });

  // beforeEach(() => {
  //   moxios.install();
  // });

  // afterEach(() => {
  //   moxios.uninstall();
  // });

  it('at the beginning the Login button should NOT be enabled', () => {
    expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(true);
  });

  it('the Login button should be enabled after the email and password is entered', () => {
    wrapper.setState({ emailAddress: 'asdf@gmail.com', password: 'ab' });
    expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(false);
  });

  it('should NOT login', () => {
    wrapper.setState({
      emailAddress: 'asdf@gmail.com',
      password: 'ab',
    });
    // moxios.wait(() => {
    //   const request = moxios.requests.mostRecent();
    //   request.respondWith({
    //     status: 401,
    //     response: { ok: false },
    //   });
    // });
    wrapper
      .find('[testID="loginButton"]')
      .props()
      .onPress();
    // console.log(store.getActions());
    expect(dispatch).toHaveBeenCalled();
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
