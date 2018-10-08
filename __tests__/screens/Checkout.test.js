// @flow

import React from 'react';
import { shallow } from 'enzyme';

import { CheckoutContainer } from '../../src/screens/Checkout';

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
            last_four: '1234',
            method: 'uapay',
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
          line1: 'a',
          city: 'lviv',
        },
      });
      wrapper.find('[testID="payButton"]').simulate('press');
      expect(spy).toHaveBeenCalled();
      spy.mockClear();
    });
  });
});
