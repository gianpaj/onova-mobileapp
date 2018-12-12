/** @format */
// @flow

import { AppRegistry, YellowBox } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

YellowBox.ignoreWarnings([
  // "Warning: Can't perform a React state update",
  'Require cycle',
]);

// if (__DEV__) require('./storybook');
// else
AppRegistry.registerComponent(appName, () => App);
