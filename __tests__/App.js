import 'react-native';
import React from 'react';
import { Provider } from 'react-redux';

import App from '../src/App';
import configureStore from '../src/store';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

const { store } = configureStore();

it('renders correctly', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <App />
    </Provider>
  );
  expect(tree).toBeDefined();
});
