// @flow

import React, { Component } from 'react';
// $FlowFixMe
import { BackHandler } from 'react-native';
import { connect } from 'react-redux';
// $FlowFixMe
import { addNavigationHelpers, NavigationActions } from 'react-navigation';
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
