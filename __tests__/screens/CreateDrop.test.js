// @flow

import React from 'react';
import renderer from 'react-test-renderer';

import mockPermissions from '../../__mocks__/react-native-permissions';
jest.mock('react-native-permissions', () => mockPermissions);

import { CreateDropScreen } from '../../src/screens/CreateDrop';

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

describe('CreateDrop screen', () => {
  describe('initial rendering', () => {
    let root, tree;
    beforeEach(() => {
      tree = renderer.create(
        <CreateDropScreen
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

    it('at the beginning the Create Drop button should NOT be enabled', async () => {
      await sleep(100);
      // $FlowExpectedError
      const { state } = tree.getInstance();
      // $FlowExpectedError
      expect(state.location).toEqual({
        longitude: 60,
        latitude: 60,
      });
      // $FlowExpectedError
      expect(state.images).toMatchSnapshot();
      expect(
        root.findByProps({ testID: 'sendDropButton' }).props.disabled
      ).toBe(true);
    });

    it('should require min 1 product', async () => {
      await sleep(100);
      expect(
        root.findByProps({ testID: 'sendDropButton' }).props.disabled
      ).toBe(true);
      const datetime = new Date();
      // $FlowExpectedError
      root.instance.setState({
        datetime,
        products: [
          {
            uploaded: true,
            photos: [
              'https://storage.googleapis.com/temp-uploads.onova.co/1537607915827.jpg',
            ],
            key: 1,
          },
        ],
      });
      expect(
        root.findByProps({ testID: 'sendDropButton' }).props.disabled
      ).toBe(false);
    });

    // it.skip('should add a new item', async () => {
    //   await sleep(100);
    //   expect(
    //     root.findByProps({ testID: 'sendDropButton' }).props.disabled
    //   ).toBe(true);
    //   root.instance.setState({
    //     description: 'this shoes rock',
    //     price: '123.45',
    //     grp_1: 0,
    //     grp_2: 0,
    //   });
    //   expect(
    //     root.findByProps({ testID: 'sendDropButton' }).props.disabled
    //   ).toBe(false);
    //   jest.spyOn(root.instance, 'uploadNewProduct');
    //   root.findByProps({ testID: 'sendDropButton' }).props.onPress();
    //   expect(root.instance.uploadNewProduct).toHaveBeenCalled();
    // });
  });
});
