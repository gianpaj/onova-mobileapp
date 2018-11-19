// @flow

import React from 'react';
import { shallow } from 'enzyme';

import { SignUpTabContainer } from '../../src/screens/SignUpTab';

describe('SignupTab screen', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(
      <SignUpTabContainer dispatch={jest.fn()} loading={false} />
    );
  });

  it.skip('at the beginning the Signup button should NOT be enabled', () => {
    expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(true);
  });

  it.skip('the Signup button should be enabled', () => {
    wrapper.setState({
      username: 'asdf',
      emailAddress: 'asdf@gmail.com',
      password: 'abasdfasd',
    });
    expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(
      false
    );
  });

  it.skip('the Signup button should NOT be enabled (invalid email)', () => {
    wrapper.setState({
      username: 'asdf',
      emailAddress: 'asdf',
      password: 'abasdfasd',
    });
    expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(true);
  });

  it.skip('the Signup button should NOT be enabled (password too short)', () => {
    wrapper.setState({
      username: 'asdf',
      emailAddress: 'asdf@asdf.com',
      password: 'short',
    });
    expect(wrapper.find('[testID="signUpButton"]').prop('disabled')).toBe(true);
  });
});
