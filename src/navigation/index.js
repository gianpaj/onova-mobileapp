// @flow

import React, { Component } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
import { createReduxBoundAddListener } from 'react-navigation-redux-helpers';

import { checkLogin, logout } from '../actions/actionCreator';
import NavigationStack from './navigationStack';
import NavigationService from './NavigationService';

import type { Dispatch, ReduxState } from '../types';
import type { NavigationState } from '../types/navigationReducer';

type Props = {
  checkedLoggedIn: boolean,
  dispatch: Dispatch,
  isLoggedIn: boolean,
  navigationState: NavigationState,
  userData?: UserData,
  token?: string,
};

// on Android, the URI prefix typically contains a host in addition to scheme
// const prefix = Platform.OS == 'android' ? 'onova://onova/' : 'onova://';

class AppNavigation extends Component<Props, *> {
  notificationListener;

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
    const { isLoggedIn, userData, token, dispatch } = this.props;

    // FIXME: horrible hack
    NavigationService.setDispatcher(dispatch);

    if (isLoggedIn && token) {
      // checking again if user is still logged in
      dispatch(checkLogin(userData, token)).catch(e => {
        if (e.message == 'Invalid user') {
          dispatch(logout());
        }
        console.warn(e);
      });
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
    this.notificationListener && this.notificationListener.remove();
  }

  onBackPress = () => {
    this.props.dispatch(NavigationActions.back());
    return true;
  };

  _renderLoading = () => (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      resizeMode="repeat"
      style={styles.container}>
      <ActivityIndicator size="large" />
    </ImageBackground>
  );

  render() {
    const {
      dispatch,
      navigationState,
      isLoggedIn,
      checkedLoggedIn,
    } = this.props;
    const state =
      isLoggedIn == true
        ? navigationState.stateForLoggedIn
        : navigationState.stateForLoggedOut;

    if (isLoggedIn && !checkedLoggedIn) return this._renderLoading();

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
    width: '100%',
    height: '100%',
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  checkedLoggedIn: state.LoginReducer.checkedLoggedIn,
  isLoggedIn: state.LoginReducer.isLoggedIn,
  navigationState: state.NavigationReducer,
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export default connect(mapStateToProps)(AppNavigation);
