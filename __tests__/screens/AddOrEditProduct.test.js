// @flow

import React from 'react';
import renderer from 'react-test-renderer';

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
    const tree = renderer.create(
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
      await sleep(100);
      const inst = tree.getInstance();
      expect(inst.state.location).toEqual({
        longitude: 60,
        latitude: 60,
      });
      expect(inst.state.images).toEqual([{ id: 0, url: '' }]);
      expect(
        tree.root.findByProps({ testID: 'addItemButton' }).props.disabled
      ).toBe(true);
    });

    it('should require a min length description', () => {
      const { root } = tree;
      expect(root.findByProps({ testID: 'addItemButton' }).props.disabled).toBe(
        true
      );
      root.instance.setState({
        description: 'a',
        price: '123.45',
        grp_1: 0,
        grp_2: 0,
      });
      const desc = root.findByProps({ testID: 'description' });
      expect(desc.props.value).toBe('a');
      desc.props.onChangeText('this shoes rock');
      expect(root.findByProps({ testID: 'addItemButton' }).props.disabled).toBe(
        false
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
