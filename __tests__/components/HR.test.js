import React from 'react';
import renderer from 'react-test-renderer';
import HR from '../../src/components/HR';

describe('HR', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<HR />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
