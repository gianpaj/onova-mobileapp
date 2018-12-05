// @flow

import React from 'react';
// import axios from 'axios';
import { shallow } from 'enzyme';
// import MockAdapter from 'axios-mock-adapter';

// const mock = new MockAdapter(axios);

import { SuggestionsContainer } from '../../src/screens/Suggestions';

// FIXME: test actually entering text in the input fields for the shippingAddress and mobileNumber

describe('Suggestions screen', () => {
  describe('initial rendering', () => {
    let wrapper, spy;
    beforeEach(() => {
      wrapper = shallow(
        <SuggestionsContainer
          dispatch={() => {}}
          navigation={{ state: {}, addListener: () => null }}
          userData={{}}
          token=""
        />
      );
    });

    it('should display the empty state if there are no suggestions', () => {
      // mock.onGet('/api/suggested-users').reply(200, {
      //   data: [],
      //   new: false, // doesn't matter
      // });
      expect(wrapper.find('[testID="payButton"]')).toHaveLength(0);
    });
  });
});
