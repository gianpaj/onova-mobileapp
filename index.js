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
  // bug https://github.com/facebook/react-native/pull/19880
  // should be fixed in 0.56 https://github.com/react-native-community/react-native-releases/issues/14#issuecomment-400954904
  'Class RCTCxxModule was not exported',
]);

AppRegistry.registerComponent('onova', () => App);
