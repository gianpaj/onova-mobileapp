import React from 'react';
import { shallow } from 'enzyme';

import HR from '../../src/components/HR';

describe('Testing HR component', () => {
  const wrapper = shallow(<HR />);

  describe('rendering', () => {
    it('Must be View', () => {
      expect(wrapper.dive().find('View')).toHaveLength(1);
    });
  });
});
