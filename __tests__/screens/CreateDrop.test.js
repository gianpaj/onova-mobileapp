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
          userData={{
            accountStatus: 'verified',
            mobileNumber: '380677929197',
            paymentInfo: {
              short: {
                last_four: '1111',
              },
            },
            shippingAddress: {
              firstName: 'Джанфранко',
              lastName: 'Палумбо',
              city: '8d5a980d-391c-11dd-90d9-001a92567626', // Київ
              departmentNovaposhta: '1ec09d88-e1c2-11e3-8c4a-0050568002cf', // Відділення №1: вул. Червонопрапорна, 34 (Корчувате)
            },
          }}
          token=""
        />
      );
      root = tree.root;
    });

    // TODO: test that user cannot create a drop before entering the payment and shipping info

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
      expect(root.findByProps({ testID: 'sendDropButton' }).props.disabled).toBe(true);
    });

    it('should require min 1 product', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'sendDropButton' }).props.disabled).toBe(true);
      const datetime = new Date();
      // $FlowExpectedError
      root.instance.setState({
        datetime,
        products: [
          {
            uploaded: true,
            photos: ['https://storage.googleapis.com/temp-uploads.onova.co/1537607915827.jpg'],
            key: 1,
          },
        ],
      });
      expect(root.findByProps({ testID: 'sendDropButton' }).props.disabled).toBe(false);
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
