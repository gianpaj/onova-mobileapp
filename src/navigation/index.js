// @flow

import React, { Component } from 'react';
import { BackHandler } from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';

import { sendToken, logout } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
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

class AppNavigation extends Component<Props, void> {
  notificationListener;

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    const { isLoggedIn, userData, dispatch } = this.props;
    // TODO: use redux with
    // this.setState({ rehydrated: true });

    if (isLoggedIn && userData) {
      // retry to login to verify user is still valid
      const { token } = userData;
      return api
        .get(`/api/users/${userData._id}/personal`, { token })
        .then(() => registerPushNotifications())
        .then(pushToken => {
          console.debug('Push notifications: initialized');
          if (pushToken) return sendToken(pushToken, userData);
        })
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

  render() {
    const { dispatch, navigationState, isLoggedIn } = this.props;
    const state =
      isLoggedIn == true
        ? navigationState.stateForLoggedIn
        : navigationState.stateForLoggedOut;
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

const mapStateToProps: any = (state: ReduxState) => ({
  isLoggedIn: state.LoginReducer.isLoggedIn,
  navigationState: state.NavigationReducer,
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(AppNavigation);
