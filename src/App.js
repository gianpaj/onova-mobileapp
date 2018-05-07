// @flow

import React from 'react';
// prettier-ignore
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  View,
} from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Root } from 'native-base';
import * as firebase from 'firebase';
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
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: '***REMOVED***',
      authDomain: 'onova-183307.firebaseapp.com',
      databaseURL: 'https://onova-183307.firebaseio.com',
      projectId: 'onova-183307',
      storageBucket: 'onova-183307.appspot.com',
      messagingSenderId: '530398476253',
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    if (
      process.env.NODE_ENV == 'prod' ||
      process.env.NODE_ENV == 'production'
    ) {
      console.debug(`Running in ${process.env.NODE_ENV} environment`);
    } else {
      console.warn(`Running in ${process.env.NODE_ENV} environment`);
    }

    if (process.env.NODE_ENV == 'production') {
      const config = require('../config-prod.json');
      Sentry.config(config.SENTRY_URL).install();
      console.debug('SENTRY is enabled');
    } else {
      console.debug('SENTRY is not enabled');
    }
  }

  // _handleAppStateChange = (nextAppState: any) => {
  //   const sb = SendBird.getInstance();
  //   if (sb) {
  //     if (
  //       this.state.appState.match(/inactive|background/) &&
  //       nextAppState === 'active'
  //     ) {
  //       console.debug('appstate - foreground');
  //       sb.setForegroundState();
  //     } else {
  //       console.debug('appstate - background');
  //       sb.setBackgroundState();
  //     }
  //   }
  //   this.setState({ appState: nextAppState });
  // };

  // componentDidMount() {
  //   AppState.addEventListener('change', this._handleAppStateChange);
  // }

  // componentWillUnmount() {
  //   AppState.removeEventListener('change', this._handleAppStateChange);
  // }

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
