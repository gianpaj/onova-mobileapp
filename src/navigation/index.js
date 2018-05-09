// @flow

import React, { Component } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';
import { Sentry } from 'react-native-sentry';

import { sendToken, logout, initializePusher } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import NavigationService from './NavigationService';
import type { Dispatch, UserData, ReduxState } from '../types';
import type { NavigationState } from '../types/navigationReducer';
import { registerPushNotifications } from '../utils/push';
import * as ui from '../utils/ui';
import * as api from '../utils/api';

type Props = {
  dispatch: Dispatch,
  navigationState: NavigationState,
  isLoggedIn: boolean,
  userData?: UserData,
};

type State = {
  ready: boolean,
};

// on Android, the URI prefix typically contains a host in addition to scheme
// const prefix = Platform.OS == 'android' ? 'onova://onova/' : 'onova://';

class AppNavigation extends Component<Props, State> {
  notificationListener;

  state = {
    ready: false,
  };

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    const { isLoggedIn, userData, dispatch } = this.props;

    // FIXME: horrible hack
    NavigationService.setDispatcher(dispatch);

    if (isLoggedIn && userData) {
      // retrying to login to verify user is still valid
      const { token } = userData;
      return api
        .get(`/api/users/${userData._id}/personal`, { token })
        .then(() => registerPushNotifications())
        .then(pushToken => {
          console.debug('Push notifications: initialized');
          if (pushToken) return sendToken(pushToken, userData);
        })
        .then(() => {
          if (process.env.NODE_ENV == 'production') {
            Sentry.setUserContext({
              email: userData.emailAddress,
              userID: userData._id,
              username: userData.username,
              extra: {
                accountStatus: userData.accountStatus,
              },
            });
          }
        })
        .then(() => initializePusher(userData))
        .then(() => this.setState({ ready: true }))
        .catch(err => {
          console.debug(err);
          dispatch(logout());
          ui.showToast(err.message, 'danger');
        });
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    this.notificationListener.remove();
  }

  onBackPress = () => {
    const { dispatch } = this.props;
    // FIXME: the hardware back button should to go back to Login screen from the Signup page
    // if (navigationState.stateForLoggedOut.routes[0].routeName == 'login') {
    //   dispatch(goback());
    //   return true;
    // }
    dispatch(NavigationActions.back());
    return true;
  };

  _renderLoading = () => (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );

  render() {
    const { dispatch, navigationState, isLoggedIn } = this.props;
    const state =
      isLoggedIn == true
        ? navigationState.stateForLoggedIn
        : navigationState.stateForLoggedOut;

    if (!this.state.ready) return this._renderLoading();

    return (
      <NavigationStack
        navigation={addNavigationHelpers({
          dispatch,
          state,
          addListener: createReduxBoundAddListener('root'),
        })}
      />
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

const mapStateToProps: any = (state: ReduxState) => ({
  isLoggedIn: state.LoginReducer.isLoggedIn,
  navigationState: state.NavigationReducer,
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(AppNavigation);
