/**
 * @format
 */

import { AppRegistry, YellowBox } from 'react-native';

import { bgMessaging } from './src/utils/push';
import App from './src/App';
import { name as appName } from './app.json';

// ignore specific yellowbox warnings
YellowBox.ignoreWarnings(['Require cycle:']);

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerHeadlessTask('RNFirebaseBackgroundMessage', () => bgMessaging);
