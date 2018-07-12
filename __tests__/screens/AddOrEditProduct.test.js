// @flow

import React from 'react';
import { shallow } from 'enzyme';

import mockImagePicker from '../../__mocks__/react-native-image-crop-picker';
jest.mock('react-native-image-crop-picker', () => mockImagePicker);
import mockPermissions from '../../__mocks__/react-native-permissions';
jest.mock('react-native-permissions', () => mockPermissions);

import { AddOrEditProductScreen } from '../../src/screens/AddOrEditProduct';

describe('AddOrEditProduct screen', () => {
  describe('initial rendering', () => {
    const wrapper = shallow(
      // $FlowExpectedError
      <AddOrEditProductScreen
        dispatch={() => {}}
        // $FlowExpectedError
        userData={{ accountStatus: 'verified' }}
        isFocused={false}
      />
    );
    it('at the beginning the Add Item button should NOT be enabled', () => {
      setTimeout(() => {
        expect(wrapper.state('location')).toEqual({
          longitude: 60,
          latitude: 60,
        });
      }, 100);
      expect(wrapper.find('[testID="addItemButton"]').prop('disabled')).toBe(
        true
      );
    });
  });

  // describe('email and password entered', () => {
  //   const wrapper = shallow(
  //     <AddOrEditProductScreen dispatch={() => {}} loading={false} />
  //   );
  //   wrapper.setState({ emailAddress: 'asdf@gmail.com', password: 'ab' });

  //   it('the Login button should be enabled', () => {
  //     expect(wrapper.find('[testID="loginButton"]').prop('disabled')).toBe(
  //       false
  //     );
  //   });
  // });

  // describe('password reset', () => {
  //   const dispatch = jest.fn();
  //   const wrapper = shallow(
  //     <AddOrEditProductScreen dispatch={dispatch} loading={false} />
  //   );
  //   wrapper.setState({ emailAddress: 'asdf@gmail.com' });

  //   it('should be able to request a password reset entering a valid email address', () => {
  //     wrapper.find('[testID="openPwdResetModalButton"]').simulate('press');
  //     expect(wrapper.find('[testID="PwdResetModal"]').prop('visible')).toBe(
  //       true
  //     );
  //     expect(wrapper.find('[testID="ResetButton"]').prop('disabled')).toBe(
  //       false
  //     );
  //   });
  // });
});
