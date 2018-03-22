// @flow

import React, { Component } from 'react';
import { BackHandler } from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';

import { initializeSendBird, sendToken } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import type { Dispatch, UserData, ReduxState } from '../types';
import type { NavigationState } from '../types/navigationReducer';
import { registerPushNotifications } from '../utils/push';
import * as ui from '../utils/ui';

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
    const { isLoggedIn, userData } = this.props;
    // @TODO: use redux with
    // this.setState({ rehydrated: true });

    if (isLoggedIn && userData) {
      initializeSendBird(userData)
        .then(() => {
          console.debug('SendBird: initialized');
          return registerPushNotifications();
          // dispatch({ type: LOGIN_SUCCESS, payload: userData });
        })
        .then(pushToken => {
          if (pushToken) return sendToken(pushToken, userData);
        })
        .catch(err => {
          console.debug(err);
          ui.showToast(err.message);
          // dispatch({ type: LOGIN_FAIL });
        });

      this.notificationListener = FCM.on(FCMEvent.Notification, async (notif) => {
        if (notif.sendbird) {
          // navigate to orderThread
        }
        console.log(notif);
      });
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    this.notificationListener.remove();
  }

  onBackPress = () => {
    const { dispatch, navigationState } = this.props;
    console.log(navigationState.stateForLoggedIn);
    // if (navigationState.stateForLoggedIn.index === 0) {
    //   return false;
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
