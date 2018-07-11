// @flow

import React from 'react';
import configureStore from 'redux-mock-store';
import { shallow } from 'enzyme';
import isEmail from 'validator/lib/isEmail';

import { LoginTabContainer } from '../../src/screens/LoginTab';

const mockStore = configureStore([]);
const initialState = {};

__DEV__ == false;

describe('LoginTab screen', () => {
  const store = mockStore(initialState);

  const wrapper = shallow(
    <LoginTabContainer dispatch={store.dispatch} loading={false} />
  );

  describe('rendering', () => {
    it('the Login should be disabled', () => {
      const emailReset = wrapper.state('emailReset');
      const loadingReset = wrapper.state('loadingReset');
      // expect(!isEmail(emailReset) || loadingReset).toBe(true);
      // console.log(wrapper.find('[testID="loginButton"]').debug());
      expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(
        true
      );
    });
  });
});
