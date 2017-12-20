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

import configureStore from './store';
import AppNavigation from './navigation';

import { Root } from 'native-base';

import * as firebase from 'firebase';

const { store, persistor } = configureStore();

type State = {
  userData: any,
};
export default class LoginScreen extends React.Component<*, State> {
  state = {
    userData: null,
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
    firebase.initializeApp(firebaseConfig);
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
