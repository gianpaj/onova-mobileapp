// @flow

import React from 'react';
import { shallow } from 'enzyme';

import mockImagePicker from '../../__mocks__/react-native-image-crop-picker';
jest.mock('react-native-image-crop-picker', () => mockImagePicker);
import mockPermissions from '../../__mocks__/react-native-permissions';
jest.mock('react-native-permissions', () => mockPermissions);

import { AddOrEditProductScreen } from '../../src/screens/AddOrEditProduct';

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

describe('AddOrEditProduct screen (inEditMode false)', () => {
  describe('initial rendering', () => {
    const wrapper = shallow(
      <AddOrEditProductScreen
        dispatch={() => {}}
        // $FlowExpectedError
        navigation={{ state: {} }}
        // $FlowExpectedError
        userData={{ accountStatus: 'verified' }}
        token=""
      />
    );

    it('at the beginning the Add Item button should NOT be enabled', async () => {
      await wrapper.instance().componentDidMount();
        expect(wrapper.state('location')).toEqual({
          longitude: 60,
          latitude: 60,
        });
      await sleep(100);
        expect(wrapper.state('images')).toEqual([{ id: 0, url: '' }]);
      }, 100);
      expect(wrapper.find('[testID="addItemButton"]').prop('disabled')).toBe(
        true
      );
    });

    it.skip('should require a min length description', () => {
      wrapper.setState(
        {
          description: 'a',
          price: '123.45',
          grp_1: 0,
          grp_2: 0,
        },
        () => {
          // console.log(wrapper.state());

          // const state = wrapper.state();
          // console.log(addEnabled(state));
          expect(
            wrapper.find('[testID="addItemButton"]').prop('disabled')
          ).toBe(true);
        }
      );
    });
  });

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
