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
import KeyboardManager from 'react-native-keyboard-manager';
import SendBird from 'sendbird';
import * as firebase from 'firebase';

import configureStore from './store';
import AppNavigation from './navigation';

if (Platform.OS == 'ios') {
  KeyboardManager.setToolbarPreviousNextButtonEnable(true);
}

const { store, persistor } = configureStore();

type State = {
  appState: AppState,
};

export default class App extends React.Component<*, State> {
  // $FlowFixMe
  sb;
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
    this.sb = SendBird.getInstance();
  }

  _handleAppStateChange = (nextAppState: any) => {
    if (this.sb) {
      if (
        this.state.appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.debug('appstate - foreground');
        this.sb.setForegroundState();
      } else {
        console.debug('appstate - background');
        this.sb.setBackgroundState();
      }
    }
    this.setState({ appState: nextAppState });
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
