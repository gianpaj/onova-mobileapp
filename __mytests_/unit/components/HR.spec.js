import React from 'react';
import { shallow } from 'enzyme';

import HR from '../../../src/components/HR';

describe('Testing HR component', () => {
  const onPress = jest.fn();
  const createTestProps = props => {
    return {
      onPress,
      ...props,
    };
  };
  const createWrapper = props => shallow(<HR {...props} />);

  let wrapper;
  describe('rendering', () => {
    beforeEach(() => {
      props = createTestProps({ full: true });
      wrapper = createWrapper(props);
    });
    it('Must be View', () => {
      expect(wrapper.find('View')).toHaveLength(1);
    });
  });
});
