// @flow

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  // $FlowFixMe
} from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';

import { Root } from 'native-base';

import { initializeApp } from 'firebase';

import configureStore from './store';
import AppNavigation from './navigation';

import KeyboardManager from 'react-native-keyboard-manager';
KeyboardManager.setToolbarPreviousNextButtonEnable(true);

const { store, persistor } = configureStore();

export default class LoginScreen extends React.Component<*> {
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
    initializeApp(firebaseConfig);
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
