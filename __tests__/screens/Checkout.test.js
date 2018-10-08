// @flow

import React from 'react';
import renderer from 'react-test-renderer';

import { CheckoutContainer } from '../../src/screens/Checkout';

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

describe('Checkout screen', () => {
  describe('initial rendering', () => {
    let root, tree;
    beforeEach(() => {
      tree = renderer.create(
        <CheckoutContainer
          dispatch={() => { }}
          // $FlowExpectedError
          navigation={{ state: {}, addListener: () => null }}
          // $FlowExpectedError
          userData={{ accountStatus: 'verified' }}
          token=""
        />
      );
      root = tree.root;
    });

    it('at the beginning the Make Payments button should NOT appear', async () => {
      await sleep(100);
      expect(() => root.findByProps({ testID: 'payButton' })).toThrow('No instances found with props: {"testID":"payButton"}');
    });

    it('should require a min length description', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'payButton' }).props.disabled).toBe(
        true
      );
      root.instance.setState({
        description: 'a',
      });
      const desc = root.findByProps({ testID: 'description' });
      expect(desc.props.value).toBe('a');
      desc.props.onChangeText('this shoes rock');
      expect(root.findByProps({ testID: 'payButton' }).props.disabled).toBe(
        false
      );
    });

    it.skip('should add a new item', async () => {
      await sleep(100);
      expect(root.findByProps({ testID: 'payButton' }).props.disabled).toBe(
        true
      );
      root.instance.setState({
        description: 'this shoes rock',
        price: '123.45',
        grp_1: 0,
        grp_2: 0,
      });
      expect(root.findByProps({ testID: 'payButton' }).props.disabled).toBe(
        false
      );
      jest.spyOn(root.instance, 'uploadNewProduct');
      root.findByProps({ testID: 'payButton' }).props.onPress();
      expect(root.instance.uploadNewProduct).toHaveBeenCalled();
    });
  });
});
