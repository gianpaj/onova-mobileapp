// @flow

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Root } from 'native-base';
import { Sentry } from 'react-native-sentry';

import configureStore from './store';
import AppNavigation from './navigation';

const { store, persistor } = configureStore();

export default class App extends React.Component<*> {
  constructor() {
    super();

    console.debug(`NODE_ENV = ${process.env.NODE_ENV}`);

    if (process.env.NODE_ENV == 'production') {
      const config = require('../config-prod.json');
      Sentry.config(config.SENTRY_URL).install();
      console.debug('SENTRY is enabled');
    } else {
      console.debug('SENTRY is not enabled');
    }
  }

  _renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
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
