// @flow

import React from 'react';
import renderer from 'react-test-renderer';

import mockImagePicker from '../../__mocks__/react-native-image-crop-picker';
import mockPermissions from '../../__mocks__/react-native-permissions';
jest.mock('react-native-image-crop-picker', () => mockImagePicker);
jest.mock('react-native-permissions', () => mockPermissions);

import { AddOrEditProductScreen } from '../../src/screens/AddOrEditProduct';

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

describe('AddOrEditProduct screen (inEditMode false)', () => {
  describe('initial rendering', () => {
    let root, tree;
    beforeEach(() => {
      tree = renderer.create(
        <AddOrEditProductScreen
          dispatch={() => {}}
          // $FlowExpectedError
          navigation={{ state: {} }}
          // $FlowExpectedError
          userData={{ accountStatus: 'verified' }}
          token=""
        />
      );
      root = tree.root;
    });

    it.skip('at the beginning the Add Item button should NOT be enabled', async () => {
      await sleep(100);
      const { state } = tree.getInstance();
      expect(state.images).toMatchSnapshot();
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        true
      );
    });

    it.skip('should require a min length description', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
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
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        false
      );
    });

    it.skip('should require a category', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        true
      );
      root.instance.setState({
        description: 'this shoes rock',
        price: '123.45',
        grp_2: 0,
      });
      const grp_1_input_1 = root.findByProps({ testID: 'grp_1_input_1' });
      expect(grp_1_input_1.props.isSelected).toBe(false);
      grp_1_input_1.props.onPress(1);
      expect(grp_1_input_1.props.isSelected).toBe(true);
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        false
      );
    });

    it.skip('should require a type', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        true
      );
      root.instance.setState({
        description: 'this shoes rock',
        price: '123.45',
        grp_1: 0,
      });
      const grp_2_input_1 = root.findByProps({ testID: 'grp_2_input_1' });
      expect(grp_2_input_1.props.isSelected).toBe(false);
      grp_2_input_1.props.onPress(1);
      expect(grp_2_input_1.props.isSelected).toBe(true);
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        false
      );
    });

    it.skip('should add a new item', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        true
      );
      root.instance.setState({
        description: 'this shoes rock',
        price: '123.45',
        grp_1: 0,
        grp_2: 0,
      });
      expect(root.findByProps({ testID: 'saveButton' }).props.disabled).toBe(
        false
      );
      jest.spyOn(root.instance, 'uploadNewProduct');
      root.findByProps({ testID: 'saveButton' }).props.onPress();
      expect(root.instance.uploadNewProduct).toHaveBeenCalled();
    });
  });
});
