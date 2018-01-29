// @flow

import React from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Root } from 'native-base';

// import Notifications from 'react-native-push-notification';
import * as firebase from 'firebase';

import configureStore from './store';
import AppNavigation from './navigation';
import KeyboardManager from 'react-native-keyboard-manager';

if (Platform.OS == 'ios') {
  KeyboardManager.setToolbarPreviousNextButtonEnable(true);
}

const { store, persistor } = configureStore();
let sb = null;

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
  }

  _handleAppStateChange = (nextAppState: any) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('appstate - foreground');
      if (sb) {
        sb.setForegroundState();
      }
    } else {
      console.log('appstate - background');
      if (sb) {
        sb.setBackgroundState();
      }
    }
  };

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);

  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
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
