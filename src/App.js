// @flow

import React from 'react';

// eslint-disable-next-line import/default
import codePush from 'react-native-code-push';
import { ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Root } from 'native-base';
import { Sentry } from 'react-native-sentry';
import Analytics, { AnalyticsConstants } from 'react-native-analytics-segment-io';

import configureStore from './store';
import AppNavigation from './navigation';
import colors from './config/colors';
import { analyticsEnabled, config } from './utils/api';

export const { store, persistor } = configureStore();
const segmentOptions = {
  // track app lifecycle events such as "Application Installed", "Application Updated" and "Application Opened".
  [AnalyticsConstants.trackApplicationLifecycleEvents]: true,
  [AnalyticsConstants.enableAdvertisingTracking]: false,
};

class App extends React.Component<*> {
  constructor() {
    super();

    if (analyticsEnabled) {
      Sentry.config(config.SENTRY_URL).install();
      Sentry.captureBreadcrumb({
        category: 'analytics',
        message: 'SENTRY is enabled',
        level: 'info',
      });
      this.enableSegmentCom();
    } else {
      console.debug('SENTRY is not enabled');
      console.debug('Segment.com is not enabled');
    }
  }

  codePushStatusDidChange(status) {
    switch (status) {
      case codePush.SyncStatus.CHECKING_FOR_UPDATE:
        console.log('Checking for updates.');
        break;
      case codePush.SyncStatus.DOWNLOADING_PACKAGE:
        console.log('Downloading package.');
        break;
      case codePush.SyncStatus.INSTALLING_UPDATE:
        console.log('Installing update.');
        break;
      case codePush.SyncStatus.UP_TO_DATE:
        console.log('Up-to-date.');
        break;
      case codePush.SyncStatus.UPDATE_INSTALLED:
        console.log('Update installed.');
        break;
    }
  }

  componentWillUnmount() {
    if (analyticsEnabled) Analytics.flush();
  }

  enableSegmentCom() {
    // FIXME: Analytics is already set up, cannot perform setup twice.
    Analytics.setup(config.SEGMENT_API, segmentOptions);
    Sentry.captureBreadcrumb({
      category: 'analytics',
      message: 'Segment.com is enabled',
      level: 'info',
    });
  }

  _renderLoading = (
    <ImageBackground source={require('./assets/images/bg.png')} resizeMode="repeat" style={styles.container}>
      <ActivityIndicator size="large" color={colors.black} />
    </ImageBackground>
  );

  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={this._renderLoading} persistor={persistor}>
          <Root>
            <AppNavigation />
          </Root>
        </PersistGate>
      </Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default codePush(App);
