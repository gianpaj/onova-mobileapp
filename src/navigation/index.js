// @flow

import React, { Component } from 'react';
// $FlowFixMe
import { BackHandler } from 'react-native';
import { connect } from 'react-redux';
// $FlowFixMe
import { addNavigationHelpers, NavigationActions } from 'react-navigation';

import { initializeSendBird } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import type { Dispatch, UserData, ReduxState } from '../types';

type Props = {
  dispatch?: Dispatch,
  navigationState?: any,
  isLoggedIn?: boolean,
  userData?: UserData,
};

class AppNavigation extends Component<Props, void> {
  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    const { isLoggedIn, userData } = this.props;
    // @TODO: use redux with
    // this.setState({ rehydrated: true });
    if (isLoggedIn === true && userData) {
      initializeSendBird(userData)
        .then(() => {
          console.debug('sendbird initialized');
          // dispatch({ type: LOGIN_SUCCESS, payload: userData });
        })
        .catch(err => {
          console.warn(err);
          // dispatch({ type: LOGIN_FAIL });
        });
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress = () => {
    const { dispatch, navigationState } = this.props;
    if (navigationState.stateForLoggedIn.index <= 1) {
      BackHandler.exitApp();
      return;
    }
    dispatch(NavigationActions.back());
    return true;
  };

  render() {
    const { dispatch, navigationState, isLoggedIn } = this.props;
    const state = isLoggedIn
      ? navigationState.stateForLoggedIn
      : navigationState.stateForLoggedOut;
    return (
      <NavigationStack navigation={addNavigationHelpers({ dispatch, state })} />
    );
  }
}

const mapStateToProps: any = (state: ReduxState) => ({
  isLoggedIn: state.LoginReducer.isLoggedIn,
  navigationState: state.NavigationReducer,
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(AppNavigation);
