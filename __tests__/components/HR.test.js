import React from 'react';
import renderer from 'react-test-renderer';
import HR from '../../src/components/HR';

describe('HR', () => {
  it('renders correctly normal width', () => {
    const tree = renderer.create(<HR />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly full width', () => {
    const tree = renderer.create(<HR full />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
