// @flow

import React from 'react';
// import configureStore from 'redux-mock-store';
import { shallow } from 'enzyme';

import { LoginTabContainer } from '../../src/screens/LoginTab';

// const mockStore = configureStore([]);
// const initialState = {};

describe('LoginTab screen', () => {
  describe('initial rendering', () => {
    const wrapper = shallow(
      <LoginTabContainer dispatch={() => {}} loading={false} />
    );
    it('at the beggining the Login button should NOT be enabled', () => {
      expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(
        true
      );
    });
  });

  describe('email and password entered', () => {
    const wrapper = shallow(
      <LoginTabContainer dispatch={() => {}} loading={false} />
    );
    wrapper.setState({ emailAddress: 'asdf@gmail.com', password: 'ab' });

    it('the Login button should be enabled', () => {
      expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(
        false
      );
    });
  });

  describe('password reset', () => {
    const dispatch = jest.fn();
    const wrapper = shallow(
      <LoginTabContainer dispatch={dispatch} loading={false} />
    );
    wrapper.setState({ emailAddress: 'asdf@gmail.com' });

    it('should be able to request a password reset entering a valid email address', () => {
      wrapper.find('[testID="openPwdResetModalButton"]').simulate('press');
      expect(wrapper.find('[testID="PwdResetModal"]').prop('visible')).toBe(
        true
      );
      expect(wrapper.find('[testID="ResetButton"]').prop('disabled')).toBe(
        false
      );
    });
  });

  describe('password reset (invalid email)', () => {
    const dispatch = jest.fn();
    const wrapper = shallow(
      <LoginTabContainer dispatch={dispatch} loading={false} />
    );
    wrapper.setState({ emailAddress: 'asdf' });

    it('should NOT be able to request a password reset entering an invalid email address', () => {
      expect(wrapper.find('[testID="ResetButton"]').prop('disabled')).toBe(
        true
      );
    });
  });
});
