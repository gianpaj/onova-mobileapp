// @flow

import React from 'react';
import { shallow } from 'enzyme';

import { CheckoutContainer } from '../../src/screens/Checkout';

// FIXME: test actually entering text in the input fields for the shippingAddress and mobileNumber

describe('Checkout screen', () => {
  describe('initial rendering', () => {
    let wrapper, spy;
    beforeEach(() => {
      wrapper = shallow(
        <CheckoutContainer
          dispatch={() => {}}
          navigation={{ state: {}, addListener: () => null }}
          userData={{
            mobileNumber: '',
            paymentInfo: {},
            shippingAddress: {},
          }}
          token=""
        />
      );
    });

    it('at the beginning the Make Payments button should NOT appear', () => {
      expect(wrapper.find('[testID="payButton"]')).toHaveLength(0);
    });

    it('should require the shipping address', () => {
      // onCheckout function continued until the end
      spy = jest.spyOn(CheckoutContainer.prototype, 'updateShippingInfo');
      wrapper.setProps({
        userData: {
          paymentInfo: {
            short: {
              first_four: '1234',
              last_four: '1234',
            },
          },
        },
      });
      wrapper.setState({
        isLoading: false,
        shippingAddress: {},
      });
      expect(wrapper.find('[testID="payButton"]')).toHaveLength(1);
      wrapper.find('[testID="payButton"]').simulate('press');
      expect(spy).not.toHaveBeenCalled();
      wrapper.setState({
        mobileNumber: '0979878977',
        shippingAddress: {
          firstName: 'Джанфранко',
          lastName: 'Палумбо',
          city: 'Львів',
        },
      });
      wrapper.find('[testID="payButton"]').simulate('press');
      expect(spy).toHaveBeenCalled();
      spy.mockClear();
    });

    it('should require the payment info', () => {
      // onCheckout function continued until the end
      spy = jest.spyOn(CheckoutContainer.prototype, 'updateShippingInfo');
      wrapper.setState({
        isLoading: false,
        mobileNumber: '0979878977',
        shippingAddress: {
          firstName: 'Джанфранко',
          lastName: 'Палумбо',
          city: 'Львів',
        },
        paymentInfo: {},
      });
      expect(wrapper.find('[testID="payButton"]')).toHaveLength(1);
      wrapper.find('[testID="payButton"]').simulate('press');
      expect(spy).not.toHaveBeenCalled();
      wrapper.setProps({
        userData: {
          paymentInfo: {
            last_four: '1234',
          },
        },
      });
      wrapper.find('[testID="payButton"]').simulate('press');
      expect(spy).toHaveBeenCalled();
      spy.mockClear();
    });
  });
});
