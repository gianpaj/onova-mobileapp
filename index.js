// @flow

import { AppRegistry, YellowBox } from 'react-native';
import App from './src/App';

YellowBox.ignoreWarnings([
  // workaround for https://github.com/facebook/react-native/issues/18868
  'Warning: isMounted(...) is deprecated',
  // workaround until https://github.com/joltup/react-native-fetch-blob is published to npm
  'Module RNFetchBlob requires main',
  // workaround for https://github.com/facebook/react-native/issues/17504
  // until is 0.56.0 is released
  'Module RCTImageLoader requires main',
  // bug...
  'Class RCTCxxModule was not exported',
]);

AppRegistry.registerComponent('onova', () => App);
