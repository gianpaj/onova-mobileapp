import React from 'react';
import { shallow } from 'enzyme';

import HR from '../../src/components/HR';

describe('Testing HR component', () => {
  const createTestProps = props => {
    return {
      ...props,
    };
  };
  // const createWrapper = props => shallow(<HR {...props} />);
  const wrapper = shallow(<HR />);

  // let wrapper;
  describe('rendering', () => {
    // beforeEach(() => {
    //   const props = createTestProps({ full: true });
    //   wrapper = createWrapper(props);
    // });
    it('Must be View', () => {
      expect(wrapper.dive().find('View')).toHaveLength(1);
    });
  });
});
