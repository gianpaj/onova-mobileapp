// @flow

import React from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Root } from 'native-base';
import { Sentry } from 'react-native-sentry';

import configureStore from './store';
import AppNavigation from './navigation';

const { store, persistor } = configureStore();

type State = {
  appState: AppState,
};

export default class App extends React.Component<*, State> {
  state = {
    appState: AppState.currentState,
  };

  constructor() {
    super();

    console.debug(`Running in ${process.env.NODE_ENV} environment`);

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
            {/* $FlowFixMe */}
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
