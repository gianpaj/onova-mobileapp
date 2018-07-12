// @flow

import React from 'react';
import { shallow } from 'enzyme';

import { SignUpTabContainer } from '../../src/screens/SignUpTab';

describe('SignupTab screen', () => {
  describe('initial rendering', () => {
    const wrapper = shallow(
      <SignUpTabContainer dispatch={() => {}} loading={false} />
    );
    it('at the beginning the Signup button should NOT be enabled', () => {
      expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(
        true
      );
    });
  });

  describe('email and password entered', () => {
    const wrapper = shallow(
      <SignUpTabContainer dispatch={() => {}} loading={false} />
    );

    it('the Signup button should be enabled', () => {
      wrapper.setState({
        username: 'asdf',
        emailAddress: 'asdf@gmail.com',
        password: 'abasdfasd',
      });
      expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(
        false
      );
    });

    it('the Signup button should NOT be enabled (invalid email)', () => {
      wrapper.setState({
        username: 'asdf',
        emailAddress: 'asdf',
        password: 'abasdfasd',
      });
      expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(
        true
      );
    });

    it('the Signup button should NOT be enabled (password too short)', () => {
      wrapper.setState({
        username: 'asdf',
        emailAddress: 'asdf@asdf.com',
        password: 'short',
      });
      expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(
        true
      );
    });
  });
});
