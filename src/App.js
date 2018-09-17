// @flow

import React from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Root } from 'native-base';
import { Sentry } from 'react-native-sentry';
import Analytics, {
  AnalyticsConstants,
} from 'react-native-analytics-segment-io';

import configureStore from './store';
import AppNavigation from './navigation';
import colors from './config/colors';

const { store, persistor } = configureStore();
const segmentOptions = {
  [AnalyticsConstants.enableAdvertisingTracking]: false,
};

export default class App extends React.Component<*> {
  constructor() {
    super();

    console.debug(`NODE_ENV = ${process.env.NODE_ENV}`);

    if (process.env.NODE_ENV === 'production') {
      const config = require('../config-prod.json');
      Sentry.config(config.SENTRY_URL).install();
      console.debug('SENTRY is enabled');
      this.enableSegmentCom();
    } else {
      console.debug('SENTRY is not enabled');
      console.debug('Segment.com is not enabled');
    }
  }

  enableSegmentCom() {
    Analytics.setup('mwaeNhGqPtBvyA3wPZbvzvOLk3mRcrNG', segmentOptions);
    console.debug('Segment.com is enabled');
  }

  _renderLoading = () => (
    <ImageBackground
      source={require('./assets/images/bg.png')}
      resizeMode="repeat"
      style={styles.container}>
      <ActivityIndicator size="large" color={colors.black} />
    </ImageBackground>
  );

  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={this._renderLoading()} persistor={persistor}>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
